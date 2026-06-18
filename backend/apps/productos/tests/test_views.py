"""
Pruebas del módulo de productos.

Cubren:
  - Búsqueda (buscar_productos): texto vacío, filtro por nombre, por categoría,
    ordenamiento. Incluye prueba de regresión del bug donde q vacío devolvía 400.
  - Listado de categorías y subcategorías.
  - CRUD admin (lista_productos, detalle_producto): control de acceso por rol,
    incluyendo el token de admin de Django (_AdminProxy).
  - Registro automático de Consulta al ver el detalle, solo para usuarios reales.
  - Alternativas: máximo 3, solo verdes, excluye el producto original.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common_test_utils import (
    crear_usuario, crear_categoria, crear_subcategoria, crear_producto,
    token_de, token_admin_django, headers_auth,
)
from apps.usuarios.models import Consulta


class BuscarProductosTests(TestCase):
    """GET /api/productos/buscar/"""

    def setUp(self):
        self.client = APIClient()
        self.subcat = crear_subcategoria()
        crear_producto(subcategoria=self.subcat, nombre_producto='Shampoo Verde', color_semaforo='verde', precio_min=80)
        crear_producto(subcategoria=self.subcat, nombre_producto='Shampoo Rojo',  color_semaforo='rojo',  precio_min=40)
        crear_producto(subcategoria=self.subcat, nombre_producto='Jabón Neutro',  color_semaforo='amarillo', precio_min=20)

    def test_q_vacio_devuelve_todos_los_productos(self):
        """
        Regresión: antes, buscar_productos exigía q y devolvía 400 si venía vacío.
        El frontend depende de poder pedir el catálogo completo con q=''.
        """
        response = self.client.get('/api/productos/buscar/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

    def test_filtra_por_texto_en_nombre(self):
        response = self.client.get('/api/productos/buscar/', {'q': 'Shampoo'})
        self.assertEqual(response.status_code, 200)
        nombres = {p['nombre_producto'] for p in response.data}
        self.assertEqual(nombres, {'Shampoo Verde', 'Shampoo Rojo'})

    def test_busqueda_sin_resultados_devuelve_lista_vacia_no_error(self):
        response = self.client.get('/api/productos/buscar/', {'q': 'xyznoexiste'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_filtra_por_categoria(self):
        otra_categoria = crear_categoria(nombre_categoria='Cuidado capilar')
        otra_subcat = crear_subcategoria(categoria=otra_categoria, nombre_subcategoria='Acondicionadores')
        crear_producto(subcategoria=otra_subcat, nombre_producto='Acondicionador X')

        response = self.client.get('/api/productos/buscar/', {'categoria': otra_categoria.id_categoria})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nombre_producto'], 'Acondicionador X')

    def test_orden_precio_ascendente(self):
        response = self.client.get('/api/productos/buscar/', {'orden': 'precio_asc'})
        precios = [float(p['precio_min']) for p in response.data]
        self.assertEqual(precios, sorted(precios))

    def test_orden_precio_descendente(self):
        response = self.client.get('/api/productos/buscar/', {'orden': 'precio_desc'})
        precios = [float(p['precio_min']) for p in response.data]
        self.assertEqual(precios, sorted(precios, reverse=True))

    def test_orden_por_defecto_es_alfabetico(self):
        response = self.client.get('/api/productos/buscar/')
        nombres = [p['nombre_producto'] for p in response.data]
        self.assertEqual(nombres, sorted(nombres))


class ListarCategoriasYSubcategoriasTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_listar_categorias(self):
        crear_categoria(nombre_categoria='Cuidado de la piel')
        crear_categoria(nombre_categoria='Cuidado capilar')
        response = self.client.get('/api/productos/categorias/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_listar_subcategorias_incluye_nombre_categoria_padre(self):
        cat = crear_categoria(nombre_categoria='Cuidado de la piel')
        crear_subcategoria(categoria=cat, nombre_subcategoria='Limpiadores')
        response = self.client.get('/api/productos/subcategorias/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['nombre_categoria'], 'Cuidado de la piel')
        self.assertEqual(response.data[0]['nombre_subcategoria'], 'Limpiadores')


class ListaProductosAdminAuthTests(TestCase):
    """GET/POST /api/productos/ — requiere rol admin."""

    def setUp(self):
        self.client = APIClient()
        self.subcat = crear_subcategoria()
        crear_producto(subcategoria=self.subcat)

    def test_sin_token_devuelve_401(self):
        response = self.client.get('/api/productos/')
        self.assertEqual(response.status_code, 401)

    def test_usuario_normal_no_puede_listar(self):
        usuario = crear_usuario(rol='usuario')
        response = self.client.get('/api/productos/', **headers_auth(token_de(usuario)))
        self.assertEqual(response.status_code, 401)

    def test_usuario_admin_lumika_puede_listar(self):
        admin = crear_usuario(nombre_usuario='admin1', correo='admin1@example.com', rol='admin')
        response = self.client.get('/api/productos/', **headers_auth(token_de(admin)))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_token_admin_django_tambien_puede_listar(self):
        """
        El token 'django-{id}' (login_admin, superusuario nativo de Django)
        debe pasar la validación de rol=='admin' vía _AdminProxy.
        """
        response = self.client.get('/api/productos/', **headers_auth(token_admin_django()))
        self.assertEqual(response.status_code, 200)

    def test_crear_producto_como_admin(self):
        admin = crear_usuario(nombre_usuario='admin2', correo='admin2@example.com', rol='admin')
        payload = {
            'nombre_producto': 'Nuevo producto',
            'id_subcategoria': self.subcat.id_subcategoria,
            'precio_min': 10,
            'precio_max': 20,
        }
        response = self.client.post('/api/productos/', payload, format='json', **headers_auth(token_de(admin)))
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['nombre_producto'], 'Nuevo producto')


class DetalleProductoTests(TestCase):
    """GET/PUT/DELETE /api/productos/<id>/"""

    def setUp(self):
        self.client = APIClient()
        self.subcat = crear_subcategoria()
        self.producto = crear_producto(subcategoria=self.subcat)

    def test_404_si_no_existe(self):
        response = self.client.get('/api/productos/9999/')
        self.assertEqual(response.status_code, 404)

    def test_ver_detalle_sin_login_no_falla_y_no_guarda_consulta(self):
        response = self.client.get(f'/api/productos/{self.producto.id_producto}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Consulta.objects.count(), 0)

    def test_ver_detalle_como_usuario_real_guarda_consulta(self):
        usuario = crear_usuario()
        response = self.client.get(
            f'/api/productos/{self.producto.id_producto}/', **headers_auth(token_de(usuario))
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Consulta.objects.count(), 1)
        self.assertEqual(Consulta.objects.first().id_usuario, usuario)

    def test_ver_detalle_como_admin_no_guarda_consulta(self):
        """El _AdminProxy no tiene id_usuario real, no debe intentar crear Consulta."""
        response = self.client.get(
            f'/api/productos/{self.producto.id_producto}/', **headers_auth(token_admin_django())
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Consulta.objects.count(), 0)

    def test_eliminar_requiere_admin(self):
        usuario = crear_usuario()
        response = self.client.delete(
            f'/api/productos/{self.producto.id_producto}/', **headers_auth(token_de(usuario))
        )
        self.assertEqual(response.status_code, 401)

    def test_eliminar_como_admin_funciona(self):
        admin = crear_usuario(nombre_usuario='admin3', correo='admin3@example.com', rol='admin')
        response = self.client.delete(
            f'/api/productos/{self.producto.id_producto}/', **headers_auth(token_de(admin))
        )
        self.assertEqual(response.status_code, 200)


class AlternativasProductoTests(TestCase):
    """GET /api/productos/<id>/alternativas/ — máx 3, solo verdes, misma subcategoría."""

    def setUp(self):
        self.client = APIClient()
        self.subcat = crear_subcategoria()
        self.original = crear_producto(subcategoria=self.subcat, nombre_producto='Original', color_semaforo='amarillo')

    def test_solo_devuelve_verdes(self):
        crear_producto(subcategoria=self.subcat, nombre_producto='Verde 1', color_semaforo='verde')
        crear_producto(subcategoria=self.subcat, nombre_producto='Rojo 1',  color_semaforo='rojo')

        response = self.client.get(f'/api/productos/{self.original.id_producto}/alternativas/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['color_semaforo'], 'verde')

    def test_maximo_tres_alternativas(self):
        for i in range(5):
            crear_producto(subcategoria=self.subcat, nombre_producto=f'Verde {i}', color_semaforo='verde', precio_min=i)

        response = self.client.get(f'/api/productos/{self.original.id_producto}/alternativas/')
        self.assertEqual(len(response.data), 3)

    def test_excluye_el_producto_original_aunque_sea_verde(self):
        self.original.color_semaforo = 'verde'
        self.original.save()

        response = self.client.get(f'/api/productos/{self.original.id_producto}/alternativas/')
        ids = [p['id_producto'] for p in response.data]
        self.assertNotIn(self.original.id_producto, ids)

    def test_no_mezcla_subcategorias_distintas(self):
        otra_subcat = crear_subcategoria(nombre_subcategoria='Otra')
        crear_producto(subcategoria=otra_subcat, nombre_producto='Verde en otra subcat', color_semaforo='verde')

        response = self.client.get(f'/api/productos/{self.original.id_producto}/alternativas/')
        self.assertEqual(response.data, [])

    def test_producto_inexistente_devuelve_404(self):
        response = self.client.get('/api/productos/9999/alternativas/')
        self.assertEqual(response.status_code, 404)
