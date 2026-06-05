import base64
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Evaluacion
from .serializers import EvaluacionSerializer


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


@api_view(['POST'])
def crear_evaluacion(request):
    usuario = _get_usuario(request)
    if not usuario:
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        calificacion = int(request.data.get('calificacion', 0))
    except (TypeError, ValueError):
        calificacion = 0
    if not (1 <= calificacion <= 5):
        return Response(
            {'error': 'La calificación debe ser un número entre 1 y 5'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = request.data.copy()
    data['id_usuario'] = usuario.id_usuario
    serializer = EvaluacionSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
