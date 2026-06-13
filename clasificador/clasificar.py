# LUMIKA — clasificar.py
# Clasifica productos y artículos con Claude (Anthropic)
# Uso: python clasificar.py
# Requiere: pip install anthropic psycopg2-binary python-dotenv

import os
import json
import psycopg2
import anthropic
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DB_HOST           = os.getenv("DB_HOST")
DB_PORT           = os.getenv("DB_PORT", "5432")
DB_NAME           = os.getenv("DB_NAME")
DB_USER           = os.getenv("DB_USER")
DB_PASSWORD       = os.getenv("DB_PASSWORD")

# ─────────────────────────────────────────
# CONEXIÓN A RAILWAY
# ─────────────────────────────────────────
def conectar_bd():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT,
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )

# ─────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────
SYSTEM_PROMPT = """Eres un auditor ambiental experto en productos de cuidado personal.
Tu única función es evaluar productos basándote ESTRICTAMENTE en las siguientes normativas.
Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin Markdown, sin prefijos.

NORMATIVAS DE REFERENCIA OBLIGATORIAS:
- Reglamento (CE) Nº 1223/2009 UE: lista de más de 1,600 sustancias prohibidas en cosméticos
- Base de datos EWG Skin Deep: riesgo de ingredientes del 1 (bajo) al 10 (alto)
- ECHA: detección de microplásticos añadidos (Polyethylene, Nylon-12, PMMA, Acrylates Copolymer)
- Nomenclatura INCI: si la marca oculta ingredientes con nombres genéricos, es greenwashing
- NOM-141-SSA1/SCFI-2012 México: etiquetado sanitario obligatorio
- Directrices Ellen MacArthur: plástico reciclable SIN sistema refill NO es sustentable

SISTEMA DE VETOS:
- ROJO (veto automático si cualquiera se cumple):
  * Ingredientes: parabenos, triclosán, ftalatos, SLS, SLES, Dimethicone, microplásticos
  * Empaque: plástico virgen de un solo uso sin refill
  * Greenwashing comprobado por organismos regulatorios
- AMARILLO (ningún veto rojo pero alguna de estas):
  * Fórmula sin riesgo alto PERO empaque plástico reciclable convencional
  * Claims "natural" o "eco" sin certificación verificable
  * Conservadores cuestionables (phenoxyethanol alto, BHT, BHA)
- VERDE (debe cumplir TODOS):
  * Fórmula limpia EWG score 1-3, sin derivados del petróleo
  * Empaque zero-waste, vidrio, aluminio, compostable o refill
  * Sin antecedentes de greenwashing verificados

REGLAS DE SALIDA JSON:
- Todos los precios en pesos mexicanos MXN como números sin símbolo
- "color_semaforo": solo "verde", "amarillo" o "rojo"
- "razon_clasificacion": máximo 3 líneas, técnico, en español
- "caracteristicas": array máximo 4 strings
- "ventajas": array de strings, vacío [] si es rojo
- "desventajas": array de strings"""

# ─────────────────────────────────────────
# CLASIFICAR PRODUCTO
# ─────────────────────────────────────────
def clasificar_producto(nombre, categoria, subcategoria, ingredientes):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    user_prompt = f"""Evalúa este producto de cuidado personal:

Nombre/Marca: {nombre}
Categoría: {categoria}
Subcategoría: {subcategoria}

LISTA DE INGREDIENTES (INCI):
{ingredientes}

INSTRUCCIONES:
- Infiere el tipo de empaque típico de esta marca y subcategoría
- Investiga si esta marca tiene antecedentes de greenwashing
- Analiza ingredientes contra CE 1223/2009 y EWG
- Detecta microplásticos según ECHA
- Estima precio en MXN según posicionamiento de la marca en México

RESPONDE SOLO CON ESTE JSON EXACTO, sin texto adicional:
{{
  "color_semaforo": "",
  "razon_clasificacion": "",
  "precio_min": 0.0,
  "precio_max": 0.0,
  "caracteristicas": [],
  "ventajas": [],
  "desventajas": []
}}"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

# ─────────────────────────────────────────
# CLASIFICAR ARTÍCULO
# ─────────────────────────────────────────
def clasificar_articulo(nombre, categoria, subcategoria, descripcion):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    user_prompt = f"""Evalúa este artículo genérico de cuidado personal:

Nombre: {nombre}
Categoría: {categoria}
Subcategoría: {subcategoria}

DESCRIPCIÓN:
{descripcion}

INSTRUCCIONES:
- Es un PRODUCTO GENÉRICO, evalúa la categoría en general
- Analiza el tipo de envase típico de esta categoría según Ellen MacArthur
- Detecta si esta categoría usa microplásticos frecuentemente (ECHA)
- Investiga casos conocidos de greenwashing en esta categoría
- Analiza el impacto ambiental general
- Estima precio en MXN para este tipo de producto genérico en México
- "ventajas": por qué la gente lo usa (funcionalidad)
- "desventajas": impacto ambiental y problemas de esta categoría

RESPONDE SOLO CON ESTE JSON EXACTO, sin texto adicional:
{{
  "color_semaforo": "",
  "razon_clasificacion": "",
  "precio_estimado": 0.0,
  "caracteristicas": [],
  "ventajas": [],
  "desventajas": []
}}"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

# ─────────────────────────────────────────
# GUARDAR PRODUCTO EN BD
# ─────────────────────────────────────────
def guardar_producto(id_producto, resultado):
    conn = conectar_bd()
    cur  = conn.cursor()

    cur.execute("""
        UPDATE producto SET
            color_semaforo      = %s,
            razon_clasificacion = %s,
            precio_min          = %s,
            precio_max          = %s,
            estado_evaluacion   = 'completo'
        WHERE id_producto = %s
    """, (resultado["color_semaforo"], resultado["razon_clasificacion"],
          resultado["precio_min"], resultado["precio_max"], id_producto))

    cur.execute("DELETE FROM caracteristica WHERE id_producto = %s", (id_producto,))
    for c in resultado.get("caracteristicas", []):
        if c:
            cur.execute("INSERT INTO caracteristica (descripcion, id_producto) VALUES (%s, %s)", (c, id_producto))

    cur.execute("DELETE FROM ventaja WHERE id_producto = %s", (id_producto,))
    for v in resultado.get("ventajas", []):
        if v:
            cur.execute("INSERT INTO ventaja (descripcion, id_producto) VALUES (%s, %s)", (v, id_producto))

    cur.execute("DELETE FROM desventaja WHERE id_producto = %s", (id_producto,))
    for d in resultado.get("desventajas", []):
        if d:
            cur.execute("INSERT INTO desventaja (descripcion, id_producto) VALUES (%s, %s)", (d, id_producto))

    conn.commit()
    cur.close()
    conn.close()

# ─────────────────────────────────────────
# GUARDAR ARTÍCULO EN BD
# ─────────────────────────────────────────
def guardar_articulo(id_articulo, resultado):
    conn = conectar_bd()
    cur  = conn.cursor()

    cur.execute("""
        UPDATE articulo SET
            color_semaforo      = %s,
            razon_clasificacion = %s,
            precio_estimado     = %s,
            estado_evaluacion   = 'completo'
        WHERE id_articulo = %s
    """, (resultado["color_semaforo"], resultado["razon_clasificacion"],
          resultado["precio_estimado"], id_articulo))

    cur.execute("DELETE FROM caracteristica WHERE id_articulo = %s", (id_articulo,))
    for c in resultado.get("caracteristicas", []):
        if c:
            cur.execute("INSERT INTO caracteristica (descripcion, id_articulo) VALUES (%s, %s)", (c, id_articulo))

    cur.execute("DELETE FROM ventaja WHERE id_articulo = %s", (id_articulo,))
    for v in resultado.get("ventajas", []):
        if v:
            cur.execute("INSERT INTO ventaja (descripcion, id_articulo) VALUES (%s, %s)", (v, id_articulo))

    cur.execute("DELETE FROM desventaja WHERE id_articulo = %s", (id_articulo,))
    for d in resultado.get("desventajas", []):
        if d:
            cur.execute("INSERT INTO desventaja (descripcion, id_articulo) VALUES (%s, %s)", (d, id_articulo))

    conn.commit()
    cur.close()
    conn.close()

# ─────────────────────────────────────────
# OBTENER DATOS DE BD
# ─────────────────────────────────────────
def obtener_producto(id_producto):
    conn = conectar_bd()
    cur  = conn.cursor()
    cur.execute("""
        SELECT p.id_producto, p.nombre_producto, p.ingredientes,
               s.nombre_subcategoria, c.nombre_categoria
        FROM producto p
        JOIN subcategoria s ON p.id_subcategoria = s.id_subcategoria
        JOIN categoria c    ON s.id_categoria    = c.id_categoria
        WHERE p.id_producto = %s
    """, (id_producto,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row: return None
    return {"id": row[0], "nombre": row[1], "ingredientes": row[2],
            "subcategoria": row[3], "categoria": row[4]}

def obtener_articulo(id_articulo):
    conn = conectar_bd()
    cur  = conn.cursor()
    cur.execute("""
        SELECT a.id_articulo, a.nombre_articulo, a.descripcion,
               s.nombre_subcategoria, c.nombre_categoria
        FROM articulo a
        JOIN subcategoria s ON a.id_subcategoria = s.id_subcategoria
        JOIN categoria c    ON s.id_categoria    = c.id_categoria
        WHERE a.id_articulo = %s
    """, (id_articulo,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row: return None
    return {"id": row[0], "nombre": row[1], "descripcion": row[2],
            "subcategoria": row[3], "categoria": row[4]}

# ─────────────────────────────────────────
# MOSTRAR Y CONFIRMAR
# ─────────────────────────────────────────
def mostrar_producto(id_producto, resultado):
    print("\n═══════════════ RESULTADO ═══════════════")
    print(f"  Semáforo:     {resultado['color_semaforo'].upper()}")
    print(f"  Precio:       ${resultado['precio_min']} - ${resultado['precio_max']} MXN")
    print(f"  Razón:        {resultado['razon_clasificacion']}")
    print(f"  Características: {resultado.get('caracteristicas', [])}")
    print(f"  Ventajas:     {resultado.get('ventajas', [])}")
    print(f"  Desventajas:  {resultado.get('desventajas', [])}")
    print("═════════════════════════════════════════\n")
    if input("¿Guardar en Railway? (s/n): ").strip().lower() == "s":
        guardar_producto(id_producto, resultado)
        print("✅ Guardado.\n")
    else:
        print("⚠️  Cancelado.\n")

def mostrar_articulo(id_articulo, resultado):
    print("\n═══════════════ RESULTADO ═══════════════")
    print(f"  Semáforo:       {resultado['color_semaforo'].upper()}")
    print(f"  Precio est.:    ${resultado['precio_estimado']} MXN")
    print(f"  Razón:          {resultado['razon_clasificacion']}")
    print(f"  Características: {resultado.get('caracteristicas', [])}")
    print(f"  Ventajas:       {resultado.get('ventajas', [])}")
    print(f"  Desventajas:    {resultado.get('desventajas', [])}")
    print("═════════════════════════════════════════\n")
    if input("¿Guardar en Railway? (s/n): ").strip().lower() == "s":
        guardar_articulo(id_articulo, resultado)
        print("✅ Guardado.\n")
    else:
        print("⚠️  Cancelado.\n")

# ─────────────────────────────────────────
# CLASIFICACIÓN MASIVA
# ─────────────────────────────────────────
def clasificar_todos_productos():
    conn = conectar_bd()
    cur  = conn.cursor()
    cur.execute("""
        SELECT p.id_producto, p.nombre_producto, p.ingredientes,
               s.nombre_subcategoria, c.nombre_categoria
        FROM producto p
        JOIN subcategoria s ON p.id_subcategoria = s.id_subcategoria
        JOIN categoria c    ON s.id_categoria    = c.id_categoria
        WHERE p.estado_evaluacion IS NULL OR p.estado_evaluacion = 'insuficiente'
    """)
    productos = cur.fetchall()
    cur.close(); conn.close()

    print(f"\n{len(productos)} productos pendientes.")
    if input("¿Clasificar todos? (s/n): ").strip().lower() != "s": return

    for row in productos:
        id_p, nombre, ingredientes, subcat, cat = row
        print(f"⏳ {nombre}...")
        try:
            resultado = clasificar_producto(nombre, cat, subcat, ingredientes)
            guardar_producto(id_p, resultado)
            print(f"  ✅ {resultado['color_semaforo'].upper()}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    print("\n✅ Clasificación masiva completada.\n")

def clasificar_todos_articulos():
    conn = conectar_bd()
    cur  = conn.cursor()
    cur.execute("""
        SELECT a.id_articulo, a.nombre_articulo, a.descripcion,
               s.nombre_subcategoria, c.nombre_categoria
        FROM articulo a
        JOIN subcategoria s ON a.id_subcategoria = s.id_subcategoria
        JOIN categoria c    ON s.id_categoria    = c.id_categoria
        WHERE a.estado_evaluacion IS NULL OR a.estado_evaluacion = 'insuficiente'
    """)
    articulos = cur.fetchall()
    cur.close(); conn.close()

    print(f"\n{len(articulos)} artículos pendientes.")
    if input("¿Clasificar todos? (s/n): ").strip().lower() != "s": return

    for row in articulos:
        id_a, nombre, descripcion, subcat, cat = row
        print(f"⏳ {nombre}...")
        try:
            resultado = clasificar_articulo(nombre, cat, subcat, descripcion)
            guardar_articulo(id_a, resultado)
            print(f"  ✅ {resultado['color_semaforo'].upper()}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    print("\n✅ Clasificación masiva completada.\n")

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────
def main():
    print("\n══════════════════════════════════════")
    print("   LUMIKA — Clasificador con Claude    ")
    print("══════════════════════════════════════\n")
    print("  1. Clasificar un producto (buscador)")
    print("  2. Clasificar un artículo (recomendaciones)")
    print("  3. Clasificar TODOS los productos pendientes")
    print("  4. Clasificar TODOS los artículos pendientes")
    opcion = input("\nOpción (1/2/3/4): ").strip()

    if opcion == "1":
        id_item = input("ID del producto: ").strip()
        if not id_item.isdigit(): print("❌ ID inválido"); return
        item = obtener_producto(int(id_item))
        if not item: print("❌ No encontrado"); return
        print(f"\n✓ {item['nombre']} ({item['categoria']} › {item['subcategoria']})")
        print("⏳ Analizando con Claude...")
        resultado = clasificar_producto(item["nombre"], item["categoria"],
                                        item["subcategoria"], item["ingredientes"])
        mostrar_producto(int(id_item), resultado)

    elif opcion == "2":
        id_item = input("ID del artículo: ").strip()
        if not id_item.isdigit(): print("❌ ID inválido"); return
        item = obtener_articulo(int(id_item))
        if not item: print("❌ No encontrado"); return
        print(f"\n✓ {item['nombre']} ({item['categoria']} › {item['subcategoria']})")
        print("⏳ Analizando con Claude...")
        resultado = clasificar_articulo(item["nombre"], item["categoria"],
                                        item["subcategoria"], item["descripcion"])
        mostrar_articulo(int(id_item), resultado)

    elif opcion == "3":
        clasificar_todos_productos()
    elif opcion == "4":
        clasificar_todos_articulos()
    else:
        print("❌ Opción inválida")

if __name__ == "__main__":
    main()