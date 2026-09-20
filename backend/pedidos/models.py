from django.db import models
from productos.models import Producto


class Pedido(models.Model):
    """
    Un pedido es lo que el cliente confirma desde el carrito.
    Guardamos sus datos de contacto y el total (calculado en el servidor,
    NUNCA confiamos en el total que manda el navegador).
    """
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("confirmado", "Confirmado"),
        ("entregado", "Entregado"),
        ("cancelado", "Cancelado"),
    ]

    nombre_cliente = models.CharField(max_length=120)
    telefono = models.CharField(max_length=30)
    direccion = models.CharField(max_length=200, blank=True)
    nota = models.TextField(blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]

    def __str__(self):
        return f"Pedido #{self.id} - {self.nombre_cliente} (${self.total})"

    def calcular_total(self):
        """Suma cada línea del pedido. La fuente de verdad del precio es la BD."""
        self.total = sum(item.subtotal() for item in self.items.all())
        return self.total


class ItemPedido(models.Model):
    """
    Cada línea del pedido: un producto y su cantidad.
    Guardamos el precio en el momento de la compra (precio_unitario) para que,
    si mañana sube el precio del producto, el pedido histórico no cambie.
    """
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"
