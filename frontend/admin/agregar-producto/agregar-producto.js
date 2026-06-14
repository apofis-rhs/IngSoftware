// admin/agregar-producto.js
import {
  clasificarProducto,
  crearProducto,
  editarProducto,
  obtenerProducto,
  listarSubcategorias,
  loginAdmin
} from '../../assets/js/api.js';

const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token || (usuario.rol !== 'admin' && !usuario.is_staff && !usuario.is_superuser)) {
  window.location.href = '../../auth/login/login.html';
}

let modoActivo = 'manual';

document.addEventListener('DOMContentLoaded', async () => {

  const elNombre = document.getElementById('admin-nombre');
  if (elNombre) elNombre.textContent = usuario.nombre_usuario || usuario.username || 'Admin';

  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  });

  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });

  // Subcategorías usando api.js
  await cargarSubcategorias();

  // Modo edición
  const params     = new URLSearchParams(window.location.search);
  const esEdicion  = params.get('edit') === 'true';
  const idProducto = params.get('id');

  if (esEdicion && idProducto) {
    const h = document.getElementById('form-title');
    if (h) h.textContent = 'Editar producto';
    document.getElementById('btn-modo-ia')?.classList.add('hidden');

    // Usa obtenerProducto de api.js
    const { ok, data } = await obtenerProducto(idProducto);
    if (ok) {
      setVal('input-nombre',     data.nombre_producto);
      setVal('input-precio-min', data.precio_min);
      setVal('input-precio-max', data.precio_max);
      const sel = document.getElementById('input-subcategoria');
      if (sel) sel.value = data.id_subcategoria || data.subcategoria?.id_subcategoria || '';
    }
  }

  document.getElementById('btn-modo-manual')?.addEventListener('click', () => setModo('manual'));
  document.getElementById('btn-modo-ia')?.addEventListener('click',     () => setModo('ia'));
  document.getElementById('form-agregar-producto')?.addEventListener('submit', e =>
    manejarSubmit(e, esEdicion, idProducto)
  );
});

async function cargarSubcategorias() {
  const sel = document.getElementById('input-subcategoria');
  if (!sel) return;
  // Usa listarSubcategorias de api.js
  const { ok, data } = await listarSubcategorias().catch(() => ({ ok: false, data: [] }));
  if (!ok) return;
  sel.innerHTML = `<option value="">Selecciona una subcategoría...</option>` +
    data.map(s => `<option value="${s.id_subcategoria}">${s.nombre_subcategoria}</option>`).join('');
}

function setModo(modo) {
  modoActivo = modo;
  document.getElementById('btn-modo-manual')?.classList.toggle('active', modo === 'manual');
  document.getElementById('btn-modo-ia')?.classList.toggle('active',     modo === 'ia');
  const secManual = document.getElementById('seccion-manual');
  const secIA     = document.getElementById('seccion-ia');
  if (secManual) secManual.style.display = modo === 'manual' ? 'block' : 'none';
  if (secIA)     secIA.style.display     = modo === 'ia'     ? 'block' : 'none';
  const btnSubmit = document.getElementById('btn-guardar-main');
  if (btnSubmit) {
    btnSubmit.innerHTML = modo === 'manual'
      ? '<i class="fa-solid fa-floppy-disk"></i> Guardar producto'
      : '<i class="fa-solid fa-wand-magic-sparkles"></i> Clasificar con IA';
  }
}

async function manejarSubmit(e, esEdicion, idProducto) {
  e.preventDefault();

  const nombre    = getVal('input-nombre');
  const subcatId  = getVal('input-subcategoria');
  const precioMin = getVal('input-precio-min');
  const precioMax = getVal('input-precio-max');
  const btnSubmit = document.getElementById('btn-guardar-main');
  const modal     = document.getElementById('successModal');

  if (!nombre) { mostrarError('El nombre del producto es obligatorio.'); return; }

  const textoOrig = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

  const body = {
    nombre_producto: nombre,
    id_subcategoria: parseInt(subcatId) || null,
    precio_min:      parseFloat(precioMin) || null,
    precio_max:      parseFloat(precioMax) || null,
  };

  try {
    if (modoActivo === 'manual') {
      // Usa crearProducto o editarProducto de api.js
      const { ok, data } = esEdicion
        ? await editarProducto(idProducto, body)
        : await crearProducto(body);

      ok ? abrirModal(modal)
         : mostrarError(data?.nombre_producto?.[0] || data?.error || 'Error al guardar.');

    } else {
      // Usa crearProducto + clasificarProducto de api.js
      const { ok: okCreate, data: productoCreado } = await crearProducto(body);
      if (!okCreate) { mostrarError('No se pudo crear el producto base.'); return; }

      btnSubmit.innerHTML = '<i class="fa-solid fa-brain fa-spin"></i> Analizando con IA...';

      const { ok: okIA } = await clasificarProducto(productoCreado.id_producto, {
        ingredientes:    getVal('input-ia-ingredientes'),
        empaque:         getVal('input-ia-empaque'),
        certificaciones: getVal('input-ia-certificaciones') || '',
        info_ambiental:  getVal('input-ia-info-ambiental')  || '',
      });

      if (okIA) {
        abrirModal(modal);
      } else {
        mostrarToast('Producto creado, pero la IA no está disponible ahora.', 'warning');
        setTimeout(() => window.location.href = '../gestionar-productos/gestionar-productos.html', 2500);
      }
    }
  } catch { mostrarError('Error de conexión. ¿Está corriendo el backend?'); }
  finally  { btnSubmit.disabled = false; btnSubmit.innerHTML = textoOrig; }
}

function abrirModal(modal) {
  if (!modal) { window.location.href = '../gestionar-productos/gestionar-productos.html'; return; }
  modal.classList.add('open');
  setTimeout(() => {
    modal.classList.remove('open');
    window.location.href = '../gestionar-productos/gestionar-productos.html';
  }, 2000);
}

function getVal(id)      { return document.getElementById(id)?.value?.trim() || ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el && val != null) el.value = val; }

function mostrarError(texto) {
  const div = document.getElementById('mensaje-error');
  if (div) { div.textContent = texto; div.style.display = 'block'; setTimeout(() => div.style.display = 'none', 4000); }
  else alert(texto);
}

function mostrarToast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${tipo==='error'?'#ff4d5a':tipo==='warning'?'#FFAC00':'#BAC423'};
    color:#fff;padding:12px 24px;border-radius:12px;z-index:9999;font-size:.9rem;font-weight:500`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
