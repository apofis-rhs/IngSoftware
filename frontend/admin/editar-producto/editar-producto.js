import {
  listarSubcategorias,
  editarProducto, obtenerProducto,
  editarArticulo, listarArticulosAdmin,
} from '/assets/js/api.js';

// ── Protección de ruta ────────────────────────────────────
const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
if (!token || (usuario.rol !== 'admin' && !usuario.is_staff && !usuario.is_superuser)) {
  window.location.href = '/auth/login/login.html';
}

// ── Parámetros de URL ─────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
const tipo    = params.get('tipo') === 'articulo' ? 'articulo' : 'producto';
const idParam = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {

  // Nav
  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '/auth/login/login.html';
    });
  });
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });

  if (!idParam) {
    mostrarError('Falta el id del registro a editar.');
    document.getElementById('loader-edicion')?.classList.add('hidden');
    return;
  }

  await cargarSubcategorias();

  const title = document.getElementById('dynamic-title');

  if (tipo === 'producto') {
    if (title) title.textContent = 'Editar producto';
    await cargarProducto();
    document.getElementById('form-producto')?.addEventListener('submit', submitProducto);
  } else {
    if (title) title.textContent = 'Editar artículo';
    await cargarArticulo();
    document.getElementById('form-articulo')?.addEventListener('submit', submitArticulo);
  }
});

// ── Subcategorías (compartidas por ambos forms) ───────────
async function cargarSubcategorias() {
  const { ok, data } = await listarSubcategorias().catch(() => ({ ok: false, data: [] }));

  const opciones = (ok && Array.isArray(data) && data.length)
    ? '<option value="">-- Selecciona --</option>' +
      data.map(s => `<option value="${s.id_subcategoria}">${s.nombre_categoria} › ${s.nombre_subcategoria}</option>`).join('')
    : '<option value="">Sin subcategorías disponibles</option>';

  document.getElementById('p-subcategoria') && (document.getElementById('p-subcategoria').innerHTML = opciones);
  document.getElementById('a-subcategoria') && (document.getElementById('a-subcategoria').innerHTML = opciones);
}

// ── Cargar PRODUCTO existente ──────────────────────────────
async function cargarProducto() {
  const { ok, data } = await obtenerProducto(idParam);
  if (!ok) {
    mostrarError('No se pudo cargar el producto.');
    document.getElementById('loader-edicion')?.classList.add('hidden');
    return;
  }

  setVal('p-nombre',       data.nombre_producto);
  setVal('p-precio-min',   data.precio_min);
  setVal('p-precio-max',   data.precio_max);
  setVal('p-semaforo',     data.color_semaforo || '');
  setVal('p-razon',        data.razon_clasificacion || '');
  setVal('p-ingredientes', data.ingredientes || '');

  const selSub = document.getElementById('p-subcategoria');
  if (selSub) {
    const idSub = data.id_subcategoria || data.subcategoria?.id_subcategoria;
    if (idSub) selSub.value = idSub;
  }

  mostrarFormulario('form-producto');
}

// ── Cargar ARTÍCULO existente ──────────────────────────────
// Usamos listarArticulosAdmin() + filtro local en vez de obtenerArticulo()
// porque ese endpoint registra una ConsultaArticulo real cada vez que se
// llama, y no queremos contaminar las estadísticas de consultas reales
// solo por abrir la pantalla de edición.
async function cargarArticulo() {
  const { ok, data } = await listarArticulosAdmin();
  if (!ok) {
    mostrarError('No se pudo cargar el catálogo de artículos.');
    document.getElementById('loader-edicion')?.classList.add('hidden');
    return;
  }

  const articulo = (data || []).find(a => String(a.id_articulo) === String(idParam));
  if (!articulo) {
    mostrarError('No se encontró el artículo solicitado.');
    document.getElementById('loader-edicion')?.classList.add('hidden');
    return;
  }

  setVal('a-nombre',          articulo.nombre_articulo);
  setVal('a-precio-estimado', articulo.precio_estimado);
  setVal('a-semaforo',        articulo.color_semaforo || '');
  setVal('a-impacto',         articulo.impacto_ambiental || '');

  const selSub = document.getElementById('a-subcategoria');
  if (selSub && articulo.id_subcategoria) selSub.value = articulo.id_subcategoria;

  mostrarFormulario('form-articulo');
}

function mostrarFormulario(formId) {
  document.getElementById('loader-edicion')?.classList.add('hidden');
  document.getElementById(formId)?.classList.remove('hidden');
}

// ── Submit PRODUCTO ────────────────────────────────────────
async function submitProducto(e) {
  e.preventDefault();

  const nombre   = getVal('p-nombre');
  const subcatId = getVal('p-subcategoria');

  if (!nombre)   { mostrarError('El nombre del producto es obligatorio.'); return; }
  if (!subcatId) { mostrarError('Selecciona una subcategoría.'); return; }

  const btn  = document.getElementById('btn-submit-producto');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  const body = {
    nombre_producto:     nombre,
    id_subcategoria:     parseInt(subcatId),
    precio_min:          parseFloat(getVal('p-precio-min')) || null,
    precio_max:          parseFloat(getVal('p-precio-max')) || null,
    color_semaforo:      getVal('p-semaforo') || null,
    razon_clasificacion: getVal('p-razon') || null,
    ingredientes:        getVal('p-ingredientes') || null,
    estado_evaluacion:   getVal('p-semaforo') ? 'completo' : 'insuficiente',
  };

  try {
    const { ok, data } = await editarProducto(idParam, body);
    if (ok) {
      mostrarExito('¡Producto actualizado correctamente!');
    } else {
      const errMsg = typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : String(data);
      mostrarError(errMsg);
    }
  } catch (err) {
    console.error(err);
    mostrarError('Error de conexión. ¿Está corriendo el backend?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── Submit ARTÍCULO ────────────────────────────────────────
async function submitArticulo(e) {
  e.preventDefault();

  const nombre  = getVal('a-nombre');
  const impacto = getVal('a-impacto');

  if (!nombre)  { mostrarError('El nombre del artículo es obligatorio.'); return; }
  if (!impacto) { mostrarError('El impacto ambiental es obligatorio.'); return; }

  const btn  = document.getElementById('btn-submit-articulo');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  const body = {
    nombre_articulo:   nombre,
    impacto_ambiental: impacto,
    id_subcategoria:   parseInt(getVal('a-subcategoria')) || null,
    precio_estimado:   parseFloat(getVal('a-precio-estimado')) || null,
    color_semaforo:    getVal('a-semaforo') || null,
  };

  try {
    const { ok, data } = await editarArticulo(idParam, body);
    if (ok) {
      mostrarExito('¡Artículo actualizado correctamente!');
    } else {
      const errMsg = typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : String(data);
      mostrarError(errMsg);
    }
  } catch (err) {
    console.error(err);
    mostrarError('Error de conexión. ¿Está corriendo el backend?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── Helpers ────────────────────────────────────────────────
function mostrarExito(msg) {
  const modal = document.getElementById('success-modal');
  const msgEl = document.getElementById('success-msg');
  if (msgEl) msgEl.textContent = msg;
  modal?.classList.add('open');
  setTimeout(() => {
    modal?.classList.remove('open');
    window.location.href = '/admin/gestionar-productos/gestionar-productos.html';
  }, 2000);
}

function mostrarError(texto) {
  const div = document.getElementById('mensaje-error');
  if (!div) { alert(texto); return; }
  div.textContent = texto;
  div.classList.remove('hidden');
  setTimeout(() => div.classList.add('hidden'), 5000);
}

function getVal(id)      { return document.getElementById(id)?.value?.trim() || ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el && val != null) el.value = val; }
