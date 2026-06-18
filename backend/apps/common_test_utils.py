"""
Utilidades compartidas para pruebas de LUMIKA.

No es una app de Django, es un módulo plano de helpers. Cada función crea
un objeto mínimo válido para sus pruebas; usa **overrides para personalizar
cualquier campo sin tener que repetir todos los argumentos en cada test.

Ejemplo de uso dentro de un test:
    usuario = crear_usuario(nombre_usuario='ana123')
    token   = token_de(usuario)
    response = client.get('/api/usuarios/perfil/', **headers_auth(token))
"""
import base64

from django.contrib.auth.hashers import make_password

from apps.usuarios.models import Usuario
from apps.productos.models import Categoria, Subcategoria, Producto
from apps.articulos.models import Articulo


def crear_usuario(**overrides):
    """Usuario LUMIKA normal y activo, listo para loguearse con CONTRASENA_PLANA."""
    defaults = {
        'nombre_completo': 'Usuario de Prueba',
        'nombre_usuario':  'usuario_prueba',
        'correo':          'prueba@example.com',
        'contrasena':      make_password('clave12345'),
        'rol':             'usuario',
        'estatus_cuenta':  'activo',
        'acepto_terminos': True,
    }
    defaults.update(overrides)
    return Usuario.objects.create(**defaults)


def crear_categoria(**overrides):
    defaults = {'nombre_categoria': 'Cuidado de la piel'}
    defaults.update(overrides)
    return Categoria.objects.create(**defaults)


def crear_subcategoria(categoria=None, **overrides):
    if categoria is None:
        categoria = crear_categoria()
    defaults = {'nombre_subcategoria': 'Limpiadores faciales', 'id_categoria': categoria}
    defaults.update(overrides)
    return Subcategoria.objects.create(**defaults)


def crear_producto(subcategoria=None, **overrides):
    if subcategoria is None:
        subcategoria = crear_subcategoria()
    defaults = {
        'nombre_producto':      'Producto de prueba',
        'precio_min':           100,
        'precio_max':           150,
        'color_semaforo':       'verde',
        'estado_evaluacion':    'completo',
        'razon_clasificacion':  'Cumple todos los criterios.',
        'imagen':               'producto-prueba.jpg',
        'ingredientes':         'agua, glicerina',
        'id_subcategoria':      subcategoria,
    }
    defaults.update(overrides)
    return Producto.objects.create(**defaults)


def crear_articulo(subcategoria=None, **overrides):
    defaults = {
        'nombre_articulo':   'Artículo de prueba',
        'impacto_ambiental': 'Impacto bajo',
        'color_semaforo':    'verde',
        'estado_evaluacion': 'completo',
        'precio_estimado':   50,
        'id_subcategoria':   subcategoria,
    }
    defaults.update(overrides)
    return Articulo.objects.create(**defaults)


def token_de(usuario):
    """Token tal como lo genera /api/usuarios/login/ — base64 del id_usuario."""
    return base64.b64encode(str(usuario.id_usuario).encode()).decode()


def token_admin_django(django_user_id=1):
    """Token tal como lo genera /api/usuarios/login-admin/ — base64 de 'django-{id}'."""
    return base64.b64encode(f'django-{django_user_id}'.encode()).decode()


def headers_auth(token):
    """Listo para pasar como **kwargs a client.get/post/etc."""
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}
