from django.contrib import admin
from .models import Categoria, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "emoji", "orden"]
    prepopulated_fields = {"slug": ("nombre",)}  # el slug se llena solo al escribir el nombre


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "categoria", "precio", "stock", "destacado", "activo"]
    list_filter = ["categoria", "destacado", "activo"]
    list_editable = ["precio", "stock", "destacado", "activo"]
    search_fields = ["nombre", "descripcion"]
