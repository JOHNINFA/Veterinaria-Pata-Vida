# Despliegue de PataVida

## 1. Base de datos en Neon

1. Crea un proyecto PostgreSQL gratuito en Neon.
2. Copia la cadena de conexión con `sslmode=require`.
3. No crees una base PostgreSQL en Render; el backend usará Neon mediante `DATABASE_URL`.

## 2. Backend en Render

Usa `backend/render.yaml` como Blueprint. Configura estas variables:

- `DATABASE_URL`: cadena de conexión de Neon.
- `CORS_ALLOWED_ORIGINS`: URL final de Vercel, por ejemplo `https://tu-proyecto.vercel.app`.
- `CSRF_TRUSTED_ORIGINS`: la misma URL de Vercel.
- `DJANGO_SUPERUSER_EMAIL` y `DJANGO_SUPERUSER_PASSWORD`: opcionales para crear el administrador.

`SECRET_KEY` se genera en Render y `DEBUG` queda en `False`. El build instala dependencias, recoge archivos estáticos, ejecuta migraciones y carga el catálogo de forma idempotente.

## 3. Frontend en Vercel

Importa el repositorio, selecciona `frontend` como Root Directory y configura:

- `NEXT_PUBLIC_API_URL`: URL pública de Render terminada en `/api`, por ejemplo `https://patavida-api.onrender.com/api`.
- `NEXT_PUBLIC_WHATSAPP`: el número de WhatsApp de la tienda, solo dígitos y con código de país (ej. `57XXXXXXXXXX`).
- `NEXT_PUBLIC_SITE_URL`: URL pública de Vercel, por ejemplo `https://tu-proyecto.vercel.app`.

Después del primer despliegue de Vercel, vuelve a Render y confirma que `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` coincidan exactamente con esa URL, sin barra final.

## Nota sobre Render Free

El servicio gratuito puede tardar en responder después de un periodo sin uso. Mientras despierta, la tienda muestra un mensaje amable en lugar de un error técnico.
