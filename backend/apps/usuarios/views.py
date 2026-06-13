import base64
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Usuario, Consulta, Favorito
from .serializers import UsuarioSerializer, ConsultaSerializer, FavoritoSerializer


def _get_usuario(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        uid = int(base64.b64decode(auth[7:].encode()).decode())
        return Usuario.objects.get(id_usuario=uid, estatus_cuenta='activo')
    except Exception:
        return None


@api_view(['POST'])
def registro(request):
    data = request.data.copy()
    raw_password = data.get('contrasena', '')
    if not raw_password:
        return Response(
            {'error': 'La contraseña es requerida'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data['contrasena'] = make_password(raw_password)
    data.setdefault('estatus_cuenta', 'activo')
    data.setdefault('rol', 'usuario')
    serializer = UsuarioSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login(request):
    nombre_usuario = request.data.get('nombre_usuario', '').strip()
    contrasena = request.data.get('contrasena', '')
    if not nombre_usuario or not contrasena:
        return Response(
            {'error': 'nombre_usuario y contrasena son requeridos'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        usuario = Usuario.objects.get(nombre_usuario=nombre_usuario)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if usuario.estatus_cuenta == 'eliminado':
        return Response({'error': 'Cuenta eliminada'}, status=status.HTTP_401_UNAUTHORIZED)
    if not check_password(contrasena, usuario.contrasena):
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if usuario.estatus_cuenta == 'inactivo':
        usuario.estatus_cuenta = 'activo'
        usuario.save()
    token = base64.b64encode(str(usuario.id_usuario).encode()).decode()
    return Response({'token': token, 'usuario': UsuarioSerializer(usuario).data})


@api_view(['GET', 'PUT', 'DELETE'])
def perfil(request):
    usuario = _get_usuario(request)
    if not usuario:
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response(UsuarioSerializer(usuario).data)

    if request.method == 'DELETE':
        usuario.estatus_cuenta = 'eliminado'
        usuario.save()
        return Response({'mensaje': 'Cuenta eliminada'})

    # PUT
    data = request.data.copy()
    data.pop('contrasena', None)
    serializer = UsuarioSerializer(usuario, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def cambiar_contrasena(request):
    usuario = _get_usuario(request)
    if not usuario:
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)
    contrasena_actual = request.data.get('contrasena_actual', '')
    nueva_contrasena = request.data.get('nueva_contrasena', '')
    if not contrasena_actual or not nueva_contrasena:
        return Response(
            {'error': 'contrasena_actual y nueva_contrasena son requeridos'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not check_password(contrasena_actual, usuario.contrasena):
        return Response(
            {'error': 'Contraseña actual incorrecta'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    usuario.contrasena = make_password(nueva_contrasena)
    usuario.save()
    return Response({'mensaje': 'Contraseña actualizada'})


@api_view(['GET'])
def historial(request):
    usuario = _get_usuario(request)
    if not usuario:
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)
    consultas = Consulta.objects.filter(id_usuario=usuario).order_by('-fecha_consulta')
    return Response(ConsultaSerializer(consultas, many=True).data)


@api_view(['GET', 'POST', 'DELETE'])
def favoritos(request):
    usuario = _get_usuario(request)
    if not usuario:
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        favs = Favorito.objects.filter(id_usuario=usuario)
        return Response(FavoritoSerializer(favs, many=True).data)

    id_producto = request.data.get('id_producto')
    if not id_producto:
        return Response(
            {'error': 'id_producto es requerido'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if request.method == 'POST':
        fav, created = Favorito.objects.get_or_create(
            id_usuario_id=usuario.id_usuario,
            id_producto_id=id_producto,
        )
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(FavoritoSerializer(fav).data, status=code)

    Favorito.objects.filter(
        id_usuario_id=usuario.id_usuario, id_producto_id=id_producto
    ).delete()
    return Response({'mensaje': 'Favorito eliminado'})

@api_view(['POST'])
def login_admin(request):
    """
    Autentica contra el sistema de usuarios nativo de Django (auth_user).
    Solo permite el acceso si el usuario tiene is_staff o is_superuser = True.
    """
    nombre_usuario = request.data.get('nombre_usuario', '').strip()
    contrasena = request.data.get('contrasena', '')
 
    if not nombre_usuario or not contrasena:
        return Response(
            {'error': 'nombre_usuario y contrasena son requeridos'},
            status=status.HTTP_400_BAD_REQUEST,
        )
 
    # django.contrib.auth.authenticate verifica contra auth_user
    django_user = authenticate(username=nombre_usuario, password=contrasena)
 
    if django_user is None:
        return Response(
            {'error': 'Credenciales incorrectas o usuario no encontrado en Django admin'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
 
    if not (django_user.is_staff or django_user.is_superuser):
        return Response(
            {'error': 'El usuario no tiene permisos de administrador'},
            status=status.HTTP_403_FORBIDDEN,
        )
 
    # Generamos un token simple basado en el ID del usuario de Django
    token = base64.b64encode(f'django-{django_user.id}'.encode()).decode()
 
    usuario_data = {
        'id_usuario':       django_user.id,
        'nombre_usuario':   django_user.username,
        'nombre_completo':  f'{django_user.first_name} {django_user.last_name}'.strip() or django_user.username,
        'correo':           django_user.email,
        'rol':              'admin',
        'is_staff':         django_user.is_staff,
        'is_superuser':     django_user.is_superuser,
        'estatus_cuenta':   'activo',
    }
 
    return Response({'token': token, 'usuario': usuario_data})
