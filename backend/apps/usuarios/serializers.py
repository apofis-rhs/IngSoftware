from rest_framework import serializers
from .models import Usuario, Consulta, ConsultaArticulo, Favorito


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {'contrasena': {'write_only': True}}


class ConsultaSerializer(serializers.ModelSerializer):
    # Campos del producto para mostrar en el historial
    id_producto_id   = serializers.IntegerField(source='id_producto.id_producto', read_only=True)
    nombre_producto  = serializers.CharField(source='id_producto.nombre_producto', read_only=True)
    color_semaforo   = serializers.CharField(source='id_producto.color_semaforo',  read_only=True)
    imagen           = serializers.CharField(source='id_producto.imagen',           read_only=True)
    id_subcategoria  = serializers.IntegerField(
        source='id_producto.id_subcategoria_id', read_only=True
    )

    class Meta:
        model = Consulta
        fields = [
            'id_consulta', 'fecha_consulta',
            'id_producto_id', 'nombre_producto', 'color_semaforo',
            'imagen', 'id_subcategoria',
        ]


class ConsultaArticuloSerializer(serializers.ModelSerializer):
    id_articulo_id  = serializers.IntegerField(source='id_articulo.id_articulo', read_only=True)
    nombre_articulo = serializers.CharField(source='id_articulo.nombre_articulo', read_only=True)

    class Meta:
        model = ConsultaArticulo
        fields = ['id_consulta_articulo', 'fecha_consulta', 'id_articulo_id', 'nombre_articulo']


class FavoritoSerializer(serializers.ModelSerializer):
    id_producto_id  = serializers.IntegerField(source='id_producto.id_producto', read_only=True)
    nombre_producto = serializers.CharField(source='id_producto.nombre_producto', read_only=True)
    color_semaforo  = serializers.CharField(source='id_producto.color_semaforo',  read_only=True)
    precio_min      = serializers.FloatField(source='id_producto.precio_min',     read_only=True)
    precio_max      = serializers.FloatField(source='id_producto.precio_max',     read_only=True)
    imagen          = serializers.CharField(source='id_producto.imagen',           read_only=True)
    ingredientes    = serializers.CharField(source='id_producto.ingredientes',     read_only=True)
    id_subcategoria = serializers.IntegerField(source='id_producto.id_subcategoria_id', read_only=True)

    class Meta:
        model = Favorito
        fields = [
            'id_favorito',
            'id_producto_id', 'nombre_producto', 'color_semaforo',
            'precio_min', 'precio_max', 'imagen', 'ingredientes', 'id_subcategoria',
        ]
