"""
Comando para llenar la base de datos con datos de ejemplo.
Uso:  python manage.py seed
"""
from django.core.management.base import BaseCommand
from productos.models import Categoria, Producto


CATEGORIAS = [
    {"nombre": "Perros", "slug": "perros", "emoji": "🐕", "orden": 1},
    {"nombre": "Gatos", "slug": "gatos", "emoji": "🐈", "orden": 2},
    {"nombre": "Veterinaria", "slug": "veterinaria", "emoji": "🩺", "orden": 3},
    {"nombre": "Accesorios", "slug": "accesorios", "emoji": "🦴", "orden": 4},
]

# (categoría, nombre, slug, descripción, precio, emoji, destacado, stock)
# El slug debe coincidir con el nombre del archivo en frontend/public/productos/
PRODUCTOS = [
    # Perros
    ("perros", "Croquetas Adulto Premium 15kg", "croquetas-adulto-premium", "Alimento balanceado rico en proteína para perros adultos de todas las razas.", 129900, "🦴", True, 40),
    ("perros", "Croquetas Cachorro Pollo 3kg", "croquetas-cachorro-pollo", "Nutrición completa para el crecimiento de tu cachorro. Con DHA y calcio.", 45900, "🐶", True, 60),
    ("perros", "Snacks Dentales x30", "snacks-dentales", "Premios que limpian los dientes y refrescan el aliento. Ideal uso diario.", 24900, "🍖", False, 100),
    ("perros", "Shampoo Antipulgas 500ml", "shampoo-antipulgas", "Limpia, protege y elimina pulgas y garrapatas. Aroma prolongado.", 19900, "🧴", False, 35),
    # Gatos
    ("gatos", "Croquetas Gato Salmón 7kg", "croquetas-gato-salmon", "Alimento premium con salmón real. Bola de pelo control y pelaje brillante.", 89900, "🐟", True, 50),
    ("gatos", "Arena Aglomerante 10kg", "arena-aglomerante", "Máxima absorción y control de olores. Fácil de limpiar.", 34900, "🪨", False, 70),
    ("gatos", "Juguete Ratón con Catnip", "juguete-raton-catnip", "Estimula el instinto de caza. Con hierba gatera natural.", 12900, "🐭", False, 120),
    ("gatos", "Rascador Torre 3 Niveles", "rascador-torre", "Diversión y descanso. Protege tus muebles de los arañazos.", 149900, "🏰", True, 15),
    # Veterinaria
    ("veterinaria", "Consulta Veterinaria General", "consulta-veterinaria", "Revisión completa de salud por médico veterinario certificado.", 55000, "🩺", True, 999),
    ("veterinaria", "Vacuna Antirrábica", "vacuna-antirrabica", "Aplicación de vacuna antirrábica con carnet de vacunación.", 38000, "💉", False, 999),
    ("veterinaria", "Desparasitante Interno x4", "desparasitante-interno", "Tabletas contra parásitos intestinales. Amplio espectro.", 28900, "💊", False, 80),
    ("veterinaria", "Baño y Peluquería", "bano-peluqueria", "Baño completo, corte de uñas, limpieza de oídos y estilizado.", 45000, "✂️", False, 999),
    # Accesorios
    ("accesorios", "Collar Ajustable Reflectivo", "collar-reflectivo", "Visibilidad nocturna y seguridad. Varias tallas y colores.", 17900, "🎗️", False, 90),
    ("accesorios", "Cama Ortopédica Suave", "cama-ortopedica", "Descanso premium con espuma de memoria. Funda lavable.", 119900, "🛏️", True, 20),
    ("accesorios", "Comedero Doble Acero", "comedero-doble-acero", "Higiénico, antideslizante y fácil de lavar. Para agua y comida.", 32900, "🥣", False, 55),
    ("accesorios", "Correa Retráctil 5m", "correa-retractil", "Paseos cómodos con freno de seguridad. Resistente hasta 25kg.", 39900, "🐕‍🦺", False, 45),
]


class Command(BaseCommand):
    help = "Llena la base de datos con categorías y productos de ejemplo (mascotas)"

    def handle(self, *args, **options):
        self.stdout.write("Sembrando datos...")

        # Categorías
        cats = {}
        for c in CATEGORIAS:
            cat, _ = Categoria.objects.update_or_create(slug=c["slug"], defaults=c)
            cats[c["slug"]] = cat
        self.stdout.write(self.style.SUCCESS(f"  {len(cats)} categorías listas"))

        # Productos
        creados = 0
        for cat_slug, nombre, slug, desc, precio, emoji, destacado, stock in PRODUCTOS:
            Producto.objects.update_or_create(
                nombre=nombre,
                defaults={
                    "categoria": cats[cat_slug],
                    "slug": slug,
                    "descripcion": desc,
                    "precio": precio,
                    "emoji": emoji,
                    "destacado": destacado,
                    "stock": stock,
                    "activo": True,
                },
            )
            creados += 1
        self.stdout.write(self.style.SUCCESS(f"  {creados} productos listos"))
        self.stdout.write(self.style.SUCCESS("¡Seed completado! 🐾"))
