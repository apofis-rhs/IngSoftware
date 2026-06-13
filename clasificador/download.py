import json
import os
import requests
import time  # <-- Importamos la librería de tiempo
from duckduckgo_search import DDGS

# Ruta base de tu proyecto
ruta_base = "frontend/assets/images/productos"

with open('productos.json', 'r', encoding='utf-8') as archivo_json:
    productos = json.load(archivo_json)

print(f"Iniciando descarga inteligente de {len(productos)} imágenes...")

# Inicializar el buscador de DuckDuckGo
with DDGS() as ddgs:
    for producto in productos:
        nombre_busqueda = producto["nombre_producto"]
        categoria = producto["id_categoria"]
        nombre_final = producto["nombre_imagen"]
        
        # Crear carpeta de categoría si no existe
        ruta_categoria = os.path.join(ruta_base, categoria)
        os.makedirs(ruta_categoria, exist_ok=True)
        
        ruta_final_imagen = os.path.join(ruta_categoria, nombre_final)
        
        # Si la imagen ya existe, nos la saltamos
        if os.path.exists(ruta_final_imagen):
            print(f"⏭ Omitiendo (ya existe): {nombre_final}")
            continue
            
        print(f"\nBuscando: {nombre_busqueda}")
        
        try:
            # Buscar 1 sola imagen usando DDG
            resultados = list(ddgs.images(nombre_busqueda, max_results=1))
            
            if resultados:
                url_imagen = resultados[0]['image']
                
                # Descargar la imagen
                respuesta = requests.get(url_imagen, stream=True, timeout=10)
                
                if respuesta.status_code == 200:
                    with open(ruta_final_imagen, 'wb') as f:
                        for chunk in respuesta.iter_content(1024):
                            f.write(chunk)
                    print(f"✔ Descargada con éxito: {nombre_final}")
                else:
                    print(f"✖ Error HTTP {respuesta.status_code} al descargar: {url_imagen}")
            else:
                print(f"✖ No se encontraron imágenes para: {nombre_busqueda}")
                
        except Exception as e:
            print(f"✖ Error de conexión/búsqueda con {nombre_busqueda}: {e}")
            
        # <-- MAGIA ANTI-BLOQUEO: Esperar 2 segundos antes de la siguiente búsqueda
        time.sleep(2) 

print("\n¡Proceso terminado!")