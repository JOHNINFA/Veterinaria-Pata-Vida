from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from productos.views import CategoriaViewSet, ProductoViewSet
from pedidos.views import PedidoViewSet

# El router genera automáticamente las rutas REST de cada ViewSet
router = DefaultRouter()
router.register(r"categorias", CategoriaViewSet, basename="categoria")
router.register(r"productos", ProductoViewSet, basename="producto")
router.register(r"pedidos", PedidoViewSet, basename="pedido")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),   # /api/productos/, /api/categorias/, /api/pedidos/
]

# En desarrollo, servir imágenes subidas (media)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
