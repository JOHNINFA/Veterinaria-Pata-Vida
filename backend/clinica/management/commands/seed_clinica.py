"""
Crea los roles, los usuarios demo y datos clínicos FICTICIOS para el panel.
Uso:  python manage.py seed_clinica

Contraseña de los usuarios demo:
- Se lee de la variable de entorno CLINICA_DEMO_PASSWORD.
- Si no existe, se genera una al azar y se imprime una sola vez.
Nunca se escribe una contraseña en el código.

Es idempotente: se puede correr en cada despliegue sin duplicar datos.
"""
import os
import secrets
from datetime import timedelta

from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from clinica.models import (
    Consulta, Paciente, Prescripcion, Preventivo, SolicitudCita, Tutor, Veterinario,
)
from clinica.permissions import GRUPO_RECEPCION, GRUPO_VETERINARIO

# Todos los datos son inventados (demo de portafolio).
TUTORES = [
    ("Camila", "Rojas Díaz", "1000000001", "3000000001", "camila.demo@example.com", "Cra 43A #1-50, Medellín"),
    ("Andrés", "Mejía Toro", "1000000002", "3000000002", "andres.demo@example.com", "Cl 10 #38-20, Medellín"),
    ("Valentina", "Gómez Ruiz", "1000000003", "3000000003", "", "Cra 70 #44-10, Medellín"),
]

PACIENTES = [
    # (doc_tutor, nombre, especie, raza, sexo, años, color, microchip, esterilizado, alergias)
    ("1000000001", "Max", "PERRO", "Golden Retriever", "M", 4, "Dorado", "900000000000001", True, "Penicilina"),
    ("1000000001", "Luna", "GATO", "Criolla", "H", 2, "Atigrada", "", True, ""),
    ("1000000002", "Rocky", "PERRO", "Bulldog Francés", "M", 6, "Atigrado", "900000000000003", False, ""),
    ("1000000003", "Nala", "GATO", "Siamés", "H", 1, "Crema", "", False, "Pollo (alimentaria)"),
]


class Command(BaseCommand):
    help = "Crea roles, usuarios demo y datos clínicos ficticios del panel veterinario"

    @transaction.atomic
    def handle(self, *args, **options):
        vet_group, _ = Group.objects.get_or_create(name=GRUPO_VETERINARIO)
        recep_group, _ = Group.objects.get_or_create(name=GRUPO_RECEPCION)

        password = os.getenv("CLINICA_DEMO_PASSWORD")
        generada = False
        if not password:
            password = secrets.token_urlsafe(9)
            generada = True

        vet = self._usuario("dra.laura", "Laura", "Restrepo (demo)", password, vet_group, generada)
        self._usuario("recepcion", "Recepción", "PataVida", password, recep_group, generada)

        Veterinario.objects.update_or_create(
            usuario=vet,
            defaults={
                "matricula": "MVZ-DEMO-0001",
                "especialidad": "Medicina interna de pequeños animales",
                "bio": (
                    "Perfil de demostración. Médica veterinaria con enfoque en medicina "
                    "preventiva de perros y gatos: vacunación, control de peso y chequeos "
                    "anuales. Atiende consulta general y urgencias leves."
                ),
                "foto": "/veterinaria/doctora.jpg",
                "es_publico": True,
            },
        )

        # --- Tutores ---
        tutores = {}
        for nombres, apellidos, doc, tel, email, direccion in TUTORES:
            tutor, _ = Tutor.objects.get_or_create(
                numero_documento=doc,
                defaults={"nombres": nombres, "apellidos": apellidos, "telefono": tel,
                          "email": email, "direccion": direccion, "autoriza_datos": True},
            )
            tutores[doc] = tutor

        # --- Pacientes ---
        hoy = timezone.localdate()
        pacientes = {}
        for doc, nombre, especie, raza, sexo, anios, color, chip, ester, alergias in PACIENTES:
            paciente = Paciente.objects.filter(tutor=tutores[doc], nombre=nombre).first()
            if not paciente:
                paciente = Paciente.objects.create(
                    tutor=tutores[doc], nombre=nombre, especie=especie, raza=raza, sexo=sexo,
                    fecha_nacimiento=hoy - timedelta(days=365 * anios + 40), color=color,
                    microchip=chip, esterilizado=ester, alergias=alergias,
                )
            pacientes[nombre] = paciente

        # --- Historia clínica (solo si el paciente aún no tiene consultas) ---
        max_ = pacientes["Max"]
        if not max_.consultas.exists():
            c = Consulta.objects.create(
                paciente=max_, veterinario=vet, fecha=timezone.now() - timedelta(days=45),
                tipo="PRIMERA", motivo="Prurito intenso y rascado de orejas desde hace una semana.",
                anamnesis="El tutor refiere sacudidas de cabeza y mal olor en oído derecho. Come y bebe normal.",
                peso_kg=31.4, temperatura_c=38.6, frecuencia_cardiaca=96, frecuencia_respiratoria=22,
                mucosas="Rosadas, húmedas", tllc_segundos=1.5, hidratacion_pct=0, condicion_corporal=5,
                examen_fisico="Conducto auditivo derecho eritematoso con secreción marrón. Resto sin alteraciones.",
                diagnostico="Otitis externa derecha (presuntiva por levaduras).",
                plan="Limpieza ótica, tratamiento tópico 10 días y control en 2 semanas.",
                pronostico="FAVORABLE",
            )
            Prescripcion.objects.create(
                consulta=c, medicamento="Limpiador ótico", principio_activo="Ácido salicílico",
                via="OTICA", dosis="5 gotas", frecuencia="cada 24 horas", duracion_dias=10,
                indicaciones="Masajear la base de la oreja 30 segundos.",
            )
            Prescripcion.objects.create(
                consulta=c, medicamento="Gotas óticas", principio_activo="Clotrimazol + gentamicina",
                via="OTICA", dosis="4 gotas", frecuencia="cada 12 horas", duracion_dias=10,
                indicaciones="Aplicar 15 minutos después de la limpieza. No usar penicilinas (alergia).",
            )
            c.cerrar()

            Consulta.objects.create(
                paciente=max_, veterinario=vet, fecha=timezone.now() - timedelta(days=2),
                tipo="CONTROL", motivo="Control de otitis.",
                anamnesis="Mejoría notable, ya no se rasca.",
                peso_kg=31.1, temperatura_c=38.4, condicion_corporal=5,
                examen_fisico="Conducto auditivo sin secreción, leve eritema residual.",
            )  # queda ABIERTA para mostrar el flujo de cierre

        rocky = pacientes["Rocky"]
        if not rocky.consultas.exists():
            c = Consulta.objects.create(
                paciente=rocky, veterinario=vet, fecha=timezone.now() - timedelta(days=10),
                tipo="URGENCIA", motivo="Vómito y decaimiento desde ayer.",
                anamnesis="Comió restos de comida grasosa. Vomitó 3 veces.",
                peso_kg=12.8, temperatura_c=39.1, frecuencia_cardiaca=120, frecuencia_respiratoria=30,
                mucosas="Rosadas, levemente secas", tllc_segundos=2.0, hidratacion_pct=5,
                condicion_corporal=6,
                examen_fisico="Dolor leve a la palpación abdominal craneal. Sin masas palpables.",
                diagnostico="Gastroenteritis aguda por indiscreción alimentaria.",
                plan="Fluidoterapia subcutánea, antiemético y dieta blanda 5 días.",
                pronostico="FAVORABLE",
            )
            Prescripcion.objects.create(
                consulta=c, medicamento="Antiemético", principio_activo="Maropitant",
                via="ORAL", dosis="2 mg/kg", frecuencia="cada 24 horas", duracion_dias=3,
            )
            c.cerrar()

        # --- Vacunas y desparasitaciones (con vencimientos variados para el panel) ---
        if not Preventivo.objects.exists():
            datos = [
                (max_, "VACUNA", "Rabia", -340, 25),                 # vence en 25 días
                (max_, "DESPARASITACION_INT", "Praziquantel + pirantel", -80, 10),  # vence en 10 días
                (pacientes["Luna"], "VACUNA", "Triple felina", -370, -5),          # VENCIDA hace 5 días
                (rocky, "VACUNA", "Múltiple canina", -200, 165),
                (pacientes["Nala"], "DESPARASITACION_EXT", "Fipronil", -25, 5),    # vence en 5 días
            ]
            for paciente, tipo, producto, aplicado, proxima in datos:
                Preventivo.objects.create(
                    paciente=paciente, tipo=tipo, producto=producto, lote="DEMO-001",
                    aplicado_el=hoy + timedelta(days=aplicado),
                    proxima_dosis=hoy + timedelta(days=proxima), veterinario=vet,
                )

        # --- Solicitudes de cita desde la web ---
        if not SolicitudCita.objects.exists():
            SolicitudCita.objects.create(
                nombre_tutor="Sofía Pérez (demo)", telefono="3000000009", nombre_mascota="Toby",
                especie="PERRO", fecha_preferida=hoy + timedelta(days=2),
                motivo="Primera vacuna del cachorro.", acepta_datos=True,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Clínica lista 🩺  {Tutor.objects.count()} tutores · {Paciente.objects.count()} pacientes · "
            f"{Consulta.objects.count()} consultas · {Preventivo.objects.count()} preventivos"
        ))

    def _usuario(self, username, first, last, password, grupo, generada):
        user, creado = User.objects.get_or_create(
            username=username, defaults={"first_name": first, "last_name": last},
        )
        # Solo fijamos contraseña al crearlo o si viene por variable de entorno.
        if creado or not generada:
            user.set_password(password)
            user.save()
            if generada:
                self.stdout.write(self.style.WARNING(
                    f"  Usuario '{username}' creado con contraseña generada: {password}  "
                    "(define CLINICA_DEMO_PASSWORD para fijarla)"
                ))
        user.groups.add(grupo)
        return user
