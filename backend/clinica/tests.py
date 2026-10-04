"""
Pruebas de las reglas de negocio y seguridad del módulo clínico.
Uso:  python manage.py test clinica
"""
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import Group, User
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Cobro, Consulta, Paciente, Preventivo, Servicio, Tutor, Veterinario
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


class EnvioFormulaTests(BaseClinica):
    def setUp(self):
        super().setUp()
        self.como(self.vet)
        self.tutor.email = "ana@example.com"
        self.tutor.save()
        r = self.client.post(f"{API}/consultas/", {
            "paciente": self.paciente.id, "motivo": "Control", "diagnostico": "Otitis",
            "prescripciones": [{"medicamento": "Gotas", "via": "OTICA", "dosis": "4 gotas",
                                "frecuencia": "cada 12 horas", "duracion_dias": 10}],
        }, format="json")
        self.cid = r.data["id"]
        self.url = f"{API}/consultas/{self.cid}/enviar-formula/"

    def test_no_se_envia_sin_firmar(self):
        self.assertEqual(self.client.post(self.url).status_code, 400)

    @patch("clinica.views.enviar_correo")
    def test_envia_al_correo_registrado_del_tutor(self, enviar):
        self.client.post(f"{API}/consultas/{self.cid}/cerrar/")
        # Aunque manden otro correo, solo se usa el registrado del tutor.
        r = self.client.post(self.url, {"email": "otro@example.com"}, format="json")
        self.assertEqual(r.status_code, 200)
        destino, _, asunto, html = enviar.call_args.args
        self.assertEqual(destino, "ana@example.com")
        self.assertIn("Max", asunto)
        self.assertIn("Gotas", html)
        self.assertIn("MVZ-TEST-1", html)

    def test_sin_configurar_responde_503(self):
        self.client.post(f"{API}/consultas/{self.cid}/cerrar/")
        with patch.dict("os.environ", {"BREVO_API_KEY": "", "CORREO_REMITENTE": ""}):
            self.assertEqual(self.client.post(self.url).status_code, 503)

    def test_recepcion_no_envia_formulas(self):
        self.client.post(f"{API}/consultas/{self.cid}/cerrar/")
        self.como(self.recep)
        self.assertEqual(self.client.post(self.url).status_code, 403)


class CajaTests(BaseClinica):
    def setUp(self):
        super().setUp()
        self.como(self.recep)
        self.consulta = Servicio.objects.create(nombre="Consulta general", precio=55000)

    def crear_cobro(self, **extra):
        datos = {"paciente": self.paciente.id, "items": [
            {"servicio": self.consulta.id},
            {"descripcion": "Gotas óticas", "cantidad": 2, "precio_unitario": "20000"},
        ]}
        datos.update(extra)
        return self.client.post(f"{API}/cobros/", datos, format="json")

    def test_el_total_lo_calcula_el_servidor(self):
        r = self.crear_cobro(total="1")  # un total enviado por el navegador se ignora
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["total"], "95000.00")
        self.assertEqual(r.data["items"][0]["descripcion"], "Consulta general")
        self.assertEqual(r.data["numero"], f"RC-{r.data['id']:06d}")
        self.assertEqual(r.data["estado"], "PENDIENTE")

    def test_cobro_sin_lineas_es_rechazado(self):
        self.assertEqual(self.crear_cobro(items=[]).status_code, 400)

    def test_pagado_no_se_modifica_ni_se_borra(self):
        cid = self.crear_cobro().data["id"]
        r = self.client.post(f"{API}/cobros/{cid}/pagar/", {"metodo_pago": "NEQUI"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["estado"], "PAGADO")
        editar = self.client.patch(f"{API}/cobros/{cid}/", {"items": [{"descripcion": "x", "precio_unitario": "1"}]},
                                   format="json")
        self.assertEqual(editar.status_code, 400)
        self.assertEqual(Cobro.objects.get(pk=cid).total, 95000)
        self.assertEqual(self.client.delete(f"{API}/cobros/{cid}/").status_code, 405)
        # Tampoco se cobra dos veces.
        otra = self.client.post(f"{API}/cobros/{cid}/pagar/", {"metodo_pago": "EFECTIVO"}, format="json")
        self.assertEqual(otra.status_code, 400)

    def test_metodo_de_pago_invalido(self):
        cid = self.crear_cobro().data["id"]
        r = self.client.post(f"{API}/cobros/{cid}/pagar/", {"metodo_pago": "BITCOIN"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_anular_exige_motivo(self):
        cid = self.crear_cobro().data["id"]
        self.assertEqual(self.client.post(f"{API}/cobros/{cid}/anular/", {}, format="json").status_code, 400)
        r = self.client.post(f"{API}/cobros/{cid}/anular/", {"motivo": "Error de digitación"}, format="json")
        self.assertEqual(r.data["estado"], "ANULADO")

    def test_cierre_de_caja_suma_solo_lo_pagado(self):
        pagado = self.crear_cobro().data["id"]
        self.client.post(f"{API}/cobros/{pagado}/pagar/", {"metodo_pago": "EFECTIVO"}, format="json")
        anulado = self.crear_cobro().data["id"]
        self.client.post(f"{API}/cobros/{anulado}/pagar/", {"metodo_pago": "TARJETA"}, format="json")
        self.client.post(f"{API}/cobros/{anulado}/anular/", {"motivo": "Devolución"}, format="json")
        self.crear_cobro()  # pendiente
        r = self.client.get(f"{API}/cobros/caja/")
        self.assertEqual(r.data["total_pagado"], 95000)
        self.assertEqual(r.data["por_metodo"]["EFECTIVO"], 95000)
        self.assertEqual(r.data["por_metodo"]["TARJETA"], 0)
        self.assertEqual(r.data["pendientes_cantidad"], 1)

    def test_consulta_de_otro_paciente_es_rechazada(self):
        otro = Paciente.objects.create(tutor=self.tutor, nombre="Luna", especie="GATO", sexo="H")
        c = Consulta.objects.create(paciente=otro, veterinario=self.vet, motivo="x")
        self.assertEqual(self.crear_cobro(consulta=c.id).status_code, 400)

    def test_anonimo_y_sin_rol_no_ven_la_caja(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(f"{API}/cobros/").status_code, 401)
        self.como(self.otro)
        self.assertEqual(self.client.get(f"{API}/cobros/").status_code, 403)
