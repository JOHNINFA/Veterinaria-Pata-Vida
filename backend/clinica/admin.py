from django.contrib import admin

from .models import Consulta, Paciente, Prescripcion, Preventivo, SolicitudCita, Tutor, Veterinario


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
    list_display = ["nombre_mascota", "nombre_tutor", "telefono", "fecha_preferida", "estado"]
    list_filter = ["estado"]
    list_editable = ["estado"]
