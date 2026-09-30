from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from productos.views import CategoriaViewSet, ProductoViewSet
from pedidos.views import PedidoViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from clinica.views import LoginView, yo

# El router genera automáticamente las rutas REST de cada ViewSet
router = DefaultRouter()
router.register(r"categorias", CategoriaViewSet, basename="categoria")
router.register(r"productos", ProductoViewSet, basename="producto")
router.register(r"pedidos", PedidoViewSet, basename="pedido")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),   # /api/productos/, /api/categorias/, /api/pedidos/
    # Autenticación del panel veterinario (JWT)
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/yo/", yo, name="yo"),
    # Módulo clínico
    path("api/clinica/", include("clinica.urls")),
]

# En desarrollo, servir imágenes subidas (media)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
