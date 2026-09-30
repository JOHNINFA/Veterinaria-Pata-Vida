"""
Roles del módulo clínico (se manejan con Grupos de Django):

- "veterinario": acceso total a lo clínico. Es el único que crea consultas,
  formula y las cierra (Ley 576 de 2000, art. 60).
- "recepcion": registra tutores y pacientes, gestiona solicitudes de cita y ve
  el panel de vencimientos. NO ve diagnósticos ni fórmulas (reserva de la
  historia clínica, art. 61).

Los datos clínicos siempre exigen sesión iniciada (JWT).
"""
from rest_framework.permissions import BasePermission

GRUPO_VETERINARIO = "veterinario"
GRUPO_RECEPCION = "recepcion"


def es_veterinario(user) -> bool:
    return bool(user and user.is_authenticated and user.groups.filter(name=GRUPO_VETERINARIO).exists())


def es_recepcion(user) -> bool:
    return bool(user and user.is_authenticated and user.groups.filter(name=GRUPO_RECEPCION).exists())


class EsVeterinario(BasePermission):
    """Solo médicos veterinarios: consultas, fórmulas, vacunas, historia completa."""
    message = "Esta información es reservada: solo la puede ver un médico veterinario."

    def has_permission(self, request, view):
        return es_veterinario(request.user)


class EsPersonalClinica(BasePermission):
    """Veterinarios y recepción: tutores, pacientes, citas y vencimientos."""
    message = "Debes iniciar sesión con una cuenta del personal de la clínica."

    def has_permission(self, request, view):
        return es_veterinario(request.user) or es_recepcion(request.user)
