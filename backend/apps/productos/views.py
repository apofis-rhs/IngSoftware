import os
import json
import base64
from openai import OpenAI
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Producto
from .serializers import ProductoListSerializer, ProductoDetalleSerializer, ProductoAdminSerializer


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


def _llamar_qwen(producto_dict, ingredientes, empaque, certificaciones, info_ambiental):
    client = OpenAI(
        api_key=os.getenv("QWEN_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )

    system_prompt = """Eres un evaluador experto en sustentabilidad de productos de cuidado personal.
Tu única función es analizar productos con base en una rúbrica fija y devolver un JSON estructurado.
No das consejos, no opinas, no agregas texto fuera del JSON.

TAREA:
1. Evalúa cada uno de los 5 criterios como "cumple", "parcial" o "no cumple"
2. Calcula el color del semáforo según las reglas
3. Redacta una razón de clasificación breve (máx 2 oraciones, en español)
4. Lista ventajas y desventajas ecológicas encontradas (en español)
5. Responde ÚNICAMENTE con el JSON indicado, sin texto adicional

REGLAS DEL SEMÁFORO:
- verde:        cumple 4 o 5 criterios
- amarillo:     cumple 2 o 3 criterios
- rojo:         cumple 0 o 1 criterios
- insuficiente: no hay información suficiente para evaluar 3 o más criterios
Un criterio "parcial" cuenta como 0.5 puntos.
REGLA ESPECIAL: si se detecta cualquiera de estos ingredientes — parabenos (methylparaben,
propylparaben, butylparaben), SLS, SLES, triclosán, formaldehído, ftalatos, Dimethicone —
el resultado máximo posible es "amarillo", nunca "verde".

RÚBRICA DE LOS 5 CRITERIOS:

CRITERIO 1 — Ingredientes de riesgo:
  cumple:    Ninguno de estos: parabenos, SLS, SLES, triclosán, formaldehído, ftalatos, Dimethicone
  parcial:   Solo 1 ingrediente de la lista presente
  no cumple: 2 o más ingredientes de la lista presentes

CRITERIO 2 — Empaque sustentable:
  cumple:    Empaque reciclable, biodegradable, recargable, sólido o sin empaque
  parcial:   Plástico reciclable de un solo uso, o mezcla de materiales
  no cumple: Plástico virgen no reciclable o sobreempacado

CRITERIO 3 — Certificaciones verificables:
  cumple:    Tiene al menos 1 certificación: Leaping Bunny, PETA, COSMOS, Ecocert,
             USDA Organic, Nordic Swan, EU Ecolabel, FSC
  parcial:   Declara ser "cruelty-free", "natural" u "orgánico" sin certificación oficial
  no cumple: Sin certificaciones ni declaraciones

CRITERIO 4 — Transparencia de marca:
  cumple:    Publica ingredientes completos online Y tiene sección de sustentabilidad con datos reales
  parcial:   Publica ingredientes pero sin info ambiental, o tiene frases genéricas sin datos
  no cumple: No publica ingredientes online o no tiene información accesible

CRITERIO 5 — Origen de ingredientes:
  cumple:    Mayoría de origen natural o vegetal, origen declarado por la marca
  parcial:   Mezcla de naturales y sintéticos sin declarar porcentajes
  no cumple: Mayoría sintética o petroquímica, o no declara origen"""

    user_prompt = f"""Evalúa el siguiente producto:

Nombre: {producto_dict['nombre']}
Categoría: {producto_dict['categoria']}
Subcategoría: {producto_dict['subcategoria']}

INGREDIENTES:
{ingredientes}

TIPO DE EMPAQUE:
{empaque}

CERTIFICACIONES DECLARADAS POR LA MARCA:
{certificaciones}

INFORMACIÓN AMBIENTAL DEL SITIO OFICIAL:
{info_ambiental}

---
Responde ÚNICAMENTE con este JSON, sin texto antes ni después:
{{
  "color_semaforo": "verde|amarillo|rojo|insuficiente",
  "razon_clasificacion": "...",
  "estado_evaluacion": "completo|insuficiente",
  "criterios": [
    {{"nombre_criterio": "Ingredientes de riesgo", "resultado": "cumple|parcial|no cumple"}},
    {{"nombre_criterio": "Empaque sustentable", "resultado": "cumple|parcial|no cumple"}},
    {{"nombre_criterio": "Certificaciones verificables", "resultado": "cumple|parcial|no cumple"}},
    {{"nombre_criterio": "Transparencia de marca", "resultado": "cumple|parcial|no cumple"}},
    {{"nombre_criterio": "Origen de ingredientes", "resultado": "cumple|parcial|no cumple"}}
  ],
  "ventajas": ["...", "..."],
  "desventajas": ["...", "..."]
}}"""

    response = client.chat.completions.create(
        model="qwen-plus",
        temperature=0.1,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ]
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _guardar_clasificacion(id_producto, resultado, producto_obj):
    from django.db import connection
    from .models import Criterio, Ventaja, Desventaja

    producto_obj.color_semaforo = resultado["color_semaforo"]
    producto_obj.razon_clasificacion = resultado["razon_clasificacion"]
    producto_obj.estado_evaluacion = resultado["estado_evaluacion"]
    producto_obj.save()

    # producto_criterio no tiene modelo Django; se maneja con SQL directo
    with connection.cursor() as cur:
        cur.execute("DELETE FROM producto_criterio WHERE id_producto = %s", [id_producto])
        for c in resultado["criterios"]:
            criterio, _ = Criterio.objects.get_or_create(
                nombre_criterio=c["nombre_criterio"],
                defaults={"descripcion": c["nombre_criterio"]}
            )
            cur.execute(
                "INSERT INTO producto_criterio (id_producto, id_criterio, resultado) VALUES (%s, %s, %s)",
                [id_producto, criterio.id_criterio, c["resultado"]]
            )

    Ventaja.objects.filter(id_producto=producto_obj).delete()
    for v in resultado["ventajas"]:
        if v and v != "...":
            Ventaja.objects.create(descripcion=v, id_producto=producto_obj)

    Desventaja.objects.filter(id_producto=producto_obj).delete()
    for d in resultado["desventajas"]:
        if d and d != "...":
            Desventaja.objects.create(descripcion=d, id_producto=producto_obj)


@api_view(['GET'])
def buscar_productos(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response(
            {'error': 'Parámetro q requerido'}, status=status.HTTP_400_BAD_REQUEST
        )
    productos = Producto.objects.filter(nombre_producto__icontains=q)
    return Response(ProductoListSerializer(productos, many=True).data)


@api_view(['GET'])
def comparar_productos(request):
    ids_str = request.query_params.get('ids', '')
    ids = [int(i) for i in ids_str.split(',') if i.strip().isdigit()][:3]
    if not ids:
        return Response(
            {'error': 'Parámetro ids requerido'}, status=status.HTTP_400_BAD_REQUEST
        )
    productos = Producto.objects.filter(id_producto__in=ids)
    return Response(ProductoDetalleSerializer(productos, many=True).data)


@api_view(['GET', 'POST'])
def lista_productos(request):
    usuario = _get_usuario(request)
    if not usuario or usuario.rol != 'admin':
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)
    if request.method == 'GET':
        return Response(
            ProductoListSerializer(Producto.objects.all(), many=True).data
        )
    serializer = ProductoAdminSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def detalle_producto(request, id_producto):
    try:
        producto = Producto.objects.get(id_producto=id_producto)
    except Producto.DoesNotExist:
        return Response(
            {'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        usuario = _get_usuario(request)
        if usuario:
            from apps.usuarios.models import Consulta
            Consulta.objects.create(id_usuario=usuario, id_producto=producto)
        return Response(ProductoDetalleSerializer(producto).data)

    usuario = _get_usuario(request)
    if not usuario or usuario.rol != 'admin':
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'PUT':
        serializer = ProductoAdminSerializer(producto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    producto.delete()
    return Response({'mensaje': 'Producto eliminado'})


@api_view(['GET'])
def alternativas_producto(request, id_producto):
    try:
        producto = Producto.objects.get(id_producto=id_producto)
    except Producto.DoesNotExist:
        return Response(
            {'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND
        )
    alternativas = Producto.objects.filter(
        id_subcategoria=producto.id_subcategoria,
        color_semaforo='verde',
    ).exclude(id_producto=id_producto)
    return Response(ProductoListSerializer(alternativas, many=True).data)


@api_view(['POST'])
def clasificar_producto(request, id_producto):
    usuario = _get_usuario(request)
    if not usuario or usuario.rol != 'admin':
        return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        producto_obj = Producto.objects.get(id_producto=id_producto)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    ingredientes    = request.data.get('ingredientes', 'No disponible')
    empaque         = request.data.get('empaque', 'No disponible')
    certificaciones = request.data.get('certificaciones', 'No disponible')
    info_ambiental  = request.data.get('info_ambiental', 'No disponible')

    producto_dict = {
        'id_producto': producto_obj.id_producto,
        'nombre':      producto_obj.nombre_producto,
        'subcategoria': producto_obj.id_subcategoria.nombre_subcategoria,
        'categoria':    producto_obj.id_subcategoria.id_categoria.nombre_categoria,
    }

    try:
        resultado = _llamar_qwen(
            producto_dict, ingredientes, empaque, certificaciones, info_ambiental
        )
    except Exception as e:
        return Response({'error': f'Error al clasificar: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    _guardar_clasificacion(id_producto, resultado, producto_obj)
    producto_obj.refresh_from_db()
    return Response(ProductoDetalleSerializer(producto_obj).data)
