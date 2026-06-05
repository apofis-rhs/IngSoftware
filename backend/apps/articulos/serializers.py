from rest_framework import serializers
from .models import Articulo, Alternativa


class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternativa
        fields = '__all__'


class ArticuloListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articulo
        fields = ['id_articulo', 'nombre_articulo', 'id_subcategoria']


class ArticuloDetalleSerializer(serializers.ModelSerializer):
    alternativas = serializers.SerializerMethodField()

    def get_alternativas(self, obj):
        return AlternativaSerializer(obj.alternativa_set.all(), many=True).data

    class Meta:
        model = Articulo
        fields = '__all__'
