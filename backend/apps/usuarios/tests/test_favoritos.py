"""
Pruebas del módulo de favoritos.

Cubren:
  - Control de acceso (requiere usuario real, no admin proxy, no anónimo).
  - GET devuelve productos Y artículos juntos, separables por es_articulo.
  - POST con id_producto crea favorito de producto (id_articulo queda None).
  - POST con id_articulo crea favorito de artículo (id_producto queda None).
  - POST sin ningún id devuelve 400.
  - POST duplicado es idempotente (get_or_create): no crea un segundo registro
    y devuelve 200 en vez de 201.
  - DELETE elimina solo el favorito correspondiente (producto o artículo).
  - Regresión: guardar un favorito de solo-artículo no debe fallar por
    una restricción NOT NULL en id_producto (bug ya corregido en la BD real,
    pero la prueba documenta el contrato esperado del modelo).
"""
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common_test_utils import (
    crear_usuario, crear_subcategoria, crear_producto, crear_articulo,
    token_de, token_admin_django, headers_auth,
)
from apps.usuarios.models import Favorito


class FavoritosAuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_sin_token_devuelve_401(self):
        response = self.client.get('/api/usuarios/favoritos/')
        self.assertEqual(response.status_code, 401)

    def test_token_admin_django_no_puede_usar_favoritos(self):
        """
        El _AdminProxy no tiene id_usuario real (es None), así que el
        endpoint debe rechazarlo aunque el token sea válido como admin.
        """
        response = self.client.get('/api/usuarios/favoritos/', **headers_auth(token_admin_django()))
        self.assertEqual(response.status_code, 401)

    def test_token_invalido_devuelve_401(self):
        response = self.client.get('/api/usuarios/favoritos/', HTTP_AUTHORIZATION='Bearer basura-no-base64')
        self.assertEqual(response.status_code, 401)


class FavoritosProductoTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.usuario = crear_usuario()
        self.headers = headers_auth(token_de(self.usuario))
        self.subcat = crear_subcategoria()
        self.producto = crear_producto(subcategoria=self.subcat)

    def test_agregar_favorito_producto(self):
        response = self.client.post(
            '/api/usuarios/favoritos/', {'id_producto': self.producto.id_producto},
            format='json', **self.headers
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Favorito.objects.count(), 1)
        fav = Favorito.objects.first()
        self.assertEqual(fav.id_producto_id, self.producto.id_producto)
        self.assertIsNone(fav.id_articulo)

    def test_agregar_favorito_duplicado_es_idempotente(self):
        """get_or_create no debe crear un segundo registro al repetir el POST."""
        payload = {'id_producto': self.producto.id_producto}
        primero = self.client.post('/api/usuarios/favoritos/', payload, format='json', **self.headers)
        segundo = self.client.post('/api/usuarios/favoritos/', payload, format='json', **self.headers)

        self.assertEqual(primero.status_code, 201)
        self.assertEqual(segundo.status_code, 200)  # ya existía, no se crea de nuevo
        self.assertEqual(Favorito.objects.count(), 1)

    def test_post_sin_ningun_id_devuelve_400(self):
        response = self.client.post('/api/usuarios/favoritos/', {}, format='json', **self.headers)
        self.assertEqual(response.status_code, 400)

    def test_get_incluye_datos_del_producto(self):
        self.client.post(
            '/api/usuarios/favoritos/', {'id_producto': self.producto.id_producto},
            format='json', **self.headers
        )
        response = self.client.get('/api/usuarios/favoritos/', **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        item = response.data[0]
        self.assertEqual(item['id_producto_id'], self.producto.id_producto)
        self.assertEqual(item['nombre_producto'], self.producto.nombre_producto)
        self.assertFalse(item['es_articulo'])

    def test_eliminar_favorito_producto(self):
        Favorito.objects.create(id_usuario=self.usuario, id_producto=self.producto, id_articulo=None)
        response = self.client.delete(
            '/api/usuarios/favoritos/', {'id_producto': self.producto.id_producto},
            format='json', **self.headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Favorito.objects.count(), 0)

    def test_un_usuario_no_ve_favoritos_de_otro(self):
        otro_usuario = crear_usuario(nombre_usuario='otro', correo='otro@example.com')
        Favorito.objects.create(id_usuario=otro_usuario, id_producto=self.producto, id_articulo=None)

        response = self.client.get('/api/usuarios/favoritos/', **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)


class FavoritosArticuloTests(TestCase):
    """
    Estos tests asumen que la columna favorito.id_producto ya admite NULL
    (ALTER TABLE favorito ALTER COLUMN id_producto DROP NOT NULL;)
    tal como se aplicó en la base real. Si esta migración no se aplicó,
    test_agregar_favorito_solo_articulo_no_debe_fallar_por_not_null fallará
    y será la señal de que falta correrla.
    """

    def setUp(self):
        self.client = APIClient()
        self.usuario = crear_usuario()
        self.headers = headers_auth(token_de(self.usuario))
        self.subcat = crear_subcategoria()
        self.articulo = crear_articulo(subcategoria=self.subcat)

    def test_agregar_favorito_solo_articulo_no_debe_fallar_por_not_null(self):
        """
        Regresión directa del bug real:
          IntegrityError: null value in column "id_producto" of relation
          "favorito" violates not-null constraint
        Guardar un favorito de artículo deja id_producto en None; si la
        columna real sigue siendo NOT NULL, este test debe reventar aquí
        (en SQLite no truena porque managed=True no replica esa constraint,
        así que esta prueba documenta el contrato — la validación real de
        la constraint se hace a nivel de integración contra Postgres).
        """
        response = self.client.post(
            '/api/usuarios/favoritos/', {'id_articulo': self.articulo.id_articulo},
            format='json', **self.headers
        )
        self.assertEqual(response.status_code, 201)
        fav = Favorito.objects.first()
        self.assertIsNone(fav.id_producto)
        self.assertEqual(fav.id_articulo_id, self.articulo.id_articulo)

    def test_get_incluye_datos_del_articulo_y_marca_es_articulo(self):
        self.client.post(
            '/api/usuarios/favoritos/', {'id_articulo': self.articulo.id_articulo},
            format='json', **self.headers
        )
        response = self.client.get('/api/usuarios/favoritos/', **self.headers)
        item = response.data[0]
        self.assertTrue(item['es_articulo'])
        self.assertEqual(item['nombre_articulo'], self.articulo.nombre_articulo)
        self.assertIsNone(item['id_producto_id'])

    def test_eliminar_favorito_articulo(self):
        Favorito.objects.create(id_usuario=self.usuario, id_producto=None, id_articulo=self.articulo)
        response = self.client.delete(
            '/api/usuarios/favoritos/', {'id_articulo': self.articulo.id_articulo},
            format='json', **self.headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Favorito.objects.count(), 0)

    def test_eliminar_articulo_no_afecta_favoritos_de_producto(self):
        """DELETE con id_articulo no debe borrar favoritos de producto del mismo usuario."""
        subcat = self.subcat
        producto = crear_producto(subcategoria=subcat)
        Favorito.objects.create(id_usuario=self.usuario, id_producto=producto, id_articulo=None)
        Favorito.objects.create(id_usuario=self.usuario, id_producto=None, id_articulo=self.articulo)

        self.client.delete(
            '/api/usuarios/favoritos/', {'id_articulo': self.articulo.id_articulo},
            format='json', **self.headers
        )
        self.assertEqual(Favorito.objects.count(), 1)
        self.assertEqual(Favorito.objects.first().id_producto_id, producto.id_producto)


class FavoritosMixtosTests(TestCase):
    """Un mismo usuario con favoritos de ambos tipos a la vez."""

    def setUp(self):
        self.client = APIClient()
        self.usuario = crear_usuario()
        self.headers = headers_auth(token_de(self.usuario))
        self.subcat = crear_subcategoria()
        self.producto = crear_producto(subcategoria=self.subcat)
        self.articulo = crear_articulo(subcategoria=self.subcat)
        Favorito.objects.create(id_usuario=self.usuario, id_producto=self.producto, id_articulo=None)
        Favorito.objects.create(id_usuario=self.usuario, id_producto=None, id_articulo=self.articulo)

    def test_get_devuelve_ambos_tipos_juntos(self):
        response = self.client.get('/api/usuarios/favoritos/', **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_se_pueden_separar_por_es_articulo_en_el_cliente(self):
        response = self.client.get('/api/usuarios/favoritos/', **self.headers)
        productos = [f for f in response.data if not f['es_articulo']]
        articulos = [f for f in response.data if f['es_articulo']]
        self.assertEqual(len(productos), 1)
        self.assertEqual(len(articulos), 1)
