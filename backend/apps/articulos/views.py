import base64
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Articulo, Alternativa
from .serializers import ArticuloListSerializer, ArticuloDetalleSerializer, AlternativaSerializer


def _get_usuario(request):
    from apps.usuarios.models import Usuario
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        uid = int(base64.b64decode(auth[7:].encode()).decode())
        return Usuario.objects.get(id_usuario=uid, estatus_cuenta='activo')
    except Exception:
        return None


@api_view(['GET'])
def buscar_articulos(request):
    q      = request.query_params.get('q', '').strip()
    cat    = request.query_params.get('categoria', '').strip()
    subcat = request.query_params.get('subcategoria', '').strip()
    articulos = Articulo.objects.all()
    if q:
        articulos = articulos.filter(nombre_articulo__icontains=q)
    if subcat:
        ids = [s.strip() for s in subcat.split(',') if s.strip().isdigit()]
        if ids:
            articulos = articulos.filter(id_subcategoria_id__in=ids)
    elif cat:
        articulos = articulos.filter(id_subcategoria__id_categoria_id=cat)
    if not q and not cat and not subcat:
        articulos = articulos.order_by('nombre_articulo')
    return Response(ArticuloListSerializer(articulos, many=True).data)


@api_view(['GET'])
def detalle_articulo(request, id_articulo):
    try:
        articulo = Articulo.objects.get(id_articulo=id_articulo)
    except Articulo.DoesNotExist:
        return Response(
            {'error': 'Artículo no encontrado'}, status=status.HTTP_404_NOT_FOUND
        )
    usuario = _get_usuario(request)
    if usuario:
        from apps.usuarios.models import ConsultaArticulo
        ConsultaArticulo.objects.create(id_usuario=usuario, id_articulo=articulo)
    return Response(ArticuloDetalleSerializer(articulo).data)


@api_view(['GET'])
def alternativas_articulo(request, id_articulo):
    try:
        articulo = Articulo.objects.get(id_articulo=id_articulo)
    except Articulo.DoesNotExist:
        return Response(
            {'error': 'Artículo no encontrado'}, status=status.HTTP_404_NOT_FOUND
        )
    # Verdes de la misma subcategoría, excluyendo el artículo original
    alternativas = Articulo.objects.filter(
        id_subcategoria_id=articulo.id_subcategoria_id,
        color_semaforo='verde',
    ).exclude(id_articulo=id_articulo).order_by('precio_estimado')
    return Response(ArticuloListSerializer(alternativas, many=True).data)


@api_view(['GET'])
def comparar_articulos(request):
    ids_str = request.query_params.get('ids', '')
    ids = [int(i) for i in ids_str.split(',') if i.strip().isdigit()][:4]
    if not ids:
        return Response(
            {'error': 'Parámetro ids requerido'}, status=status.HTTP_400_BAD_REQUEST
        )
    articulos = Articulo.objects.filter(id_articulo__in=ids)
    return Response(ArticuloDetalleSerializer(articulos, many=True).data)


@api_view(['GET'])
def recomendaciones_usuario(request):
    """
    Devuelve artículos recomendados basados en el historial del usuario.
    Algoritmo:
      1. Obtener subcategorías de los últimos 20 artículos/productos consultados
      2. Buscar artículos de esas subcategorías → Recomendados
      3. Los artículos más consultados globalmente → Más populares
    """
    import base64
    from collections import Counter
    from apps.usuarios.models import Consulta, ConsultaArticulo
    from apps.productos.models import Producto

    auth = request.headers.get('Authorization', '')
    usuario = None
    if auth.startswith('Bearer '):
        try:
            decoded = base64.b64decode(auth[7:].encode()).decode()
            if not decoded.startswith('django-'):
                from apps.usuarios.models import Usuario
                uid = int(decoded)
                usuario = Usuario.objects.get(id_usuario=uid, estatus_cuenta='activo')
        except Exception:
            pass

    recomendados = []
    populares    = []

    if usuario:
        # ── RECOMENDADOS: basados en historial del usuario ────────────
        # Subcategorías de artículos consultados
        consultas_art = ConsultaArticulo.objects.filter(
            id_usuario=usuario
        ).select_related('id_articulo').order_by('-fecha_consulta')[:20]

        subcats_art = [
            c.id_articulo.id_subcategoria_id
            for c in consultas_art
            if c.id_articulo.id_subcategoria_id
        ]

        # Subcategorías de productos consultados
        consultas_prod = Consulta.objects.filter(
            id_usuario=usuario
        ).select_related('id_producto').order_by('-fecha_consulta')[:20]

        subcats_prod = [
            c.id_producto.id_subcategoria_id
            for c in consultas_prod
            if c.id_producto.id_subcategoria_id
        ]

        # Combinar y ordenar por frecuencia
        todas_subcats = subcats_art + subcats_prod
        subcats_frecuentes = [s for s, _ in Counter(todas_subcats).most_common(3)]

        if subcats_frecuentes:
            articulos_rec = Articulo.objects.filter(
                id_subcategoria__in=subcats_frecuentes
            ).order_by('nombre_articulo')[:12]
            recomendados = ArticuloListSerializer(articulos_rec, many=True).data

    # Si no hay historial suficiente, completar con artículos aleatorios
    if len(recomendados) < 6:
        ids_ya = [a['id_articulo'] for a in recomendados]
        resto = Articulo.objects.exclude(
            id_articulo__in=ids_ya
        ).order_by('nombre_articulo')[:6 - len(recomendados)]
        recomendados += ArticuloListSerializer(resto, many=True).data

    # ── POPULARES: artículos más consultados globalmente ──────────────
    from django.db.models import Count
    ids_populares = ConsultaArticulo.objects.values('id_articulo').annotate(
        total=Count('id_articulo')
    ).order_by('-total')[:6]

    ids_pop = [x['id_articulo'] for x in ids_populares]

    if ids_pop:
        # Mantener orden de popularidad
        arts_pop = {a.id_articulo: a for a in Articulo.objects.filter(id_articulo__in=ids_pop)}
        populares = ArticuloListSerializer(
            [arts_pop[i] for i in ids_pop if i in arts_pop], many=True
        ).data

    # Si no hay consultas globales, usar los últimos agregados
    if not populares:
        arts_fallback = Articulo.objects.order_by('-id_articulo')[:6]
        populares = ArticuloListSerializer(arts_fallback, many=True).data

    return Response({
        'recomendados': list(recomendados),
        'populares':    list(populares),
    })
