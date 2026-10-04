from django.contrib import admin

from .models import (
    Cobro, Consulta, ItemCobro, Paciente, Prescripcion, Preventivo, Servicio, SolicitudCita, Tutor,
    Veterinario,
)


@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = ["nombre", "matricula", "especialidad", "es_publico"]


class PacienteInline(admin.TabularInline):
    model = Paciente
    extra = 0
    fields = ["numero_historia", "nombre", "especie", "raza", "sexo"]
    readonly_fields = ["numero_historia"]


@admin.register(Tutor)
class TutorAdmin(admin.ModelAdmin):
    list_display = ["__str__", "numero_documento", "telefono", "autoriza_datos"]
    search_fields = ["nombres", "apellidos", "numero_documento"]
    readonly_fields = ["autoriza_datos_en"]
    inlines = [PacienteInline]


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ["numero_historia", "nombre", "especie", "raza", "tutor", "fallecido"]
    list_filter = ["especie", "sexo", "esterilizado", "fallecido"]
    search_fields = ["nombre", "numero_historia", "microchip", "tutor__numero_documento"]
    readonly_fields = ["numero_historia"]


class PrescripcionInline(admin.TabularInline):
    model = Prescripcion
    extra = 0


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ["paciente", "fecha", "tipo", "veterinario", "cerrada"]
    list_filter = ["tipo", "cerrada"]
    search_fields = ["paciente__nombre", "diagnostico"]
    inlines = [PrescripcionInline]

    def get_readonly_fields(self, request, obj=None):
        # Consulta firmada = solo lectura también en el admin.
        if obj and obj.cerrada:
            return [f.name for f in obj._meta.fields]
        return ["cerrada", "cerrada_en"]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Preventivo)
class PreventivoAdmin(admin.ModelAdmin):
    list_display = ["paciente", "tipo", "producto", "aplicado_el", "proxima_dosis"]
    list_filter = ["tipo"]


@admin.register(SolicitudCita)
class SolicitudCitaAdmin(admin.ModelAdmin):
    list_display = ["nombre_mascota", "nombre_tutor", "telefono", "fecha_preferida", "estado", "paciente"]
    raw_id_fields = ["paciente", "consulta"]
    list_filter = ["estado"]
    list_editable = ["estado"]


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ["nombre", "precio", "activo"]
    list_editable = ["precio", "activo"]


class ItemCobroInline(admin.TabularInline):
    model = ItemCobro
    extra = 0
    readonly_fields = ["servicio", "descripcion", "cantidad", "precio_unitario"]
    can_delete = False


@admin.register(Cobro)
class CobroAdmin(admin.ModelAdmin):
    """Solo consulta: los cobros se crean, pagan y anulan desde el panel (con sus reglas)."""
    list_display = ["numero", "paciente", "total", "estado", "metodo_pago", "creado", "pagado_en"]
    list_filter = ["estado", "metodo_pago"]
    search_fields = ["numero", "paciente__nombre", "paciente__tutor__numero_documento"]
    inlines = [ItemCobroInline]

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in Cobro._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
