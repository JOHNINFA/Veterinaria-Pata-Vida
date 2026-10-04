# 🐾 PataVida — Ecommerce de Tienda y Veterinaria

Tienda online full-stack para productos y servicios de mascotas: catálogo por
categorías, carrito de compras y creación de pedidos. Construido como proyecto
de portafolio con un stack profesional y desplegable.

> **Stack:** Next.js (React) · Django REST Framework · PostgreSQL · Tailwind CSS

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
┌──────────────┐      HTTP/JSON      ┌──────────────┐      ┌────────────┐
│   Next.js    │  ───────────────▶   │  Django REST │ ───▶ │ PostgreSQL │
│  (frontend)  │  ◀───────────────   │    (API)     │      │            │
└──────────────┘                     └──────────────┘      └────────────┘
   Catálogo, carrito                  /api/productos           Productos
   y checkout                         /api/categorias          Categorías
                                      /api/pedidos             Pedidos
```

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
| **Punto focal por banner** | Cada imagen conserva un encuadre útil en móvil y escritorio aunque el contenedor use `object-cover`. |

---

## 🗂️ Estructura

```
patavida-ecommerce/
├── backend/
│   ├── config/          # settings, urls
│   ├── productos/       # modelos Categoría/Producto + API + seed
│   └── pedidos/         # modelos Pedido/ItemPedido + API
└── frontend/
    ├── app/             # home, productos, detalle, carrito, contacto y quiénes somos
    ├── components/      # Navbar, HeroCarousel, ProductCard, CartDrawer...
    ├── context/         # CartContext (estado del carrito)
    ├── lib/             # api.ts, contact.ts, types.ts
    └── public/          # banners y fotos de categorías/productos
```

---

## 👤 Autor

**John Infante** — [@JOHNINFA](https://github.com/JOHNINFA) · johningonzalez2021@gmail.com

Proyecto de portafolio. Full-stack: Next.js + Django + PostgreSQL.
