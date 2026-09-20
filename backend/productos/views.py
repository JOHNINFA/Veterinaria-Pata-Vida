from rest_framework import viewsets, filters
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Solo lectura: la tienda pide las categorías, no las crea desde el front.
    GET /api/categorias/
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ProductoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Catálogo de productos activos.
    GET /api/productos/                     -> todos
    GET /api/productos/?categoria=perros    -> filtra por slug de categoría
    GET /api/productos/?destacados=1        -> solo destacados (home)
    GET /api/productos/?buscar=croqueta     -> busca por nombre
    """
    serializer_class = ProductoSerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "descripcion"]

    def get_queryset(self):
        qs = Producto.objects.filter(activo=True).select_related("categoria")

        categoria = self.request.query_params.get("categoria")
        if categoria:
            qs = qs.filter(categoria__slug=categoria)

        if self.request.query_params.get("destacados"):
            qs = qs.filter(destacado=True)

        buscar = self.request.query_params.get("buscar")
        if buscar:
            qs = qs.filter(nombre__icontains=buscar)

        return qs
