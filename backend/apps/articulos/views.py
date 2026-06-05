import base64
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Articulo, Alternativa
from .serializers import ArticuloListSerializer, ArticuloDetalleSerializer, AlternativaSerializer


def _get_usuario(request):
    from apps.usuarios.models import Usuario
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        uid = int(base64.b64decode(auth[7:].encode()).decode())
        return Usuario.objects.get(id_usuario=uid, estatus_cuenta='activo')
    except Exception:
        return None


@api_view(['GET'])
def buscar_articulos(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response(
            {'error': 'Parámetro q requerido'}, status=status.HTTP_400_BAD_REQUEST
        )
    articulos = Articulo.objects.filter(nombre_articulo__icontains=q)
    return Response(ArticuloListSerializer(articulos, many=True).data)


@api_view(['GET'])
def detalle_articulo(request, id_articulo):
    try:
        articulo = Articulo.objects.get(id_articulo=id_articulo)
    except Articulo.DoesNotExist:
        return Response(
            {'error': 'Artículo no encontrado'}, status=status.HTTP_404_NOT_FOUND
        )
    usuario = _get_usuario(request)
    if usuario:
        from apps.usuarios.models import ConsultaArticulo
        ConsultaArticulo.objects.create(id_usuario=usuario, id_articulo=articulo)
    return Response(ArticuloDetalleSerializer(articulo).data)


@api_view(['GET'])
def alternativas_articulo(request, id_articulo):
    try:
        articulo = Articulo.objects.get(id_articulo=id_articulo)
    except Articulo.DoesNotExist:
        return Response(
            {'error': 'Artículo no encontrado'}, status=status.HTTP_404_NOT_FOUND
        )
    alternativas = Alternativa.objects.filter(id_articulo=articulo)
    return Response(AlternativaSerializer(alternativas, many=True).data)
