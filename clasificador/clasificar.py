# LUMIKA — clasificar.py
# Script independiente para clasificar productos con Qwen (IA)
# Cómo usar:
#   1. Llena el .env con tus credenciales
#   2. Instala dependencias: pip install openai psycopg2-binary python-dotenv
#   3. Corre: python clasificar.py
#   4. Ingresa el ID del producto a clasificar

import os
import json
import psycopg2
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

QWEN_API_KEY = os.getenv("QWEN_API_KEY")
DB_HOST      = os.getenv("DB_HOST")
DB_PORT      = os.getenv("DB_PORT", "5432")
DB_NAME      = os.getenv("DB_NAME")
DB_USER      = os.getenv("DB_USER")
DB_PASSWORD  = os.getenv("DB_PASSWORD")

# ─────────────────────────────────────────
# CONEXIÓN A RAILWAY
# ─────────────────────────────────────────
def conectar_bd():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT,
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )

# ─────────────────────────────────────────
# OBTENER PRODUCTO
# ─────────────────────────────────────────
def obtener_producto(id_producto):
    conn = conectar_bd()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id_producto, p.nombre_producto, s.nombre_subcategoria, c.nombre_categoria
        FROM producto p
        JOIN subcategoria s ON p.id_subcategoria = s.id_subcategoria
        JOIN categoria c ON s.id_categoria = c.id_categoria
        WHERE p.id_producto = %s
    """, (id_producto,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return {"id_producto": row[0], "nombre": row[1], "subcategoria": row[2], "categoria": row[3]}

# ─────────────────────────────────────────
# LLAMADA A QWEN
# ─────────────────────────────────────────
def clasificar_con_qwen(producto, ingredientes, empaque, certificaciones, info_ambiental):
    client = OpenAI(
        api_key=QWEN_API_KEY,
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
  cumple:   Ninguno de estos ingredientes en la lista: parabenos, SLS, SLES, triclosán,
            formaldehído, ftalatos, silicones no biodegradables (Dimethicone)
  parcial:  Solo 1 ingrediente de la lista presente
  no cumple: 2 o más ingredientes de la lista presentes

CRITERIO 2 — Empaque sustentable:
  cumple:   Empaque reciclable, biodegradable, recargable, sólido o sin empaque
  parcial:  Plástico reciclable de un solo uso, o mezcla de materiales
  no cumple: Plástico virgen no reciclable o sobreempacado

CRITERIO 3 — Certificaciones verificables:
  cumple:   Tiene al menos 1 certificación oficial: Leaping Bunny, PETA cruelty-free,
            COSMOS, Ecocert, USDA Organic, Nordic Swan, EU Ecolabel, FSC
  parcial:  Declara ser "cruelty-free", "natural" u "orgánico" sin certificación oficial
  no cumple: No tiene ninguna certificación ni declaración

CRITERIO 4 — Transparencia de marca:
  cumple:   Publica lista completa de ingredientes online Y tiene sección de sustentabilidad
            con datos concretos (no solo frases genéricas)
  parcial:  Publica ingredientes pero sin info ambiental, o tiene frases genéricas sin datos
  no cumple: No publica ingredientes online o no tiene información accesible

CRITERIO 5 — Origen de ingredientes:
  cumple:   Mayoría de ingredientes de origen natural o vegetal, origen declarado por la marca
  parcial:  Mezcla de naturales y sintéticos sin declarar porcentajes
  no cumple: Mayoría sintética o petroquímica, o no declara origen"""

    user_prompt = f"""Evalúa el siguiente producto:

Nombre: {producto['nombre']}
Categoría: {producto['categoria']}
Subcategoría: {producto['subcategoria']}

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

# ─────────────────────────────────────────
# GUARDAR EN RAILWAY
# ─────────────────────────────────────────
def guardar_resultados(id_producto, resultado):
    conn = conectar_bd()
    cur = conn.cursor()

    cur.execute("""
        UPDATE producto
        SET color_semaforo      = %s,
            razon_clasificacion = %s,
            estado_evaluacion   = %s
        WHERE id_producto = %s
    """, (resultado["color_semaforo"], resultado["razon_clasificacion"],
          resultado["estado_evaluacion"], id_producto))

    cur.execute("DELETE FROM producto_criterio WHERE id_producto = %s", (id_producto,))
    for criterio in resultado["criterios"]:
        cur.execute("SELECT id_criterio FROM criterio WHERE nombre_criterio = %s",
                    (criterio["nombre_criterio"],))
        row = cur.fetchone()
        if row:
            id_criterio = row[0]
        else:
            cur.execute(
                "INSERT INTO criterio (nombre_criterio, descripcion) VALUES (%s, %s) RETURNING id_criterio",
                (criterio["nombre_criterio"], criterio["nombre_criterio"])
            )
            id_criterio = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO producto_criterio (id_producto, id_criterio, resultado) VALUES (%s, %s, %s)",
            (id_producto, id_criterio, criterio["resultado"])
        )

    cur.execute("DELETE FROM ventaja WHERE id_producto = %s", (id_producto,))
    for v in resultado["ventajas"]:
        if v and v != "...":
            cur.execute("INSERT INTO ventaja (descripcion, id_producto) VALUES (%s, %s)", (v, id_producto))

    cur.execute("DELETE FROM desventaja WHERE id_producto = %s", (id_producto,))
    for d in resultado["desventajas"]:
        if d and d != "...":
            cur.execute("INSERT INTO desventaja (descripcion, id_producto) VALUES (%s, %s)", (d, id_producto))

    conn.commit()
    cur.close()
    conn.close()

# ─────────────────────────────────────────
# FLUJO PRINCIPAL
# ─────────────────────────────────────────
def main():
    print("\n══════════════════════════════════")
    print("   LUMIKA — Clasificador con Qwen  ")
    print("══════════════════════════════════\n")

    id_producto = input("ID del producto a clasificar: ").strip()
    if not id_producto.isdigit():
        print("❌ El ID debe ser un número.")
        return

    producto = obtener_producto(int(id_producto))
    if not producto:
        print(f"❌ No se encontró el producto con ID {id_producto}.")
        return

    print(f"\n✓ Producto: {producto['nombre']} ({producto['categoria']} › {producto['subcategoria']})")
    print("\nIngresa la información (pega el texto y presiona Enter dos veces):\n")

    def leer_multilinea(campo):
        print(f"  {campo}:")
        lineas = []
        while True:
            linea = input()
            if linea == "" and lineas:
                break
            elif linea != "":
                lineas.append(linea)
        return "\n".join(lineas) if lineas else "No disponible"

    ingredientes    = leer_multilinea("Lista de ingredientes")
    empaque         = leer_multilinea("Tipo de empaque")
    certificaciones = leer_multilinea("Certificaciones declaradas (o escribe 'Ninguna')")
    info_ambiental  = leer_multilinea("Información ambiental del sitio oficial (o 'No disponible')")

    print("\n⏳ Clasificando con Qwen...\n")

    try:
        resultado = clasificar_con_qwen(producto, ingredientes, empaque, certificaciones, info_ambiental)
    except json.JSONDecodeError:
        print("❌ Qwen no devolvió un JSON válido. Intenta de nuevo.")
        return
    except Exception as e:
        print(f"❌ Error al llamar a Qwen: {e}")
        return

    print("═══════════════ RESULTADO ═══════════════")
    print(f"  Semáforo:     {resultado['color_semaforo'].upper()}")
    print(f"  Estado:       {resultado['estado_evaluacion']}")
    print(f"  Razón:        {resultado['razon_clasificacion']}")
    print("\n  Criterios:")
    for c in resultado["criterios"]:
        icono = "✓" if c["resultado"] == "cumple" else ("◐" if c["resultado"] == "parcial" else "✗")
        print(f"    {icono} {c['nombre_criterio']}: {c['resultado']}")
    print(f"\n  Ventajas:     {', '.join(resultado['ventajas'])}")
    print(f"  Desventajas:  {', '.join(resultado['desventajas'])}")
    print("═════════════════════════════════════════\n")

    confirmar = input("¿Guardar en Railway? (s/n): ").strip().lower()
    if confirmar == "s":
        guardar_resultados(int(id_producto), resultado)
        print("✅ Clasificación guardada correctamente.\n")
    else:
        print("⚠️  Cancelado. No se guardó nada.\n")

if __name__ == "__main__":
    main()