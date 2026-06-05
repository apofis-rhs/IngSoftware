from rest_framework import serializers
from .models import Usuario, Consulta, ConsultaArticulo, Favorito


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {'contrasena': {'write_only': True}}


class ConsultaSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.CharField(
        source='id_producto.nombre_producto', read_only=True
    )
    color_semaforo = serializers.CharField(
        source='id_producto.color_semaforo', read_only=True
    )

    class Meta:
        model = Consulta
        fields = '__all__'


class ConsultaArticuloSerializer(serializers.ModelSerializer):
    nombre_articulo = serializers.CharField(
        source='id_articulo.nombre_articulo', read_only=True
    )

    class Meta:
        model = ConsultaArticulo
        fields = '__all__'


class FavoritoSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.CharField(
        source='id_producto.nombre_producto', read_only=True
    )
    color_semaforo = serializers.CharField(
        source='id_producto.color_semaforo', read_only=True
    )

    class Meta:
        model = Favorito
        fields = '__all__'
