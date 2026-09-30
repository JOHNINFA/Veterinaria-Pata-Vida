"""
Pruebas de las reglas de negocio y seguridad del módulo clínico.
Uso:  python manage.py test clinica
"""
from datetime import timedelta

from django.contrib.auth.models import Group, User
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Consulta, Paciente, Preventivo, Tutor, Veterinario
from .permissions import GRUPO_RECEPCION, GRUPO_VETERINARIO

API = "/api/clinica"


class BaseClinica(APITestCase):
    def setUp(self):
        cache.clear()  # reinicia los contadores de límite de peticiones
        self.vet = User.objects.create_user("vet", password="clave-segura-123", first_name="Ana")
        self.vet.groups.add(Group.objects.create(name=GRUPO_VETERINARIO))
        Veterinario.objects.create(usuario=self.vet, matricula="MVZ-TEST-1")
        self.recep = User.objects.create_user("recep", password="clave-segura-123")
        self.recep.groups.add(Group.objects.create(name=GRUPO_RECEPCION))
        self.otro = User.objects.create_user("cliente", password="clave-segura-123")  # sin rol

        self.tutor = Tutor.objects.create(
            nombres="Ana", apellidos="Test", numero_documento="123", telefono="300", autoriza_datos=True,
        )
        self.paciente = Paciente.objects.create(tutor=self.tutor, nombre="Max", especie="PERRO", sexo="M")

    def como(self, user):
        self.client.force_authenticate(user=user)


class AccesoPublicoTests(BaseClinica):
    def test_perfil_veterinario_es_publico(self):
        r = self.client.get(f"{API}/veterinarios/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["results"][0]["matricula"], "MVZ-TEST-1")

    def test_solicitud_cita_publica(self):
        r = self.client.post(f"{API}/solicitudes-cita/", {
            "nombre_tutor": "Pedro", "telefono": "300", "nombre_mascota": "Toby", "especie": "PERRO",
            "fecha_preferida": timezone.localdate() + timedelta(days=1), "acepta_datos": True,
        })
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["estado"], "PENDIENTE")

    def test_solicitud_sin_autorizar_datos_es_rechazada(self):
        r = self.client.post(f"{API}/solicitudes-cita/", {
            "nombre_tutor": "Pedro", "telefono": "300", "nombre_mascota": "Toby", "especie": "PERRO",
            "fecha_preferida": timezone.localdate() + timedelta(days=1), "acepta_datos": False,
        })
        self.assertEqual(r.status_code, 400)

    def test_anonimo_no_ve_pacientes_ni_solicitudes(self):
        self.assertEqual(self.client.get(f"{API}/pacientes/").status_code, 401)
        self.assertEqual(self.client.get(f"{API}/solicitudes-cita/").status_code, 401)

    def test_usuario_sin_rol_no_entra(self):
        self.como(self.otro)
        self.assertEqual(self.client.get(f"{API}/pacientes/").status_code, 403)


class RolRecepcionTests(BaseClinica):
    def setUp(self):
        super().setUp()
        self.como(self.recep)

    def test_recepcion_gestiona_pacientes(self):
        self.assertEqual(self.client.get(f"{API}/pacientes/").status_code, 200)

    def test_recepcion_no_ve_consultas_ni_historia(self):
        # Reserva de la historia clínica (Ley 576, art. 61)
        self.assertEqual(self.client.get(f"{API}/consultas/").status_code, 403)
        self.assertEqual(self.client.get(f"{API}/pacientes/{self.paciente.id}/historia/").status_code, 403)

    def test_recepcion_ve_vencimientos_pero_no_registra_vacunas(self):
        self.assertEqual(self.client.get(f"{API}/preventivos/vencimientos/").status_code, 200)
        r = self.client.post(f"{API}/preventivos/", {
            "paciente": self.paciente.id, "tipo": "VACUNA", "producto": "Rabia",
        })
        self.assertEqual(r.status_code, 403)


class ConsultaTests(BaseClinica):
    def setUp(self):
        super().setUp()
        self.como(self.vet)

    def crear_consulta(self, **extra):
        datos = {
            "paciente": self.paciente.id, "motivo": "Control", "diagnostico": "Sano",
            "prescripciones": [{"medicamento": "Vitaminas", "via": "ORAL", "dosis": "1 tableta",
                                "frecuencia": "cada 24 horas", "duracion_dias": 30}],
        }
        datos.update(extra)
        return self.client.post(f"{API}/consultas/", datos, format="json")

    def test_el_veterinario_lo_pone_el_servidor(self):
        # Aunque el navegador mande otro veterinario, se firma con el usuario de la sesión.
        r = self.crear_consulta(veterinario=self.recep.id)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["veterinario"], self.vet.id)
        self.assertEqual(len(r.data["prescripciones"]), 1)

    def test_no_se_cierra_sin_diagnostico(self):
        r = self.crear_consulta(diagnostico="")
        cerrar = self.client.post(f"{API}/consultas/{r.data['id']}/cerrar/")
        self.assertEqual(cerrar.status_code, 400)

    def test_consulta_cerrada_es_de_solo_lectura(self):
        r = self.crear_consulta()
        cid = r.data["id"]
        self.assertEqual(self.client.post(f"{API}/consultas/{cid}/cerrar/").status_code, 200)

        editar = self.client.patch(f"{API}/consultas/{cid}/", {"diagnostico": "Cambiado"}, format="json")
        self.assertEqual(editar.status_code, 400)
        self.assertEqual(Consulta.objects.get(pk=cid).diagnostico, "Sano")
        self.assertEqual(Consulta.objects.get(pk=cid).prescripciones.count(), 1)

    def test_no_se_borran_pacientes_ni_consultas(self):
        r = self.crear_consulta()
        self.assertEqual(self.client.delete(f"{API}/consultas/{r.data['id']}/").status_code, 405)
        self.assertEqual(self.client.delete(f"{API}/pacientes/{self.paciente.id}/").status_code, 405)

    def test_historia_clinica_completa(self):
        self.crear_consulta()
        r = self.client.get(f"{API}/pacientes/{self.paciente.id}/historia/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data["consultas"]), 1)
        self.assertEqual(r.data["consultas"][0]["veterinario_matricula"], "MVZ-TEST-1")


class ReglasDeDatosTests(BaseClinica):
    def test_numero_de_historia_consecutivo(self):
        otro = Paciente.objects.create(tutor=self.tutor, nombre="Luna", especie="GATO", sexo="H")
        self.assertEqual(self.paciente.numero_historia, f"HC-{self.paciente.pk:06d}")
        self.assertEqual(otro.numero_historia, f"HC-{otro.pk:06d}")

    def test_tutor_sin_autorizacion_de_datos_es_rechazado(self):
        self.como(self.recep)
        r = self.client.post(f"{API}/tutores/", {
            "nombres": "Luis", "apellidos": "X", "numero_documento": "999", "telefono": "300",
            "autoriza_datos": False,
        })
        self.assertEqual(r.status_code, 400)

    def test_autorizacion_de_datos_registra_fecha(self):
        self.assertIsNotNone(self.tutor.autoriza_datos_en)

    def test_vencimientos_ignora_dosis_ya_reforzadas(self):
        hoy = timezone.localdate()
        # Dosis vieja vencida, pero ya le pusieron el refuerzo -> no debe salir.
        Preventivo.objects.create(paciente=self.paciente, tipo="VACUNA", producto="Rabia",
                                  aplicado_el=hoy - timedelta(days=400), proxima_dosis=hoy - timedelta(days=35))
        Preventivo.objects.create(paciente=self.paciente, tipo="VACUNA", producto="Rabia",
                                  aplicado_el=hoy - timedelta(days=30), proxima_dosis=hoy + timedelta(days=335))
        # Esta sí vence pronto.
        Preventivo.objects.create(paciente=self.paciente, tipo="DESPARASITACION_INT", producto="Pirantel",
                                  aplicado_el=hoy - timedelta(days=80), proxima_dosis=hoy + timedelta(days=10))
        self.como(self.recep)
        r = self.client.get(f"{API}/preventivos/vencimientos/?dias=30")
        self.assertEqual([p["producto"] for p in r.data], ["Pirantel"])


class AutenticacionTests(BaseClinica):
    def test_login_devuelve_tokens_y_rol(self):
        r = self.client.post("/api/auth/login/", {"username": "vet", "password": "clave-segura-123"})
        self.assertEqual(r.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        yo = self.client.get("/api/auth/yo/")
        self.assertEqual(yo.data["rol"], "veterinario")
        self.assertEqual(yo.data["matricula"], "MVZ-TEST-1")

    def test_login_con_clave_incorrecta(self):
        r = self.client.post("/api/auth/login/", {"username": "vet", "password": "mala"})
        self.assertEqual(r.status_code, 401)
