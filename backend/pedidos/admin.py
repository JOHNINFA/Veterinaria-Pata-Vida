from django.contrib import admin
from .models import Pedido, ItemPedido


class ItemPedidoInline(admin.TabularInline):
    """Muestra los productos del pedido dentro de la ficha del pedido."""
    model = ItemPedido
    extra = 0
    readonly_fields = ["producto", "cantidad", "precio_unitario"]


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["id", "nombre_cliente", "telefono", "total", "estado", "creado"]
    list_filter = ["estado", "creado"]
    list_editable = ["estado"]
    search_fields = ["nombre_cliente", "telefono"]
    inlines = [ItemPedidoInline]
