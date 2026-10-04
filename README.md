# 🐾 PataVida — Ecommerce de Tienda y Veterinaria

Tienda online full-stack para productos y servicios de mascotas, con un **panel
clínico privado** para la veterinaria: agenda, historia clínica, fórmulas y caja.
Proyecto de portafolio con datos ficticios.

> **Stack:** Next.js (React) · Django REST Framework · PostgreSQL · Tailwind CSS

## 🔗 Demo en vivo

| | |
|---|---|
| 🛒 Tienda | https://veterinaria-pata-vida.vercel.app |
| 🩺 Panel clínico | https://veterinaria-pata-vida.vercel.app/panel/login (botones de acceso demo) |
| ⚙️ API | https://patavida-api.onrender.com/api/ |

Cuentas demo (datos ficticios): `dra.laura` (veterinaria) y `recepcion` (recepción).
El backend está en el plan gratis de Render: la primera visita tras un rato sin uso tarda ~50 s.

---

## ✨ Funcionalidades

- 🏠 **Home** con carrusel hero, categorías y productos destacados
- 🛍️ **Catálogo** filtrable por categoría (Perros, Gatos, Veterinaria, Accesorios)
- 🛒 **Carrito** persistente en el navegador (localStorage) con panel lateral
- 📦 **Pedidos** reales: el carrito se envía a la API y se guarda en PostgreSQL
- 🔒 **Total calculado en el servidor** (nunca se confía en el precio del navegador)
- ⚙️ **Panel de administración** de Django para gestionar productos y pedidos
- 📱 **Responsive** — se ve bien en celular, tablet y escritorio

### Panel clínico (`/panel`)

Panel privado para el equipo de la veterinaria, con roles (veterinario / recepción):

- 🩺 **Historia clínica** por paciente: consultas SOAP, signos vitales, vacunas y desparasitaciones
- 💊 **Fórmula médica** imprimible, y envío al tutor por **WhatsApp** o **correo** (API de Brevo)
- 💵 **Caja**: catálogo de servicios, cuentas de cobro, pago por método (efectivo, tarjeta,
  transferencia, Nequi), anulación con motivo y cierre de caja del día
- 🗓️ **Agenda del día**: cada cita confirmada avanza paciente → consulta → cobro desde una sola lista
- 📅 Solicitudes de cita desde la web y alertas de vacunas por vencer
- 🔒 Reglas de la normativa colombiana: la historia es reservada al veterinario (Ley 576 de 2000),
  consultas firmadas y cobros pagados no se modifican, nada se borra, consentimiento de datos (Ley 1581)
- ✅ 34 pruebas automáticas: `python manage.py test clinica`

Detalle del flujo, roles y reglas: [docs/MODULO_CLINICO.md](docs/MODULO_CLINICO.md).

> El recibo de caja no reemplaza la factura electrónica de la DIAN.

### Carrusel principal

- Incluye tres banners para alimento, servicios veterinarios y accesorios.
- Avanza automáticamente cada **5 segundos**, incluso cuando el cursor está
  sobre la imagen.
- Permite navegación manual mediante flechas e indicadores inferiores.
- Usa una transición de opacidad de 700 ms entre banners.
- Cada fotografía define su propio punto focal en
  `frontend/components/HeroCarousel.tsx`. Los banners de alimento y servicios
  veterinarios están alineados hacia la parte superior en escritorio para evitar
  que se recorten las cabezas del perro y la profesional, incluso con el zoom del
  navegador al 90 %; en dispositivos móviles priorizan a las personas y mascotas.
- Las imágenes originales están en `frontend/public/banners/` y se muestran con
  `object-cover`, por lo que el encuadre se adapta al tamaño de la pantalla.

---

## 🏗️ Arquitectura

```
   Navegador
       │
       ▼
┌────────────────────┐   HTTP/JSON   ┌────────────────────┐        ┌──────────────┐
│ Next.js · Vercel   │ ────────────▶ │ Django REST·Render │ ─────▶ │ PostgreSQL   │
│ tienda + panel     │ ◀──────────── │ /api/productos     │        │ Neon         │
│ /api/panel/* (BFF) │               │ /api/pedidos       │        │ (us-east-2)  │
└────────────────────┘               │ /api/clinica/*     │        └──────────────┘
                                     └────────────────────┘
```

- **Panel clínico**: el navegador nunca ve el JWT. Next.js guarda los tokens en cookies
  `httpOnly` y reenvía las llamadas a Django desde `/api/panel/*` (patrón BFF), con
  verificación de origen y una lista blanca de rutas.

- **Frontend** (`/frontend`): Next.js App Router. Los datos se piden a la API
  desde Server Components; el carrito es un Context de React sobre localStorage.
- **Backend** (`/backend`): Django + DRF con ViewSets, serializers y routers.
  Base de datos PostgreSQL (con fallback a SQLite para arrancar rápido).

---

## 🚀 Cómo ejecutarlo en local

### 1) Base de datos (PostgreSQL)

```bash
sudo -u postgres psql -c "CREATE USER patavida WITH PASSWORD 'patavida123';" \
  -c "CREATE DATABASE patavida OWNER patavida;" \
  -c "ALTER USER patavida CREATEDB;"
```

### 2) Backend (Django)

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python manage.py migrate
./venv/bin/python manage.py seed          # carga productos de ejemplo
./venv/bin/python manage.py seed_clinica  # usuarios demo, pacientes, servicios y cobros ficticios
./venv/bin/python manage.py createsuperuser  # (opcional) para el admin
./venv/bin/python manage.py runserver     # http://localhost:8000
```

La configuración se lee de `backend/.env` (ver `.env.example`).

### 3) Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev                                # http://localhost:3000
```

---

## 🧠 Decisiones técnicas

| Decisión | Por qué |
|---|---|
| **Total del pedido en el servidor** | Seguridad: si se calculara en el front, un usuario podría modificar el precio. Django lee el precio real de la BD. |
| **`precio_unitario` guardado por ítem** | Si el precio del producto cambia, los pedidos históricos no se alteran. |
| **Carrito en localStorage** | El usuario no pierde su carrito al recargar; no requiere login. |
| **PostgreSQL con fallback a SQLite** | Producción robusta, pero cualquiera puede clonar y correr sin instalar Postgres. |
| **Server Components para datos** | El catálogo se renderiza en el servidor: más rápido y mejor SEO. |
| **JWT en cookie httpOnly + BFF** | El token del panel no queda expuesto a JavaScript (XSS). |
| **Roles con Grupos de Django** | Recepción gestiona citas, pacientes y caja; solo el veterinario ve y escribe la historia clínica. |
| **Sin DELETE en lo clínico** | Historias, consultas y cobros se conservan; lo equivocado se anula con motivo. |
| **Correo por API HTTP (Brevo)** | Render gratis bloquea los puertos SMTP. |
| **`useSearchParams` en páginas del panel** | Las páginas se generan estáticas; el prop `searchParams` llegaba vacío en producción. |
| **Punto focal por banner** | Cada imagen conserva un encuadre útil en móvil y escritorio aunque el contenedor use `object-cover`. |

---

## 🗂️ Estructura

```
patavida-ecommerce/
├── backend/
│   ├── config/          # settings, urls
│   ├── productos/       # modelos Categoría/Producto + API + seed
│   ├── pedidos/         # modelos Pedido/ItemPedido + API
│   └── clinica/         # historia clínica, agenda, caja, correo, seed_clinica, tests
└── frontend/
    ├── app/(tienda)/    # home, productos, detalle, carrito, veterinaria, contacto...
    ├── app/panel/       # panel clínico: agenda, pacientes, consultas, caja
    ├── app/api/panel/   # BFF: login, logout y proxy hacia /api/clinica
    ├── components/      # Navbar, HeroCarousel, ProductCard, CartDrawer...
    ├── context/         # CartContext (estado del carrito)
    ├── lib/             # api.ts, contact.ts, types.ts
    └── public/          # banners y fotos de categorías/productos
```

---

## 👤 Autor

**John Infante** — [@JOHNINFA](https://github.com/JOHNINFA) · johningonzalez2021@gmail.com

Proyecto de portafolio. Full-stack: Next.js + Django + PostgreSQL.
