from rest_framework import serializers
from .models import Articulo, Alternativa


class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternativa
        fields = '__all__'


class ArticuloListSerializer(serializers.ModelSerializer):
    id_subcategoria = serializers.IntegerField(
        source='id_subcategoria_id', read_only=True
    )

    class Meta:
        model = Articulo
        fields = [
            'id_articulo', 'nombre_articulo',
            'impacto_ambiental', 'id_subcategoria',
        ]


class ArticuloDetalleSerializer(serializers.ModelSerializer):
    id_subcategoria = serializers.IntegerField(
        source='id_subcategoria_id', read_only=True
    )
    alternativas = serializers.SerializerMethodField()

    def get_alternativas(self, obj):
        return AlternativaSerializer(obj.alternativa_set.all(), many=True).data

    class Meta:
        model = Articulo
        fields = [
            'id_articulo', 'nombre_articulo',
            'impacto_ambiental', 'id_subcategoria',
            'alternativas',
        ]
