from rest_framework import viewsets, mixins
from .models import Pedido
from .serializers import PedidoSerializer, CrearPedidoSerializer


class PedidoViewSet(mixins.CreateModelMixin,
                    mixins.RetrieveModelMixin,
                    viewsets.GenericViewSet):
    """
    Pedidos.
    POST /api/pedidos/       -> crea un pedido desde el carrito
    GET  /api/pedidos/{id}/  -> ver un pedido (confirmación)

    No exponemos el listado completo al público (los pedidos se ven en el admin).
    """
    queryset = Pedido.objects.all()

    def get_serializer_class(self):
        # Al crear usamos el serializer de entrada; al leer, el de salida.
        if self.action == "create":
            return CrearPedidoSerializer
        return PedidoSerializer

    def create(self, request, *args, **kwargs):
        # Creamos con CrearPedidoSerializer pero respondemos con PedidoSerializer
        entrada = self.get_serializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        pedido = entrada.save()
        salida = PedidoSerializer(pedido)
        from rest_framework.response import Response
        from rest_framework import status
        return Response(salida.data, status=status.HTTP_201_CREATED)
