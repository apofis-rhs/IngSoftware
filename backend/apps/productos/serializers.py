from rest_framework import serializers
from django.db import connection
from .models import Categoria, Subcategoria, Producto, Criterio, Ventaja, Desventaja, Caracteristica


class SubcategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategoria
        fields = '__all__'


class VentajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ventaja
        fields = ['id_ventaja', 'descripcion']


class DesventajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Desventaja
        fields = ['id_desventaja', 'descripcion']


class CaracteristicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caracteristica
        fields = ['id_caracteristica', 'descripcion']


class ProductoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'id_producto', 'nombre_producto', 'precio_min', 'precio_max',
            'color_semaforo', 'estado_evaluacion', 'id_subcategoria',
        ]


class ProductoDetalleSerializer(serializers.ModelSerializer):
    subcategoria = SubcategoriaSerializer(source='id_subcategoria', read_only=True)
    ventajas = serializers.SerializerMethodField()
    desventajas = serializers.SerializerMethodField()
    caracteristicas = serializers.SerializerMethodField()
    criterios = serializers.SerializerMethodField()

    def get_ventajas(self, obj):
        return VentajaSerializer(obj.ventaja_set.all(), many=True).data

    def get_desventajas(self, obj):
        return DesventajaSerializer(obj.desventaja_set.all(), many=True).data

    def get_caracteristicas(self, obj):
        return CaracteristicaSerializer(obj.caracteristica_set.all(), many=True).data

    def get_criterios(self, obj):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT c.id_criterio, c.nombre_criterio, c.descripcion, pc.resultado "
                "FROM criterio c "
                "JOIN producto_criterio pc ON c.id_criterio = pc.id_criterio "
                "WHERE pc.id_producto = %s",
                [obj.id_producto],
            )
            cols = [d[0] for d in cursor.description]
            return [dict(zip(cols, row)) for row in cursor.fetchall()]

    class Meta:
        model = Producto
        fields = [
            'id_producto', 'nombre_producto', 'precio_min', 'precio_max',
            'color_semaforo', 'razon_clasificacion', 'estado_evaluacion',
            'id_subcategoria', 'subcategoria',
            'ventajas', 'desventajas', 'caracteristicas', 'criterios',
        ]


class ProductoAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'
