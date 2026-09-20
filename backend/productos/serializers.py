from rest_framework import serializers
from .models import Categoria, Producto


class ProductoSerializer(serializers.ModelSerializer):
    """Convierte un Producto a JSON (lo que consume Next.js)."""
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    categoria_slug = serializers.CharField(source="categoria.slug", read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id", "nombre", "slug", "descripcion", "precio", "emoji", "imagen",
            "stock", "destacado", "categoria", "categoria_nombre", "categoria_slug",
        ]


class CategoriaSerializer(serializers.ModelSerializer):
    """Categoría + cuántos productos tiene (útil para el menú de filtros)."""
    total_productos = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ["id", "nombre", "slug", "emoji", "orden", "total_productos"]

    def get_total_productos(self, obj):
        return obj.productos.filter(activo=True).count()
