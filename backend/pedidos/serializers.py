from rest_framework import serializers
from django.db import transaction
from productos.models import Producto
from .models import Pedido, ItemPedido


class ItemPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = ItemPedido
        fields = ["producto", "producto_nombre", "cantidad", "precio_unitario"]
        read_only_fields = ["precio_unitario"]


class ItemEntradaSerializer(serializers.Serializer):
    """Lo que envía el carrito por cada línea: solo id de producto y cantidad."""
    producto = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)


class PedidoSerializer(serializers.ModelSerializer):
    """
    Serializer de lectura del pedido (para el admin / confirmación).
    Los `items` se muestran anidados.
    """
    items = ItemPedidoSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = [
            "id", "nombre_cliente", "telefono", "direccion", "nota",
            "total", "estado", "creado", "items",
        ]
        read_only_fields = ["total", "estado", "creado"]


class CrearPedidoSerializer(serializers.Serializer):
    """
    Serializer de ENTRADA: recibe los datos del cliente + la lista de items.
    Aquí está la regla de oro de seguridad: el PRECIO y el TOTAL los pone
    el servidor leyendo la base de datos, nunca el navegador.
    """
    nombre_cliente = serializers.CharField(max_length=120)
    telefono = serializers.CharField(max_length=30)
    direccion = serializers.CharField(max_length=200, allow_blank=True, required=False)
    nota = serializers.CharField(allow_blank=True, required=False)
    items = ItemEntradaSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("El carrito está vacío.")
        return items

    @transaction.atomic  # o se guarda TODO el pedido, o nada (evita pedidos a medias)
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        pedido = Pedido.objects.create(**validated_data)

        for item in items_data:
            # Buscamos el producto real en la BD -> precio confiable
            producto = Producto.objects.get(id=item["producto"], activo=True)
            ItemPedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=item["cantidad"],
                precio_unitario=producto.precio,  # precio del servidor
            )

        pedido.calcular_total()
        pedido.save()
        return pedido
