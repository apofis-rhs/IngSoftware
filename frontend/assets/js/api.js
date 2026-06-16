// LUMIKA — api.js
// TODAS las llamadas al backend van aquí.
// Nadie más debe escribir fetch() en sus propios archivos.

const API_URL = 'http://localhost:8000/api';

function getToken() { return localStorage.getItem('token'); }
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

// ─────────────────────────────────────────
// USUARIOS — auth
// ─────────────────────────────────────────

// LOGIN
// Manda:   { nombre_usuario, contrasena }
// Regresa: { token, usuario: { id_usuario, nombre_usuario, ... } }
export async function login(nombre_usuario, contrasena) {
  const res = await fetch(`${API_URL}/usuarios/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario, contrasena })
  });
  const data = await res.json();
  if (res.ok) localStorage.setItem('token', data.token);
  return { ok: res.ok, data };
}

// REGISTRO
// Manda:   { nombre_usuario, contrasena, ...otros campos del modelo Usuario }
// Regresa: los datos del usuario creado
export async function registro(datos) {
  // datos = { nombre_usuario, contrasena, correo, nombre, ... }
  const res = await fetch(`${API_URL}/usuarios/registro/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return { ok: res.ok, data: await res.json() };
}

// LOGOUT — borra el token local y manda al login
export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/auth/login/login.html';
}

// Devuelve true si hay token guardado, false si no
export function estaLogueado() {
  return !!localStorage.getItem('token');
}

// ─────────────────────────────────────────
// USUARIOS — perfil
// ─────────────────────────────────────────

// Regresa todos los campos del usuario (menos contrasena)
export async function obtenerPerfil() {
  const res = await fetch(`${API_URL}/usuarios/perfil/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// EDITAR PERFIL
// Manda solo los campos que cambian, ej: { nombre: 'Ana' }
// NO mandar contrasena aquí, el backend la ignora en este endpoint
export async function editarPerfil(datos) {
  const res = await fetch(`${API_URL}/usuarios/perfil/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
  return { ok: res.ok, data: await res.json() };
}

// Marca la cuenta como 'eliminado' (no borra de la BD)
export async function eliminarCuenta() {
  const res = await fetch(`${API_URL}/usuarios/perfil/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return { ok: res.ok };
}

// CAMBIAR CONTRASEÑA
// Manda: { contrasena_actual, nueva_contrasena }   ← ojo: nueva_contrasena, no contrasena_nueva
// Regresa: { mensaje: 'Contraseña actualizada' }
export async function cambiarContrasena(contrasenaActual, nuevaContrasena) {
  const res = await fetch(`${API_URL}/usuarios/cambiar-contrasena/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ contrasena_actual: contrasenaActual, nueva_contrasena: nuevaContrasena })
  });
  return { ok: res.ok, data: await res.json() };
}

// ─────────────────────────────────────────
// USUARIOS — historial
// Regresa lista de consultas ordenadas por fecha (más reciente primero)
// Cada item: { id_producto, nombre_producto, color_semaforo, fecha_consulta, ... }
// ─────────────────────────────────────────

export async function obtenerHistorial() {
  const res = await fetch(`${API_URL}/usuarios/historial/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// ─────────────────────────────────────────
// USUARIOS — favoritos
// Cada item regresa: { id_producto, nombre_producto, color_semaforo, ... }
// ─────────────────────────────────────────

export async function obtenerFavoritos() {
  const res = await fetch(`${API_URL}/usuarios/favoritos/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// Manda: { id_producto }
// Si ya existe el favorito regresa 200, si es nuevo regresa 201
export async function agregarFavorito(idProducto) {
  const res = await fetch(`${API_URL}/usuarios/favoritos/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id_producto: idProducto })
  });
  return { ok: res.ok, data: await res.json() };
}

export async function obtenerFavoritosArticulo() {
  const res = await fetch(`${API_URL}/usuarios/favoritos/`, { headers: authHeaders() });
  const data = await res.json();
  return { ok: res.ok, data: Array.isArray(data) ? data.filter(f => f.es_articulo) : [] };
}

export async function agregarFavoritoArticulo(idArticulo) {
  const res = await fetch(`${API_URL}/usuarios/favoritos/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id_articulo: idArticulo })
  });
  return { ok: res.ok, data: await res.json() };
}

export async function eliminarFavoritoArticulo(idArticulo) {
  const res = await fetch(`${API_URL}/usuarios/favoritos/`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ id_articulo: idArticulo })
  });
  return { ok: res.ok };
}

// Manda: { id_producto }
// Regresa: { mensaje: 'Favorito eliminado' }
export async function eliminarFavorito(idProducto) {
  const res = await fetch(`${API_URL}/usuarios/favoritos/`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ id_producto: idProducto })
  });
  return { ok: res.ok };
}

// ─────────────────────────────────────────
// PRODUCTOS — búsqueda
// Regresa lista con: id_producto, nombre_producto, precio_min, precio_max,
//                    color_semaforo, estado_evaluacion, id_subcategoria
// ─────────────────────────────────────────

export async function buscarProductos(texto) {
  const res = await fetch(`${API_URL}/productos/buscar/?q=${encodeURIComponent(texto)}`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// ─────────────────────────────────────────
// PRODUCTOS — detalle
// Regresa: id_producto, nombre_producto, precio_min, precio_max,
//          color_semaforo, razon_clasificacion, estado_evaluacion,
//          subcategoria: { ... },
//          ventajas:       [ { id_ventaja, descripcion } ],
//          desventajas:    [ { id_desventaja, descripcion } ],
//          caracteristicas:[ { id_caracteristica, descripcion } ],
//          criterios:      [ { id_criterio, nombre_criterio, descripcion, resultado } ]
// NOTA: ver un producto también guarda la consulta en historial automáticamente
// ─────────────────────────────────────────

export async function obtenerProducto(idProducto) {
  const res = await fetch(`${API_URL}/productos/${idProducto}/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// Regresa lista de productos con color_semaforo = 'verde' de la misma subcategoría
export async function obtenerAlternativasProducto(idProducto) {
  const res = await fetch(`${API_URL}/productos/${idProducto}/alternativas/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// ids = array de números, máximo 3, ej: [1, 2, 3]
// Regresa lista de ProductoDetalle para cada id
export async function compararProductos(ids) {
  const res = await fetch(`${API_URL}/productos/comparar/?ids=${ids.join(',')}`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// ─────────────────────────────────────────
// ARTÍCULOS
// Lista regresa:  [ { id_articulo, nombre_articulo, id_subcategoria } ]
// Detalle regresa: todos los campos + alternativas: [ { ...campos } ]
// NOTA: ver un artículo también guarda la consulta en historial automáticamente
// ─────────────────────────────────────────

export async function buscarArticulos(texto) {
  const res = await fetch(`${API_URL}/articulos/buscar/?q=${encodeURIComponent(texto)}`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

export async function obtenerArticulo(idArticulo) {
  const res = await fetch(`${API_URL}/articulos/${idArticulo}/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

export async function obtenerAlternativasArticulo(idArticulo) {
  const res = await fetch(`${API_URL}/articulos/${idArticulo}/alternativas/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}

// ─────────────────────────────────────────
// EVALUACIONES
// Manda: { id_producto, calificacion (1-5), ...otros campos del modelo }
// El backend agrega id_usuario automáticamente desde el token
// Regresa: los datos de la evaluación creada
// ─────────────────────────────────────────

export async function enviarEvaluacion(idProducto, calificacion, comentario) {
  const res = await fetch(`${API_URL}/evaluaciones/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id_producto: idProducto, calificacion, comentario })
  });
  return { ok: res.ok, data: await res.json() };
}

// Admin — clasificar producto con IA
// datos = { ingredientes, empaque, certificaciones, info_ambiental }
export async function clasificarProducto(idProducto, datos) {
  const res = await fetch(`${API_URL}/productos/${idProducto}/clasificar/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
  return { ok: res.ok, data: await res.json() };
}

// ─────────────────────────────────────────
// ADMIN — productos (CRUD completo)
// Requieren token de admin/staff
// ─────────────────────────────────────────

// Regresa lista completa de productos (solo admin)
export async function listarProductos() {
  const res = await fetch(`${API_URL}/productos/`, { headers: authHeaders() });
  return { ok: res.ok, data: await res.json() };
}

// Crear un producto nuevo
// datos = { nombre_producto, id_subcategoria, precio_min, precio_max, ... }
export async function crearProducto(datos) {
  const res = await fetch(`${API_URL}/productos/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
  return { ok: res.ok, data: await res.json() };
}

// Editar un producto existente
export async function editarProducto(idProducto, datos) {
  const res = await fetch(`${API_URL}/productos/${idProducto}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
  return { ok: res.ok, data: await res.json() };
}

// Eliminar un producto
export async function eliminarProducto(idProducto) {
  const res = await fetch(`${API_URL}/productos/${idProducto}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return { ok: res.ok || res.status === 204 };
}

// Regresa lista de subcategorías
export async function listarSubcategorias() {
  const res = await fetch(`${API_URL}/productos/subcategorias/`, { headers: authHeaders() });
  return { ok: res.ok, data: await res.json() };
}

// Login de superusuario Django (manage.py createsuperuser)
// Solo se usa si el endpoint /api/usuarios/login-admin/ existe en el backend
export async function loginAdmin(nombre_usuario, contrasena) {
  const res = await fetch(`${API_URL}/usuarios/login-admin/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario, contrasena })
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    localStorage.setItem('token',   data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  }
  return { ok: res.ok, data };
}


// ─────────────────────────────────────────
// ADMIN — artículos
// ─────────────────────────────────────────

export async function listarArticulosAdmin() {
  const res = await fetch(`${API_URL}/productos/articulos-admin/`, { headers: authHeaders() });
  return { ok: res.ok, data: await res.json() };
}

export async function crearArticulo(datos) {
  // datos = { nombre_articulo, impacto_ambiental, id_subcategoria }
  const res = await fetch(`${API_URL}/productos/articulos-admin/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos)
  });
  return { ok: res.ok, data: await res.json() };
}

export async function eliminarArticulo(idArticulo) {
  const res = await fetch(`${API_URL}/productos/articulos-admin/${idArticulo}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return { ok: res.ok || res.status === 204 };
}


// ─────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────
export async function listarCategorias() {
  const res = await fetch(`${API_URL}/productos/categorias/`, { headers: authHeaders() });
  return { ok: res.ok, data: await res.json() };
}

// buscarProductos con filtros opcionales
// opciones = { categoria, orden } (además de texto)
export async function buscarProductosFiltrado(texto = '', opciones = {}) {
  const params = new URLSearchParams();
  if (texto)            params.set('q', texto);
  if (opciones.categoria) params.set('categoria', opciones.categoria);
  if (opciones.orden)   params.set('orden', opciones.orden);
  const res = await fetch(`${API_URL}/productos/buscar/?${params}`, { headers: authHeaders() });
  return { ok: res.ok, data: await res.json() };
}


// Recomendaciones basadas en historial del usuario
// Regresa: { recomendados: [...], populares: [...] }
export async function obtenerRecomendaciones() {
  const res = await fetch(`${API_URL}/articulos/recomendaciones/`, {
    headers: authHeaders()
  });
  return { ok: res.ok, data: await res.json() };
}
