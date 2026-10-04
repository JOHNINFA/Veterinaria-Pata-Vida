from datetime import date
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Cobro, Consulta, ItemCobro, Paciente, Prescripcion, Preventivo, Servicio, SolicitudCita, Tutor,
    Veterinario,
)


# --------------------------------------------------------------------------- #
# Público
# --------------------------------------------------------------------------- #
class VeterinarioPublicoSerializer(serializers.ModelSerializer):
    """Lo único del personal que se muestra en la web pública."""
    nombre = serializers.CharField(read_only=True)

    class Meta:
        model = Veterinario
        fields = ["id", "nombre", "matricula", "especialidad", "bio", "foto"]


class SolicitudCitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudCita
        fields = ["id", "nombre_tutor", "telefono", "email", "nombre_mascota", "especie",
                  "fecha_preferida", "motivo", "acepta_datos", "estado", "creado"]
        read_only_fields = ["estado", "creado"]

    def validate_acepta_datos(self, valor):
        # Ley 1581 de 2012: sin autorización no podemos guardar los datos.
        if not valor:
            raise serializers.ValidationError("Debes aceptar la política de tratamiento de datos.")
        return valor

    def validate_fecha_preferida(self, valor):
        if valor < timezone.localdate():
            raise serializers.ValidationError("La fecha no puede estar en el pasado.")
        return valor


class SolicitudCitaGestionSerializer(SolicitudCitaSerializer):
    """Versión para recepción: puede cambiar el estado."""
    class Meta(SolicitudCitaSerializer.Meta):
        read_only_fields = ["creado"]


# --------------------------------------------------------------------------- #
# Tutores y pacientes (veterinario + recepción)
# --------------------------------------------------------------------------- #
class TutorSerializer(serializers.ModelSerializer):
    total_pacientes = serializers.IntegerField(source="pacientes.count", read_only=True)

    class Meta:
        model = Tutor
        fields = ["id", "nombres", "apellidos", "tipo_documento", "numero_documento", "telefono",
                  "email", "direccion", "autoriza_datos", "autoriza_datos_en", "total_pacientes",
                  "creado"]
        read_only_fields = ["autoriza_datos_en", "creado"]

    def validate_autoriza_datos(self, valor):
        if not valor:
            raise serializers.ValidationError(
                "El tutor debe autorizar el tratamiento de sus datos (Ley 1581 de 2012)."
            )
        return valor


class PacienteSerializer(serializers.ModelSerializer):
    tutor_nombre = serializers.CharField(source="tutor.__str__", read_only=True)
    tutor_telefono = serializers.CharField(source="tutor.telefono", read_only=True)
    edad = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = ["id", "numero_historia", "tutor", "tutor_nombre", "tutor_telefono", "nombre",
                  "especie", "raza", "sexo", "fecha_nacimiento", "edad", "color", "microchip",
                  "esterilizado", "alergias", "observaciones", "fallecido", "creado"]
        read_only_fields = ["numero_historia", "creado"]

    def get_edad(self, obj) -> str:
        """Edad legible: "3 años", "7 meses"."""
        if not obj.fecha_nacimiento:
            return ""
        hoy = date.today()
        meses = (hoy.year - obj.fecha_nacimiento.year) * 12 + hoy.month - obj.fecha_nacimiento.month
        if hoy.day < obj.fecha_nacimiento.day:
            meses -= 1
        if meses < 12:
            return f"{max(meses, 0)} {'mes' if meses == 1 else 'meses'}"
        anios = meses // 12
        return f"{anios} {'año' if anios == 1 else 'años'}"

    def validate_microchip(self, valor):
        return valor.strip()


# --------------------------------------------------------------------------- #
# Clínico (solo veterinario)
# --------------------------------------------------------------------------- #
class PrescripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescripcion
        fields = ["id", "medicamento", "principio_activo", "via", "dosis", "frecuencia",
                  "duracion_dias", "indicaciones"]


class ConsultaSerializer(serializers.ModelSerializer):
    """
    Consulta SOAP con su fórmula anidada: el veterinario guarda todo en un solo envío.
    El veterinario lo pone el servidor (usuario autenticado), nunca el navegador.
    """
    prescripciones = PrescripcionSerializer(many=True, required=False)
    paciente_nombre = serializers.CharField(source="paciente.nombre", read_only=True)
    veterinario_nombre = serializers.SerializerMethodField()
    veterinario_matricula = serializers.SerializerMethodField()

    class Meta:
        model = Consulta
        fields = ["id", "paciente", "paciente_nombre", "veterinario", "veterinario_nombre",
                  "veterinario_matricula", "fecha", "tipo", "motivo", "anamnesis", "peso_kg",
                  "temperatura_c", "frecuencia_cardiaca", "frecuencia_respiratoria", "mucosas",
                  "tllc_segundos", "hidratacion_pct", "condicion_corporal", "examen_fisico",
                  "diagnostico", "plan", "pronostico", "prescripciones", "cerrada", "cerrada_en"]
        read_only_fields = ["veterinario", "cerrada", "cerrada_en"]

    def get_veterinario_nombre(self, obj) -> str:
        return obj.veterinario.get_full_name() or obj.veterinario.username

    def get_veterinario_matricula(self, obj) -> str:
        perfil = getattr(obj.veterinario, "perfil_vet", None)
        return perfil.matricula if perfil else ""

    def validate(self, attrs):
        if self.instance and self.instance.cerrada:
            raise serializers.ValidationError("La consulta está cerrada y firmada; no se puede modificar.")
        if self.instance and "paciente" in attrs and attrs["paciente"] != self.instance.paciente:
            raise serializers.ValidationError({"paciente": "No se puede cambiar el paciente de una consulta."})
        return attrs

    def validate_condicion_corporal(self, valor):
        if valor is not None and not 1 <= valor <= 9:
            raise serializers.ValidationError("La condición corporal va de 1 a 9.")
        return valor

    @transaction.atomic  # o se guarda la consulta con toda su fórmula, o nada
    def create(self, validated_data):
        lineas = validated_data.pop("prescripciones", [])
        consulta = Consulta.objects.create(**validated_data)
        for linea in lineas:
            Prescripcion.objects.create(consulta=consulta, **linea)
        return consulta

    @transaction.atomic
    def update(self, instance, validated_data):
        lineas = validated_data.pop("prescripciones", None)
        instance = super().update(instance, validated_data)
        if lineas is not None:
            # Mientras la consulta esté abierta, la fórmula se reemplaza completa.
            instance.prescripciones.all().delete()
            for linea in lineas:
                Prescripcion.objects.create(consulta=instance, **linea)
        return instance


class PreventivoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source="paciente.nombre", read_only=True)
    tutor_nombre = serializers.CharField(source="paciente.tutor.__str__", read_only=True)
    tutor_telefono = serializers.CharField(source="paciente.tutor.telefono", read_only=True)
    dias_para_vencer = serializers.SerializerMethodField()

    class Meta:
        model = Preventivo
        fields = ["id", "paciente", "paciente_nombre", "tutor_nombre", "tutor_telefono", "tipo",
                  "producto", "lote", "aplicado_el", "proxima_dosis", "dias_para_vencer",
                  "veterinario", "creado"]
        read_only_fields = ["veterinario", "creado"]

    def get_dias_para_vencer(self, obj):
        if not obj.proxima_dosis:
            return None
        return (obj.proxima_dosis - timezone.localdate()).days

    def validate(self, attrs):
        aplicado = attrs.get("aplicado_el", getattr(self.instance, "aplicado_el", None))
        proxima = attrs.get("proxima_dosis", getattr(self.instance, "proxima_dosis", None))
        if aplicado and proxima and proxima <= aplicado:
            raise serializers.ValidationError(
                {"proxima_dosis": "La próxima dosis debe ser posterior a la fecha de aplicación."}
            )
        return attrs


class HistoriaClinicaSerializer(serializers.ModelSerializer):
    """Ficha completa del paciente: datos + consultas + preventivos (solo veterinario)."""
    tutor = TutorSerializer(read_only=True)
    consultas = ConsultaSerializer(many=True, read_only=True)
    preventivos = PreventivoSerializer(many=True, read_only=True)
    edad = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = ["id", "numero_historia", "nombre", "especie", "raza", "sexo", "fecha_nacimiento",
                  "edad", "color", "microchip", "esterilizado", "alergias", "observaciones",
                  "fallecido", "tutor", "consultas", "preventivos"]

    def get_edad(self, obj) -> str:
        return PacienteSerializer().get_edad(obj)


# --------------------------------------------------------------------------- #
# Caja (veterinario + recepción)
# --------------------------------------------------------------------------- #
class ServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servicio
        fields = ["id", "nombre", "precio"]


class ItemCobroSerializer(serializers.ModelSerializer):
    precio_unitario = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=Decimal("0"))
    descripcion = serializers.CharField(max_length=120, required=False, allow_blank=True)
    cantidad = serializers.IntegerField(min_value=1, max_value=999, default=1)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ItemCobro
        fields = ["id", "servicio", "descripcion", "cantidad", "precio_unitario", "subtotal"]

    def validate(self, attrs):
        servicio = attrs.get("servicio")
        # Si viene del catálogo, el precio y el nombre salen del catálogo salvo que se ajusten.
        if servicio:
            attrs.setdefault("precio_unitario", servicio.precio)
            if not attrs.get("descripcion"):
                attrs["descripcion"] = servicio.nombre
        if not attrs.get("descripcion"):
            raise serializers.ValidationError({"descripcion": "Escribe qué se está cobrando."})
        if attrs.get("precio_unitario") is None:
            raise serializers.ValidationError({"precio_unitario": "Indica el precio."})
        return attrs


class CobroSerializer(serializers.ModelSerializer):
    """
    Cuenta de cobro con sus líneas. El total SIEMPRE lo calcula el servidor;
    el estado solo cambia con las acciones pagar / anular.
    """
    items = ItemCobroSerializer(many=True)
    paciente_nombre = serializers.CharField(source="paciente.nombre", read_only=True)
    numero_historia = serializers.CharField(source="paciente.numero_historia", read_only=True)
    tutor_nombre = serializers.CharField(source="paciente.tutor.__str__", read_only=True)
    tutor_documento = serializers.SerializerMethodField()
    tutor_telefono = serializers.CharField(source="paciente.tutor.telefono", read_only=True)
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Cobro
        fields = ["id", "numero", "paciente", "paciente_nombre", "numero_historia", "tutor_nombre",
                  "tutor_documento", "tutor_telefono", "consulta", "estado", "metodo_pago", "items",
                  "total", "notas", "motivo_anulacion", "creado_por_nombre", "creado", "pagado_en"]
        read_only_fields = ["numero", "estado", "metodo_pago", "total", "motivo_anulacion", "creado",
                            "pagado_en"]

    def get_tutor_documento(self, obj) -> str:
        t = obj.paciente.tutor
        return f"{t.tipo_documento} {t.numero_documento}"

    def get_creado_por_nombre(self, obj) -> str:
        return obj.creado_por.get_full_name() or obj.creado_por.username

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Agrega al menos una línea.")
        return items

    def validate(self, attrs):
        if self.instance and self.instance.estado != "PENDIENTE":
            raise serializers.ValidationError("Un cobro pagado o anulado no se puede modificar.")
        paciente = attrs.get("paciente", getattr(self.instance, "paciente", None))
        consulta = attrs.get("consulta")
        if consulta and consulta.paciente_id != paciente.id:
            raise serializers.ValidationError({"consulta": "La consulta no es de este paciente."})
        if self.instance and "paciente" in attrs and attrs["paciente"] != self.instance.paciente:
            raise serializers.ValidationError({"paciente": "No se puede cambiar el paciente de un cobro."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        cobro = Cobro.objects.create(**validated_data)
        for item in items:
            ItemCobro.objects.create(cobro=cobro, **item)
        cobro.recalcular_total()
        return cobro

    @transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            instance.items.all().delete()
            for item in items:
                ItemCobro.objects.create(cobro=instance, **item)
        instance.recalcular_total()
        return instance
