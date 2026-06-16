// favoritosArticulo.js
// Los favoritos de artículos se guardan en localStorage
// (la BD solo tiene tabla favorito para productos con NOT NULL en id_producto)

const STORAGE_KEY = 'lumika_favoritos_articulos';

function cargar() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(_) { return []; }
}

function guardar(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export function esFavoritoArticulo(idArticulo) {
  return cargar().some(f => String(f.id) === String(idArticulo));
}

export function agregarFavoritoArticuloLocal(articulo) {
  const lista = cargar();
  const id = String(articulo.id_articulo);
  if (!lista.find(f => f.id === id)) {
    lista.push({
      id,
      nombre:            articulo.nombre_articulo,
      color_semaforo:    articulo.color_semaforo    || null,
      precio_estimado:   articulo.precio_estimado   || null,
      impacto_ambiental: articulo.impacto_ambiental || null,
      id_subcategoria:   articulo.id_subcategoria   || null,
    });
    guardar(lista);
  }
}

export function eliminarFavoritoArticuloLocal(idArticulo) {
  guardar(cargar().filter(f => f.id !== String(idArticulo)));
}

export function obtenerFavoritosArticulosLocal() {
  return cargar();
}
