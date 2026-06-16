from rest_framework import serializers
from .models import Usuario, Consulta, ConsultaArticulo, Favorito


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {'contrasena': {'write_only': True}}


class ConsultaSerializer(serializers.ModelSerializer):
    id_producto_id  = serializers.IntegerField(source='id_producto.id_producto', read_only=True)
    nombre_producto = serializers.CharField(source='id_producto.nombre_producto', read_only=True)
    color_semaforo  = serializers.CharField(source='id_producto.color_semaforo',  read_only=True)
    imagen          = serializers.CharField(source='id_producto.imagen',           read_only=True)
    id_subcategoria = serializers.IntegerField(source='id_producto.id_subcategoria_id', read_only=True)

    class Meta:
        model = Consulta
        fields = ['id_consulta', 'fecha_consulta',
                  'id_producto_id', 'nombre_producto', 'color_semaforo',
                  'imagen', 'id_subcategoria']


class ConsultaArticuloSerializer(serializers.ModelSerializer):
    id_articulo_id  = serializers.IntegerField(source='id_articulo.id_articulo', read_only=True)
    nombre_articulo = serializers.CharField(source='id_articulo.nombre_articulo', read_only=True)

    class Meta:
        model = ConsultaArticulo
        fields = ['id_consulta_articulo', 'fecha_consulta', 'id_articulo_id', 'nombre_articulo']


class FavoritoSerializer(serializers.ModelSerializer):
    # ── Producto ──────────────────────────────────────────
    id_producto_id  = serializers.SerializerMethodField()
    nombre_producto = serializers.SerializerMethodField()
    color_semaforo  = serializers.SerializerMethodField()
    precio_min      = serializers.SerializerMethodField()
    precio_max      = serializers.SerializerMethodField()
    imagen          = serializers.SerializerMethodField()
    id_subcategoria = serializers.SerializerMethodField()

    # ── Artículo ──────────────────────────────────────────
    id_articulo_id    = serializers.SerializerMethodField()
    nombre_articulo   = serializers.SerializerMethodField()
    color_semaforo_art= serializers.SerializerMethodField()
    precio_estimado   = serializers.SerializerMethodField()
    impacto_ambiental = serializers.SerializerMethodField()

    # ── Tipo ─────────────────────────────────────────────
    es_articulo = serializers.SerializerMethodField()

    def get_es_articulo(self, obj):      return obj.id_articulo_id is not None
    def get_id_producto_id(self, obj):   return obj.id_producto.id_producto   if obj.id_producto else None
    def get_nombre_producto(self, obj):  return obj.id_producto.nombre_producto if obj.id_producto else None
    def get_color_semaforo(self, obj):   return obj.id_producto.color_semaforo  if obj.id_producto else None
    def get_precio_min(self, obj):       return float(obj.id_producto.precio_min) if obj.id_producto and obj.id_producto.precio_min else None
    def get_precio_max(self, obj):       return float(obj.id_producto.precio_max) if obj.id_producto and obj.id_producto.precio_max else None
    def get_imagen(self, obj):           return obj.id_producto.imagen           if obj.id_producto else None
    def get_id_subcategoria(self, obj):  return obj.id_producto.id_subcategoria_id if obj.id_producto else None
    def get_id_articulo_id(self, obj):   return obj.id_articulo.id_articulo       if obj.id_articulo else None
    def get_nombre_articulo(self, obj):  return obj.id_articulo.nombre_articulo   if obj.id_articulo else None
    def get_color_semaforo_art(self, obj): return obj.id_articulo.color_semaforo  if obj.id_articulo else None
    def get_precio_estimado(self, obj):  return float(obj.id_articulo.precio_estimado) if obj.id_articulo and obj.id_articulo.precio_estimado else None
    def get_impacto_ambiental(self, obj): return obj.id_articulo.impacto_ambiental if obj.id_articulo else None

    class Meta:
        model = Favorito
        fields = [
            'id_favorito', 'es_articulo',
            'id_producto_id', 'nombre_producto', 'color_semaforo',
            'precio_min', 'precio_max', 'imagen', 'id_subcategoria',
            'id_articulo_id', 'nombre_articulo', 'color_semaforo_art',
            'precio_estimado', 'impacto_ambiental',
        ]
