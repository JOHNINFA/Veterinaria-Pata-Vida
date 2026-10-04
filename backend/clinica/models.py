"""
Módulo clínico veterinario de PataVida.

Reglas que vienen de la normativa colombiana (ver README):
- Ley 576 de 2000, art. 61: la historia clínica es obligatoria, privada y reservada.
- Ley 576 de 2000, art. 60: solo el médico veterinario formula medicamentos.
- Guía del Consejo Profesional MVZ (2018): la historia se conserva mínimo 5 años,
  cada registro lleva el nombre y la matrícula del veterinario, y en formato
  electrónico no se puede modificar después de guardada.
- Ley 1581 de 2012: autorización expresa del tutor para tratar sus datos.

Por eso los pacientes y consultas usan on_delete=PROTECT (nunca se borran en
cascada) y una consulta cerrada queda en solo lectura.
"""
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Veterinario(models.Model):
    """Perfil profesional de un usuario con rol de veterinario."""
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil_vet"
    )
    matricula = models.CharField(max_length=40, help_text="Matrícula profesional (COMVEZCOL)")
    especialidad = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    # Ruta de una imagen servida por el frontend (ej. /veterinaria/dra-laura.jpg).
    # No usamos ImageField porque el disco de Render gratis se borra en cada deploy.
    foto = models.CharField(max_length=200, blank=True)
    es_publico = models.BooleanField(default=True, help_text="Mostrar en la web pública")

    class Meta:
        verbose_name_plural = "Veterinarios"

    def __str__(self):
        return f"{self.nombre} ({self.matricula})"

    @property
    def nombre(self):
        return self.usuario.get_full_name() or self.usuario.username


class Tutor(models.Model):
    """Propietario o responsable del animal (Ley 576, art. 22)."""
    TIPOS_DOC = [("CC", "Cédula de ciudadanía"), ("CE", "Cédula de extranjería"),
                 ("PAS", "Pasaporte"), ("NIT", "NIT")]

    nombres = models.CharField(max_length=80)
    apellidos = models.CharField(max_length=80)
    tipo_documento = models.CharField(max_length=3, choices=TIPOS_DOC, default="CC")
    numero_documento = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    direccion = models.CharField(max_length=200, blank=True)
    # Ley 1581 de 2012: guardamos si autorizó y cuándo.
    autoriza_datos = models.BooleanField(default=False)
    autoriza_datos_en = models.DateTimeField(null=True, blank=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["apellidos", "nombres"]
        verbose_name_plural = "Tutores"

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

    def save(self, *args, **kwargs):
        # La fecha de autorización se registra sola la primera vez que se marca.
        if self.autoriza_datos and not self.autoriza_datos_en:
            self.autoriza_datos_en = timezone.now()
        super().save(*args, **kwargs)


class Paciente(models.Model):
    ESPECIES = [("PERRO", "Perro"), ("GATO", "Gato"), ("AVE", "Ave"), ("CONEJO", "Conejo"),
                ("ROEDOR", "Roedor"), ("REPTIL", "Reptil"), ("OTRO", "Otro")]
    SEXOS = [("M", "Macho"), ("H", "Hembra")]

    tutor = models.ForeignKey(Tutor, on_delete=models.PROTECT, related_name="pacientes")
    # Número de historia único y consecutivo (lo pide la guía MVZ). Se genera solo.
    numero_historia = models.CharField(max_length=20, unique=True, editable=False)
    nombre = models.CharField(max_length=60)
    especie = models.CharField(max_length=10, choices=ESPECIES)
    raza = models.CharField(max_length=60, blank=True)
    sexo = models.CharField(max_length=1, choices=SEXOS)
    fecha_nacimiento = models.DateField(null=True, blank=True, help_text="Puede ser aproximada")
    color = models.CharField(max_length=60, blank=True)
    microchip = models.CharField(max_length=30, blank=True)
    esterilizado = models.BooleanField(default=False)
    alergias = models.TextField(blank=True, help_text="Se muestran destacadas en la ficha")
    observaciones = models.TextField(blank=True)
    fallecido = models.BooleanField(default=False)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nombre"]
        constraints = [
            # El microchip es opcional, pero si existe no se puede repetir.
            models.UniqueConstraint(
                fields=["microchip"], condition=~models.Q(microchip=""),
                name="microchip_unico_si_existe",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.numero_historia})"

    def save(self, *args, **kwargs):
        if not self.numero_historia:
            # Guardamos primero con un valor temporal para obtener el id,
            # y con ese id armamos el consecutivo: HC-000001, HC-000002...
            self.numero_historia = f"TMP-{uuid.uuid4().hex[:12]}"  # único y corto
            super().save(*args, **kwargs)
            self.numero_historia = f"HC-{self.pk:06d}"
            return super().save(update_fields=["numero_historia"])
        super().save(*args, **kwargs)


class Consulta(models.Model):
    """
    Una atención clínica, estructurada como nota SOAP:
    S (subjetivo/anamnesis), O (objetivo/examen físico), A (análisis/diagnóstico), P (plan).
    """
    TIPOS = [("PRIMERA", "Primera vez"), ("CONTROL", "Control"), ("URGENCIA", "Urgencia"),
             ("VACUNACION", "Vacunación"), ("OTRO", "Otro")]
    PRONOSTICOS = [("FAVORABLE", "Favorable"), ("RESERVADO", "Reservado"),
                   ("DESFAVORABLE", "Desfavorable")]

    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name="consultas")
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="consultas"
    )
    fecha = models.DateTimeField(default=timezone.now)
    tipo = models.CharField(max_length=12, choices=TIPOS, default="PRIMERA")
    motivo = models.TextField()

    # --- S: Subjetivo ---
    anamnesis = models.TextField(blank=True)

    # --- O: Objetivo (signos vitales + examen físico) ---
    peso_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperatura_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    frecuencia_cardiaca = models.PositiveSmallIntegerField(null=True, blank=True, help_text="lpm")
    frecuencia_respiratoria = models.PositiveSmallIntegerField(null=True, blank=True, help_text="rpm")
    mucosas = models.CharField(max_length=60, blank=True)
    tllc_segundos = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
        help_text="Tiempo de llenado capilar",
    )
    hidratacion_pct = models.PositiveSmallIntegerField(null=True, blank=True, help_text="% de deshidratación")
    condicion_corporal = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Escala 1 a 9")
    examen_fisico = models.TextField(blank=True)

    # --- A: Análisis ---
    diagnostico = models.TextField(blank=True, help_text="Presuntivo o definitivo")

    # --- P: Plan ---
    plan = models.TextField(blank=True)
    pronostico = models.CharField(max_length=12, choices=PRONOSTICOS, blank=True)

    # --- Cierre / firma ---
    cerrada = models.BooleanField(default=False)
    cerrada_en = models.DateTimeField(null=True, blank=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return f"Consulta {self.paciente.nombre} — {self.fecha:%Y-%m-%d}"

    def save(self, *args, **kwargs):
        # Una consulta cerrada es un documento firmado: no se puede modificar.
        if self.pk:
            original = Consulta.objects.filter(pk=self.pk).values("cerrada").first()
            if original and original["cerrada"]:
                raise ValidationError("La consulta está cerrada y firmada; no se puede modificar.")
        super().save(*args, **kwargs)

    def cerrar(self):
        """Firma la consulta: a partir de aquí queda en solo lectura."""
        if self.cerrada:
            raise ValidationError("La consulta ya estaba cerrada.")
        self.cerrada = True
        self.cerrada_en = timezone.now()
        # Llamamos al save() del padre para saltar el bloqueo de solo lectura una única vez.
        super().save(update_fields=["cerrada", "cerrada_en", "actualizado"])


class Prescripcion(models.Model):
    """Una línea de la fórmula médica (Ley 576, art. 60: solo la emite el veterinario)."""
    VIAS = [("ORAL", "Oral"), ("SC", "Subcutánea"), ("IM", "Intramuscular"), ("IV", "Intravenosa"),
            ("TOPICA", "Tópica"), ("OFTALMICA", "Oftálmica"), ("OTICA", "Ótica"), ("OTRA", "Otra")]

    consulta = models.ForeignKey(Consulta, on_delete=models.CASCADE, related_name="prescripciones")
    medicamento = models.CharField(max_length=120, help_text="Nombre comercial")
    principio_activo = models.CharField(max_length=120, blank=True)
    via = models.CharField(max_length=10, choices=VIAS, default="ORAL")
    dosis = models.CharField(max_length=60, help_text='Ej: "10 mg/kg" o "1 tableta"')
    frecuencia = models.CharField(max_length=60, help_text='Ej: "cada 12 horas"')
    duracion_dias = models.PositiveSmallIntegerField()
    indicaciones = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Prescripciones"

    def __str__(self):
        return f"{self.medicamento} {self.dosis} {self.frecuencia}"

    def save(self, *args, **kwargs):
        if self.consulta.cerrada:
            raise ValidationError("No se puede cambiar la fórmula de una consulta cerrada.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.consulta.cerrada:
            raise ValidationError("No se puede cambiar la fórmula de una consulta cerrada.")
        return super().delete(*args, **kwargs)


class Preventivo(models.Model):
    """Vacunas y desparasitaciones. La próxima dosis alimenta el panel de vencimientos."""
    TIPOS = [("VACUNA", "Vacuna"), ("DESPARASITACION_INT", "Desparasitación interna"),
             ("DESPARASITACION_EXT", "Desparasitación externa")]

    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name="preventivos")
    tipo = models.CharField(max_length=20, choices=TIPOS)
    producto = models.CharField(max_length=120)
    lote = models.CharField(max_length=40, blank=True)
    aplicado_el = models.DateField(default=timezone.localdate)
    proxima_dosis = models.DateField(null=True, blank=True, db_index=True)
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="preventivos"
    )
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-aplicado_el"]

    def __str__(self):
        return f"{self.get_tipo_display()} {self.producto} — {self.paciente.nombre}"


class SolicitudCita(models.Model):
    """
    Lo que llega desde el formulario público "Solicitar cita".
    No contiene datos clínicos: la recepción la confirma y luego se registra al paciente.
    """
    ESTADOS = [("PENDIENTE", "Pendiente"), ("CONFIRMADA", "Confirmada"), ("CANCELADA", "Cancelada")]

    nombre_tutor = models.CharField(max_length=120)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    nombre_mascota = models.CharField(max_length=60)
    especie = models.CharField(max_length=10, choices=Paciente.ESPECIES)
    fecha_preferida = models.DateField()
    motivo = models.TextField(blank=True)
    acepta_datos = models.BooleanField(default=False)
    estado = models.CharField(max_length=10, choices=ESTADOS, default="PENDIENTE")
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]
        verbose_name = "Solicitud de cita"
        verbose_name_plural = "Solicitudes de cita"

    def __str__(self):
        return f"{self.nombre_mascota} ({self.nombre_tutor}) — {self.fecha_preferida}"


# --------------------------------------------------------------------------- #
# Caja: servicios y cobros
# --------------------------------------------------------------------------- #
class Servicio(models.Model):
    """Catálogo de precios de la clínica (consulta, vacunas, baño...). Se administra en /admin."""
    nombre = models.CharField(max_length=80, unique=True)
    precio = models.DecimalField(max_digits=12, decimal_places=2)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} (${self.precio:,.0f})"


class Cobro(models.Model):
    """
    Cuenta de cobro de una atención. El total lo calcula el servidor a partir de las líneas.
    Un cobro pagado o anulado ya no se modifica (es un soporte contable).
    No reemplaza la factura electrónica de la DIAN.
    """
    ESTADOS = [("PENDIENTE", "Pendiente"), ("PAGADO", "Pagado"), ("ANULADO", "Anulado")]
    METODOS = [("EFECTIVO", "Efectivo"), ("TARJETA", "Tarjeta"),
               ("TRANSFERENCIA", "Transferencia"), ("NEQUI", "Nequi / Daviplata")]

    numero = models.CharField(max_length=20, unique=True, editable=False)
    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name="cobros")
    consulta = models.ForeignKey(
        Consulta, on_delete=models.PROTECT, null=True, blank=True, related_name="cobros"
    )
    estado = models.CharField(max_length=10, choices=ESTADOS, default="PENDIENTE")
    metodo_pago = models.CharField(max_length=15, choices=METODOS, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False)
    notas = models.CharField(max_length=200, blank=True)
    motivo_anulacion = models.CharField(max_length=200, blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="cobros_creados"
    )
    creado = models.DateTimeField(auto_now_add=True)
    pagado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-creado"]

    def __str__(self):
        return f"{self.numero} — {self.paciente.nombre}"

    def save(self, *args, **kwargs):
        if not self.numero:
            # Mismo truco que el número de historia: RC-000001, RC-000002...
            self.numero = f"TMP-{uuid.uuid4().hex[:12]}"
            super().save(*args, **kwargs)
            self.numero = f"RC-{self.pk:06d}"
            return super().save(update_fields=["numero"])
        super().save(*args, **kwargs)

    def recalcular_total(self):
        self.total = sum((i.subtotal for i in self.items.all()), 0)
        super().save(update_fields=["total"])

    def pagar(self, metodo):
        if self.estado != "PENDIENTE":
            raise ValidationError("Solo se puede pagar un cobro pendiente.")
        if not self.items.exists():
            raise ValidationError("El cobro no tiene líneas.")
        self.estado, self.metodo_pago, self.pagado_en = "PAGADO", metodo, timezone.now()
        super().save(update_fields=["estado", "metodo_pago", "pagado_en"])

    def anular(self, motivo):
        if self.estado == "ANULADO":
            raise ValidationError("El cobro ya estaba anulado.")
        if not motivo.strip():
            raise ValidationError("Indica el motivo de la anulación.")
        self.estado, self.motivo_anulacion = "ANULADO", motivo.strip()
        super().save(update_fields=["estado", "motivo_anulacion"])


class ItemCobro(models.Model):
    cobro = models.ForeignKey(Cobro, on_delete=models.CASCADE, related_name="items")
    servicio = models.ForeignKey(Servicio, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion = models.CharField(max_length=120)
    cantidad = models.PositiveSmallIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name_plural = "Líneas de cobro"

    def __str__(self):
        return f"{self.cantidad} x {self.descripcion}"

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario
