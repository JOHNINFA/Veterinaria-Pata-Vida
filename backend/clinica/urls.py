from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"veterinarios", views.VeterinarioPublicoViewSet, basename="veterinario")
router.register(r"solicitudes-cita", views.SolicitudCitaViewSet, basename="solicitud-cita")
router.register(r"tutores", views.TutorViewSet, basename="tutor")
router.register(r"pacientes", views.PacienteViewSet, basename="paciente")
router.register(r"consultas", views.ConsultaViewSet, basename="consulta")
router.register(r"preventivos", views.PreventivoViewSet, basename="preventivo")

urlpatterns = [
    path("resumen/", views.resumen, name="clinica-resumen"),
    path("", include(router.urls)),
]
