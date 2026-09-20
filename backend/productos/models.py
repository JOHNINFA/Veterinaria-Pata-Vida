from django.db import models


class Categoria(models.Model):
    """
    Una categoría agrupa productos: "Perros", "Gatos", "Veterinaria", "Accesorios".
    En la tienda se usa para filtrar el catálogo.
    """
    nombre = models.CharField(max_length=60, unique=True)
    # slug = versión "amigable" del nombre para las URLs (perros, gatos...)
    slug = models.SlugField(max_length=70, unique=True)
    emoji = models.CharField(max_length=8, blank=True, help_text="Icono visual, ej: 🐕")
    orden = models.PositiveIntegerField(default=0, help_text="Menor = aparece primero")

    class Meta:
        ordering = ["orden", "nombre"]
        verbose_name_plural = "Categorías"

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """
    Un producto que se vende en la tienda (croquetas, juguetes, servicios vet, etc.).
    El precio se guarda como Decimal para no perder centavos (nunca float con dinero).
    """
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,      # si se borra la categoría, se borran sus productos
        related_name="productos",      # categoria.productos.all()
    )
    nombre = models.CharField(max_length=120)
    # slug: identificador estable del producto. El frontend lo usa para saber
    # qué foto mostrar -> /productos/<slug>.jpg
    slug = models.SlugField(max_length=140, unique=True, null=True, blank=True)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    # emoji actúa como "imagen" ligera del producto (0 KB, se ve al instante)
    emoji = models.CharField(max_length=8, default="🐾")
    imagen = models.ImageField(upload_to="productos/", blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    destacado = models.BooleanField(default=False, help_text="Se muestra en el home")
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-destacado", "nombre"]

    def __str__(self):
        return f"{self.nombre} (${self.precio})"
