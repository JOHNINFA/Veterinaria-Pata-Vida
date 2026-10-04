# Despliegue de PataVida

Arquitectura en producción (todo en planes gratis):

| Parte | Servicio | URL |
|---|---|---|
| Frontend (Next.js) | Vercel | https://veterinaria-pata-vida.vercel.app |
| Backend (Django) | Render, región Ohio | https://patavida-api.onrender.com |
| Base de datos | Neon, AWS us-east-2 (Ohio) | — |

Backend y base de datos están en la misma región para que las consultas sean rápidas.
Cada `git push` a `main` vuelve a desplegar Vercel y Render automáticamente.

## 1. Base de datos en Neon

1. Crea un proyecto PostgreSQL gratuito en Neon, región **AWS US East 2 (Ohio)**.
2. En **Connect**, deja activado *Connection pooling* y copia la cadena (`postgresql://...`).
3. No uses la base PostgreSQL gratis de Render: se vence a los 90 días. La de Neon no.

> La cadena de conexión es un secreto: pégala solo en Render, nunca en el repositorio.

## 2. Backend en Render

**New → Blueprint**, repositorio `Veterinaria-Pata-Vida`, Blueprint Path `backend/render.yaml`.
Variables que pide:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Cadena de Neon |
| `CORS_ALLOWED_ORIGINS` | URL de Vercel, **sin barra final** |
| `CSRF_TRUSTED_ORIGINS` | La misma URL de Vercel |
| `DJANGO_SUPERUSER_EMAIL` / `DJANGO_SUPERUSER_PASSWORD` | Administrador de `/admin` (usuario `admin`). Clave fuerte y privada |
| `CLINICA_DEMO_PASSWORD` | Clave de las cuentas demo `dra.laura` y `recepcion` |
| `BREVO_API_KEY` / `CORREO_REMITENTE` | Opcionales: envío de fórmulas por correo (ver abajo) |

`SECRET_KEY` se genera solo y `DEBUG` queda en `False`. El build (`build.sh`) instala
dependencias, recoge estáticos, migra y corre `seed` y `seed_clinica` (los dos idempotentes).

> Las variables `sync: false` agregadas al `render.yaml` **después** de crear el Blueprint no se
> piden solas: hay que crearlas a mano en *Environment* del servicio.

## 3. Frontend en Vercel

**Add New → Project → Import**. Vercel detecta dos apps: elige **Import single project** en
`frontend` (el backend ya está en Render). Variables:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://patavida-api.onrender.com/api` |
| `NEXT_PUBLIC_SITE_URL` | URL de Vercel |
| `NEXT_PUBLIC_WHATSAPP` | Número real, solo dígitos con 57 (no va en el repositorio) |
| `NEXT_PUBLIC_PANEL_DEMO_PASSWORD` | Opcional: muestra los botones de acceso demo en `/panel/login` |

Si la URL final de Vercel es distinta a la que pusiste en Render, actualiza
`CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` allá.

## 4. Correo con Brevo (opcional)

Render gratis **bloquea los puertos SMTP**, por eso el backend usa la API HTTP de Brevo
(300 correos al día gratis).

1. Crea una cuenta en https://www.brevo.com.
2. **Senders, Domains & Dedicated IPs → Senders**: agrega y verifica el correo remitente.
3. **SMTP & API → API Keys**: crea una clave.
4. En Render, *Environment*: `BREVO_API_KEY` y `CORREO_REMITENTE`.

Sin estas variables, el botón "Enviar por correo" responde con un aviso claro (503) y lo demás
funciona igual. Con un remitente Gmail los correos pueden llegar a spam; con un dominio propio
verificado llegan mejor.

## Notas

- **Render Free se duerme** tras 15 minutos sin uso; la primera visita tarda ~50 s. Antes de
  mostrar la demo a alguien, ábrela un minuto antes.
- **Orden de los despliegues**: Vercel suele terminar antes que Render. Si una pantalla nueva
  falla justo después de un push, espera a que Render diga *Live* y recarga.
- **Datos demo**: `seed_clinica` corre en cada despliegue y vuelve a crear lo que falte
  (usuarios, pacientes, servicios). No deshace cambios hechos por visitantes; para eso se
  editan o anulan desde `/admin` o desde el panel. (Render gratis no tiene consola *Shell*.)
- **Páginas del panel con parámetros en la URL** (`?cita=`, `?paciente=`, `?fecha=`): se leen
  con `useSearchParams` dentro de `<Suspense>`. Con el prop `searchParams` llegaban vacíos en
  producción porque las páginas se generan estáticas; en `npm run dev` no se nota.
