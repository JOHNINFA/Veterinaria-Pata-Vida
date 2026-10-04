"""
API del módulo clínico. Todo vive bajo /api/clinica/.

Público (sin sesión):
  GET  /api/clinica/veterinarios/        perfil de los veterinarios
  POST /api/clinica/solicitudes-cita/    formulario "Solicitar cita" (con límite de envíos)

Personal (veterinario o recepción):
  /api/clinica/tutores/                  CRUD de tutores (sin borrar)
  /api/clinica/pacientes/                CRUD de pacientes (sin borrar)
  GET  /api/clinica/preventivos/vencimientos/?dias=30
  GET/PATCH /api/clinica/solicitudes-cita/

Solo veterinario:
  /api/clinica/consultas/                consultas SOAP + fórmula
  POST /api/clinica/consultas/{id}/cerrar/   firma la consulta (queda en solo lectura)
  GET  /api/clinica/pacientes/{id}/historia/ historia clínica completa
  POST/PATCH /api/clinica/preventivos/   registrar vacunas y desparasitaciones
  POST /api/clinica/consultas/{id}/enviar-formula/  envía la fórmula al correo del tutor

Caja (veterinario o recepción):
  GET  /api/clinica/servicios/           catálogo de precios
  /api/clinica/cobros/                   cuentas de cobro (sin borrar)
  POST /api/clinica/cobros/{id}/pagar/   {"metodo_pago": "EFECTIVO"}
  POST /api/clinica/cobros/{id}/anular/  {"motivo": "..."}
  GET  /api/clinica/cobros/caja/?fecha=YYYY-MM-DD   cierre de caja del día
"""
from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

from .correo import CorreoNoConfigurado, ErrorEnvioCorreo, enviar_correo
from .models import (
    Cobro, Consulta, Paciente, Preventivo, Servicio, SolicitudCita, Tutor, Veterinario,
)
from .permissions import EsPersonalClinica, EsVeterinario, es_recepcion, es_veterinario
from .serializers import (
    CobroSerializer, ConsultaSerializer, ServicioSerializer, HistoriaClinicaSerializer, PacienteSerializer, PreventivoSerializer,
    SolicitudCitaGestionSerializer, SolicitudCitaSerializer, TutorSerializer,
    VeterinarioPublicoSerializer,
)

def dosis_vigentes(hasta):
    """
    Última aplicación de cada paciente+producto con próxima dosis hasta `hasta`.
    Si ya le pusieron el refuerzo, la dosis anterior no cuenta como vencida.
    (Se deduplica en Python para que funcione igual en PostgreSQL y SQLite.)
    """
    vistos, resultado = set(), []
    qs = (
        Preventivo.objects.filter(paciente__fallecido=False, proxima_dosis__isnull=False)
        .select_related("paciente__tutor")
        .order_by("-aplicado_el", "-id")
    )
    for p in qs:
        clave = (p.paciente_id, p.producto.lower())
        if clave in vistos:
            continue
        vistos.add(clave)
        if p.proxima_dosis <= hasta:
            resultado.append(p)
    return sorted(resultado, key=lambda p: p.proxima_dosis)


# Sin DELETE: la historia clínica se conserva mínimo 5 años (guía MVZ).
SIN_BORRAR = ["get", "post", "put", "patch", "head", "options"]


# --------------------------------------------------------------------------- #
# Autenticación
# --------------------------------------------------------------------------- #
class LoginView(TokenObtainPairView):
    """POST usuario + contraseña -> tokens JWT (access y refresh). Con límite de intentos."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yo(request):
    """Quién soy y qué rol tengo: el frontend lo usa para mostrar u ocultar secciones."""
    user = request.user
    rol = "veterinario" if es_veterinario(user) else "recepcion" if es_recepcion(user) else None
    perfil = getattr(user, "perfil_vet", None)
    return Response({
        "id": user.id,
        "usuario": user.username,
        "nombre": user.get_full_name() or user.username,
        "rol": rol,
        "matricula": perfil.matricula if perfil else "",
    })


# --------------------------------------------------------------------------- #
# Público
# --------------------------------------------------------------------------- #
class VeterinarioPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = VeterinarioPublicoSerializer
    queryset = Veterinario.objects.filter(es_publico=True).select_related("usuario").order_by("id")


class SolicitudCitaViewSet(mixins.CreateModelMixin, mixins.ListModelMixin,
                           mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                           viewsets.GenericViewSet):
    queryset = SolicitudCita.objects.all()

    def get_permissions(self):
        # Crear es público (formulario de la web); ver y gestionar es del personal.
        if self.action == "create":
            return [AllowAny()]
        return [EsPersonalClinica()]

    def get_throttles(self):
        if self.action == "create":
            self.throttle_scope = "solicitudes"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_serializer_class(self):
        return SolicitudCitaSerializer if self.action == "create" else SolicitudCitaGestionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        estado = self.request.query_params.get("estado")
        return qs.filter(estado=estado) if estado else qs


# --------------------------------------------------------------------------- #
# Tutores y pacientes
# --------------------------------------------------------------------------- #
class TutorViewSet(viewsets.ModelViewSet):
    permission_classes = [EsPersonalClinica]
    serializer_class = TutorSerializer
    queryset = Tutor.objects.all()
    http_method_names = SIN_BORRAR
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombres", "apellidos", "numero_documento", "telefono"]


class PacienteViewSet(viewsets.ModelViewSet):
    permission_classes = [EsPersonalClinica]
    serializer_class = PacienteSerializer
    http_method_names = SIN_BORRAR
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "numero_historia", "microchip", "tutor__numero_documento",
                     "tutor__nombres", "tutor__apellidos"]

    def get_queryset(self):
        qs = Paciente.objects.select_related("tutor")
        tutor = self.request.query_params.get("tutor")
        return qs.filter(tutor_id=tutor) if tutor else qs

    @action(detail=True, methods=["get"], permission_classes=[EsVeterinario])
    def historia(self, request, pk=None):
        """Historia clínica completa. Reservada al veterinario (Ley 576, art. 61)."""
        paciente = get_object_or_404(
            Paciente.objects.select_related("tutor").prefetch_related(
                "consultas__prescripciones", "consultas__veterinario__perfil_vet", "preventivos"
            ),
            pk=pk,
        )
        return Response(HistoriaClinicaSerializer(paciente).data)


# --------------------------------------------------------------------------- #
# Clínico
# --------------------------------------------------------------------------- #
class ConsultaViewSet(viewsets.ModelViewSet):
    permission_classes = [EsVeterinario]
    serializer_class = ConsultaSerializer
    http_method_names = SIN_BORRAR

    def get_queryset(self):
        qs = Consulta.objects.select_related("paciente", "veterinario__perfil_vet").prefetch_related(
            "prescripciones"
        )
        paciente = self.request.query_params.get("paciente")
        return qs.filter(paciente_id=paciente) if paciente else qs

    def perform_create(self, serializer):
        # El veterinario que firma es el usuario con sesión, no un dato del formulario.
        serializer.save(veterinario=self.request.user)

    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

    @action(detail=True, methods=["post"])
    def cerrar(self, request, pk=None):
        """Firma la consulta. Desde aquí no se puede modificar (guía MVZ)."""
        consulta = self.get_object()
        if not consulta.diagnostico.strip():
            raise ValidationError("Registra el diagnóstico antes de cerrar la consulta.")
        try:
            consulta.cerrar()
        except DjangoValidationError as e:
            raise ValidationError(e.messages)
        return Response(self.get_serializer(consulta).data)

    @action(detail=True, methods=["post"], url_path="enviar-formula",
            throttle_classes=[ScopedRateThrottle])
    def enviar_formula(self, request, pk=None):
        """
        Envía la fórmula firmada al correo REGISTRADO del tutor.
        No acepta un correo libre: así la información reservada solo llega a su dueño.
        """
        consulta = self.get_object()
        if not consulta.cerrada:
            raise ValidationError("Firma la consulta antes de enviar la fórmula.")
        tutor = consulta.paciente.tutor
        if not tutor.email:
            raise ValidationError("El tutor no tiene correo registrado. Agrégalo en su ficha.")

        perfil = getattr(consulta.veterinario, "perfil_vet", None)
        html = render_to_string("clinica/formula_email.html", {
            "consulta": consulta,
            "paciente": consulta.paciente,
            "tutor": tutor,
            "prescripciones": consulta.prescripciones.all(),
            "veterinario": consulta.veterinario.get_full_name() or consulta.veterinario.username,
            "matricula": perfil.matricula if perfil else "",
        })
        try:
            enviar_correo(tutor.email, str(tutor),
                          f"Fórmula médica de {consulta.paciente.nombre} · PataVida", html)
        except CorreoNoConfigurado as e:
            return Response({"detail": str(e)}, status=503)
        except ErrorEnvioCorreo as e:
            return Response({"detail": f"No se pudo enviar el correo: {e}"}, status=502)
        return Response({"enviado_a": tutor.email})

    def get_throttles(self):
        if self.action == "enviar_formula":
            self.throttle_scope = "correos"
        return super().get_throttles()


class PreventivoViewSet(viewsets.ModelViewSet):
    serializer_class = PreventivoSerializer
    http_method_names = SIN_BORRAR

    def get_permissions(self):
        # Todo el personal puede CONSULTAR (para llamar al tutor);
        # solo el veterinario REGISTRA una vacuna o desparasitación.
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [EsPersonalClinica()]
        return [EsVeterinario()]

    def get_queryset(self):
        qs = Preventivo.objects.select_related("paciente__tutor")
        paciente = self.request.query_params.get("paciente")
        return qs.filter(paciente_id=paciente) if paciente else qs

    def perform_create(self, serializer):
        serializer.save(veterinario=self.request.user)

    @action(detail=False, methods=["get"])
    def vencimientos(self, request):
        """Vacunas/desparasitaciones que vencen en los próximos N días (y las ya vencidas)."""
        try:
            dias = max(1, min(int(request.query_params.get("dias", 30)), 365))
        except ValueError:
            dias = 30
        qs = dosis_vigentes(timezone.localdate() + timedelta(days=dias))
        return Response(self.get_serializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([EsPersonalClinica])
def resumen(request):
    """Números del tablero del panel."""
    hoy = timezone.localdate()
    datos = {
        "pacientes": Paciente.objects.filter(fallecido=False).count(),
        "tutores": Tutor.objects.count(),
        "solicitudes_pendientes": SolicitudCita.objects.filter(estado="PENDIENTE").count(),
        "vencen_30_dias": len(dosis_vigentes(hoy + timedelta(days=30))),
    }
    datos["cobrado_hoy"] = totales_caja(hoy)["total_pagado"]
    datos["cobros_pendientes"] = Cobro.objects.filter(estado="PENDIENTE").count()
    if es_veterinario(request.user):
        datos["consultas_abiertas"] = Consulta.objects.filter(cerrada=False).count()
        datos["consultas_hoy"] = Consulta.objects.filter(fecha__date=hoy).count()
    return Response(datos)


# --------------------------------------------------------------------------- #
# Caja
# --------------------------------------------------------------------------- #
class ServicioViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de precios. Se edita desde el admin de Django."""
    permission_classes = [EsPersonalClinica]
    serializer_class = ServicioSerializer
    queryset = Servicio.objects.filter(activo=True)
    pagination_class = None


def totales_caja(dia):
    """Lo cobrado en un día, total y por método de pago (solo cobros PAGADOS)."""
    pagados = Cobro.objects.filter(estado="PAGADO", pagado_en__date=dia)
    por_metodo = {m: Decimal("0") for m, _ in Cobro.METODOS}
    for fila in pagados.values("metodo_pago").annotate(suma=Sum("total")):
        por_metodo[fila["metodo_pago"]] = fila["suma"]
    return {
        "fecha": dia.isoformat(),
        "total_pagado": pagados.aggregate(s=Sum("total"))["s"] or Decimal("0"),
        "cantidad_pagados": pagados.count(),
        "por_metodo": por_metodo,
    }


class CobroViewSet(viewsets.ModelViewSet):
    permission_classes = [EsPersonalClinica]
    serializer_class = CobroSerializer
    # Sin DELETE: un cobro equivocado se ANULA con motivo, para que quede el rastro.
    http_method_names = SIN_BORRAR

    def get_queryset(self):
        qs = Cobro.objects.select_related("paciente__tutor", "creado_por").prefetch_related("items")
        params = self.request.query_params
        if params.get("estado"):
            qs = qs.filter(estado=params["estado"])
        if params.get("paciente"):
            qs = qs.filter(paciente_id=params["paciente"])
        if params.get("consulta"):
            qs = qs.filter(consulta_id=params["consulta"])
        if params.get("fecha"):
            try:
                qs = qs.filter(creado__date=date.fromisoformat(params["fecha"]))
            except ValueError:
                raise ValidationError({"fecha": "Usa el formato AAAA-MM-DD."})
        return qs

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def _accion(self, funcion, *args):
        cobro = self.get_object()
        try:
            funcion(cobro, *args)
        except DjangoValidationError as e:
            raise ValidationError(e.messages)
        return Response(self.get_serializer(cobro).data)

    @action(detail=True, methods=["post"])
    def pagar(self, request, pk=None):
        metodo = request.data.get("metodo_pago", "")
        if metodo not in dict(Cobro.METODOS):
            raise ValidationError({"metodo_pago": "Elige un método de pago válido."})
        return self._accion(Cobro.pagar, metodo)

    @action(detail=True, methods=["post"])
    def anular(self, request, pk=None):
        return self._accion(Cobro.anular, str(request.data.get("motivo", "")))

    @action(detail=False, methods=["get"])
    def caja(self, request):
        """Cierre de caja: lo cobrado en el día y lo que sigue pendiente."""
        try:
            dia = date.fromisoformat(request.query_params.get("fecha", ""))
        except ValueError:
            dia = timezone.localdate()
        datos = totales_caja(dia)
        pendientes = Cobro.objects.filter(estado="PENDIENTE")
        datos["pendientes_cantidad"] = pendientes.count()
        datos["pendientes_total"] = pendientes.aggregate(s=Sum("total"))["s"] or Decimal("0")
        return Response(datos)
