"""
Envío de correos por la API HTTP de Brevo (plan gratis: 300 correos al día).

Usamos HTTP y no SMTP porque los servidores gratis de Render bloquean los puertos SMTP.
Variables de entorno:
  BREVO_API_KEY            clave de la API (Brevo > SMTP & API > API Keys)
  CORREO_REMITENTE         correo verificado en Brevo como remitente
  CORREO_REMITENTE_NOMBRE  nombre que ve el destinatario (opcional)
"""
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL_BREVO = "https://api.brevo.com/v3/smtp/email"


class CorreoNoConfigurado(Exception):
    pass


class ErrorEnvioCorreo(Exception):
    pass


def correo_configurado() -> bool:
    return bool(os.getenv("BREVO_API_KEY") and os.getenv("CORREO_REMITENTE"))


def enviar_correo(destino: str, nombre_destino: str, asunto: str, html: str) -> None:
    if not correo_configurado():
        raise CorreoNoConfigurado("El envío de correos no está configurado en el servidor.")

    cuerpo = {
        "sender": {
            "email": os.environ["CORREO_REMITENTE"],
            "name": os.getenv("CORREO_REMITENTE_NOMBRE", "PataVida Clínica Veterinaria"),
        },
        "to": [{"email": destino, "name": nombre_destino}],
        "subject": asunto,
        "htmlContent": html,
    }
    peticion = Request(
        URL_BREVO,
        data=json.dumps(cuerpo).encode(),
        headers={
            "api-key": os.environ["BREVO_API_KEY"],
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(peticion, timeout=15) as respuesta:
            if respuesta.status >= 300:
                raise ErrorEnvioCorreo(f"Brevo respondió {respuesta.status}")
    except HTTPError as e:
        raise ErrorEnvioCorreo(f"Brevo respondió {e.code}") from e
    except URLError as e:
        raise ErrorEnvioCorreo("No se pudo conectar con el servicio de correo.") from e
