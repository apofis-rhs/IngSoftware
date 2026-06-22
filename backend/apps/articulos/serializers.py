from rest_framework import serializers
from .models import Articulo, Alternativa
from apps.productos.models import Caracteristica, Ventaja, Desventaja

class CaracteristicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caracteristica
        fields = ['descripcion']

class VentajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ventaja
        fields = ['descripcion']

class DesventajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Desventaja
        fields = ['descripcion']

class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternativa
        fields = '__all__'

class ArticuloListSerializer(serializers.ModelSerializer):
    id_subcategoria = serializers.IntegerField(source='id_subcategoria_id', read_only=True)

    class Meta:
        model = Articulo
        fields = [
            'id_articulo', 'nombre_articulo',
            'color_semaforo', 'estado_evaluacion',
            'precio_estimado', 'impacto_ambiental',
            'descripcion', 'id_subcategoria',
        ]

class ArticuloDetalleSerializer(serializers.ModelSerializer):
    id_subcategoria = serializers.IntegerField(source='id_subcategoria_id', read_only=True)
    
    alternativas    = serializers.SerializerMethodField()
    caracteristicas = serializers.SerializerMethodField()
    ventajas        = serializers.SerializerMethodField()
    desventajas     = serializers.SerializerMethodField()

    def get_alternativas(self, obj):
        return AlternativaSerializer(obj.alternativa_set.all(), many=True).data

    # Aquí está la magia: pasamos 'obj' directamente en lugar de 'obj.id_articulo'
    def get_caracteristicas(self, obj):
        qs = Caracteristica.objects.filter(id_articulo=obj)
        return CaracteristicaSerializer(qs, many=True).data

    def get_ventajas(self, obj):
        qs = Ventaja.objects.filter(id_articulo=obj)
        return VentajaSerializer(qs, many=True).data

    def get_desventajas(self, obj):
        qs = Desventaja.objects.filter(id_articulo=obj)
        return DesventajaSerializer(qs, many=True).data

    class Meta:
        model = Articulo
        fields = [
            'id_articulo', 'nombre_articulo',
            'color_semaforo', 'razon_clasificacion', 'estado_evaluacion',
            'precio_estimado', 'impacto_ambiental',
            'descripcion', 'id_subcategoria',
            'alternativas',
            'caracteristicas', 'ventajas', 'desventajas',
        ]