import {
  listarSubcategorias,
  crearProducto, editarProducto, obtenerProducto,
  clasificarProducto,
  crearArticulo, obtenerArticulo
} from '/assets/js/api.js';

// ── Protección de ruta ────────────────────────────────────
const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
if (!token || (usuario.rol !== 'admin' && !usuario.is_staff && !usuario.is_superuser)) {
  window.location.href = '/auth/login/login.html';
}

// ── Parámetros de URL ─────────────────────────────────────
const params    = new URLSearchParams(window.location.search);
const esEdicion = params.get('edit') === 'true';
const tipoParam = params.get('tipo') || 'producto';
const idParam   = params.get('id');

let tipoActivo = tipoParam;
let modoActivo = 'manual';

// ── DOMContentLoaded ──────────────────────────────────────
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

  

  // Cargar subcategorías
  await cargarSubcategorias();

  if (esEdicion) {
    document.getElementById('tipo-tabs')?.classList.add('hidden');
    document.getElementById('modo-tabs')?.classList.add('hidden');
    document.getElementById('seccion-ia')?.classList.add('hidden');
    document.getElementById('seccion-manual')?.classList.remove('hidden');
    await cargarParaEdicion();
  } else {
    switchTipo(tipoParam, false);
  }

  // Listeners submit
  document.getElementById('form-producto')?.addEventListener('submit', submitProducto);
  document.getElementById('form-articulo')?.addEventListener('submit', submitArticulo);
});

// ── Subcategorías ─────────────────────────────────────────
async function cargarSubcategorias() {
  const { ok, data } = await listarSubcategorias().catch(() => ({ ok: false, data: [] }));

  const opciones = (ok && Array.isArray(data) && data.length)
    ? '<option value="">-- Selecciona --</option>' +
      data.map(s => `<option value="${s.id_subcategoria}">${s.nombre_categoria} › ${s.nombre_subcategoria}</option>`).join('')
    : '<option value="">Sin subcategorías disponibles</option>';

  document.getElementById('p-subcategoria') && (document.getElementById('p-subcategoria').innerHTML = opciones);
  document.getElementById('a-subcategoria') && (document.getElementById('a-subcategoria').innerHTML = opciones);
}

// ── Carga para edición ────────────────────────────────────
async function cargarParaEdicion() {
  const title = document.getElementById('dynamic-title');

  if (tipoParam === 'producto') {
    if (title) title.textContent = 'Editar producto';
    switchTipo('producto', false);

    const { ok, data } = await obtenerProducto(idParam);
    if (!ok) { mostrarError('No se pudo cargar el producto.'); return; }

    setVal('p-nombre',    data.nombre_producto);
    setVal('p-precio-min', data.precio_min);
    setVal('p-precio-max', data.precio_max);
    setVal('p-semaforo',  data.color_semaforo || '');
    setVal('p-razon',     data.razon_clasificacion || '');

    // Subcategoría — esperar a que el select tenga opciones
    const selSub = document.getElementById('p-subcategoria');
    if (selSub) {
      const idSub = data.id_subcategoria || data.subcategoria?.id_subcategoria;
      if (idSub) selSub.value = idSub;
    }

    const btn = document.getElementById('btn-submit-producto');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';

  } else {
    if (title) title.textContent = 'Editar artículo';
    switchTipo('articulo', false);

    const { ok, data } = await obtenerArticulo(idParam);
    if (!ok) { mostrarError('No se pudo cargar el artículo.'); return; }

    setVal('a-nombre',  data.nombre_articulo);
    setVal('a-impacto', data.impacto_ambiental);

    const selSub = document.getElementById('a-subcategoria');
    if (selSub && data.id_subcategoria) selSub.value = data.id_subcategoria;

    const btn = document.getElementById('btn-submit-articulo');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
  }
}

// ── Switch tipo Producto / Artículo ───────────────────────
window.switchTipo = function (tipo, updateTabs = true) {
  tipoActivo = tipo;

  const formP = document.getElementById('form-producto');
  const formA = document.getElementById('form-articulo');
  const title = document.getElementById('dynamic-title');

  formP?.classList.toggle('hidden', tipo !== 'producto');
  formA?.classList.toggle('hidden', tipo !== 'articulo');

  if (title) title.textContent = tipo === 'producto' ? 'Agregar producto' : 'Agregar artículo';

  if (updateTabs) {
    document.getElementById('tab-producto')?.classList.toggle('active', tipo === 'producto');
    document.getElementById('tab-articulo')?.classList.toggle('active', tipo === 'articulo');
  }
};

// ── Switch modo Manual / IA ───────────────────────────────
window.switchModo = function (modo) {
  modoActivo = modo;
  document.getElementById('tab-manual')?.classList.toggle('active', modo === 'manual');
  document.getElementById('tab-ia')?.classList.toggle('active',     modo === 'ia');
  document.getElementById('seccion-manual')?.classList.toggle('hidden', modo !== 'manual');
  document.getElementById('seccion-ia')?.classList.toggle('hidden',     modo !== 'ia');

  const btn = document.getElementById('btn-submit-producto');
  if (btn) btn.innerHTML = modo === 'manual'
    ? '<i class="fa-solid fa-floppy-disk"></i> Guardar producto'
    : '<i class="fa-solid fa-brain"></i> Clasificar con IA';
};

// ── Submit PRODUCTO ───────────────────────────────────────
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

  // Solo los campos que existen en el modelo Producto
  const body = {
    nombre_producto:     nombre,
    id_subcategoria:     parseInt(subcatId),
    precio_min:          parseFloat(getVal('p-precio-min'))  || null,
    precio_max:          parseFloat(getVal('p-precio-max'))  || null,
    color_semaforo:      getVal('p-semaforo')                || null,
    razon_clasificacion: getVal('p-razon')                   || null,
    estado_evaluacion:   getVal('p-semaforo') ? 'completo' : 'insuficiente',
  };

  try {
    if (modoActivo === 'manual') {
      const { ok, data } = esEdicion
        ? await editarProducto(idParam, body)
        : await crearProducto(body);

      if (ok) {
        mostrarExito('¡Producto guardado correctamente!');
      } else {
        const errMsg = typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : String(data);
        mostrarError(errMsg);
      }

    } else {
      // Modo IA: crear primero, luego clasificar
      const { ok: okC, data: creado } = await crearProducto(body);
      if (!okC) {
        const errMsg = typeof creado === 'object'
          ? Object.values(creado).flat().join(' ')
          : 'No se pudo crear el producto.';
        mostrarError(errMsg); return;
      }

      btn.innerHTML = '<i class="fa-solid fa-brain fa-spin"></i> Analizando con IA...';

      const { ok: okIA } = await clasificarProducto(creado.id_producto, {
        ingredientes:    getVal('p-ia-ingredientes'),
        empaque:         getVal('p-ia-empaque'),
        certificaciones: getVal('p-ia-certificaciones'),
        info_ambiental:  getVal('p-ia-info'),
      });

      mostrarExito(okIA ? '¡Clasificado con IA!' : 'Producto creado (IA no disponible ahora)');
    }

  } catch (err) {
    console.error(err);
    mostrarError('Error de conexión. ¿Está corriendo el backend?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── Submit ARTÍCULO ───────────────────────────────────────
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

  try {
    const { ok, data } = await crearArticulo({
      nombre_articulo:   nombre,
      impacto_ambiental: impacto,
      id_subcategoria:   parseInt(getVal('a-subcategoria')) || null,
    });

    if (ok) {
      mostrarExito('¡Artículo guardado correctamente!');
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

// ── Helpers ───────────────────────────────────────────────
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
