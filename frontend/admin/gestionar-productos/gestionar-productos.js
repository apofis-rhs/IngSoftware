// admin/gestionar-productos.js
import { listarProductos, eliminarProducto } from '../../assets/js/api.js';

const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token || (usuario.rol !== 'admin' && !usuario.is_staff && !usuario.is_superuser)) {
  window.location.href = '../../auth/login/login.html';
}

let todos       = [];
let idAEliminar = null;

document.addEventListener('DOMContentLoaded', async () => {

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

  // Búsqueda en tiempo real
  document.getElementById('input-buscar')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderProductos(q ? todos.filter(p => p.nombre_producto.toLowerCase().includes(q)) : todos);
  });

  // Modal eliminar
  document.getElementById('btn-cancelar-eliminar')?.addEventListener('click', cerrarModal);
  document.getElementById('delete-modal')?.addEventListener('click', e => {
    if (e.target.id === 'delete-modal') cerrarModal();
  });
  document.getElementById('btn-confirmar-eliminar')?.addEventListener('click', async () => {
    if (!idAEliminar) return;
    const btn = document.getElementById('btn-confirmar-eliminar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    // Usa eliminarProducto de api.js
    const { ok } = await eliminarProducto(idAEliminar);
    cerrarModal();
    btn.disabled = false; btn.innerHTML = 'Eliminar';

    if (ok) {
      todos = todos.filter(p => p.id_producto !== idAEliminar);
      idAEliminar = null;
      renderProductos(todos);
      mostrarToast('Producto eliminado correctamente.');
    } else {
      mostrarToast('No se pudo eliminar el producto.', 'error');
    }
  });

  await cargarProductos();
});

async function cargarProductos() {
  const listaEl = document.getElementById('lista-productos');
  const loader  = document.getElementById('loader');

  try {
    // Usa listarProductos de api.js
    const { ok, data } = await listarProductos();
    todos = ok && Array.isArray(data) ? data : [];
    renderProductos(todos);
  } catch {
    if (listaEl) listaEl.innerHTML = `<p style="color:#999;text-align:center;padding:30px">Error de conexión.</p>`;
  } finally {
    loader?.classList.add('hidden');
    document.getElementById('lista-productos')?.classList.remove('hidden');
  }
}

function renderProductos(lista) {
  const listaEl = document.getElementById('lista-productos');
  if (!listaEl) return;

  const total = document.getElementById('total-productos');
  if (total) total.textContent = `${lista.length} producto${lista.length !== 1 ? 's' : ''}`;

  if (!lista.length) {
    listaEl.innerHTML = `<p style="color:#999;text-align:center;padding:30px">No hay productos.</p>`;
    return;
  }

  const dotColor = { verde:'#BAC423', amarillo:'#FFAC00', rojo:'#FF4A58' };

  listaEl.innerHTML = lista.map(p => {
    const color = p.color_semaforo;
    const dot   = color ? `background:${dotColor[color]}` : 'background:#9E9E9E';
    return `
      <div class="product-row" data-id="${p.id_producto}">
        <div class="product-row__dot" style="${dot}"></div>
        <div class="product-row__nombre">${p.nombre_producto}</div>
        <div class="product-row__acciones">
          <a href="../agregar-producto/agregar-producto.html?edit=true&id=${p.id_producto}"
             class="btn-row btn-row--edit" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </a>
          <button class="btn-row btn-row--delete" title="Eliminar"
                  onclick="abrirModal(${p.id_producto})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

// Expuesto globalmente para el onclick en el HTML generado
window.abrirModal = function(id) {
  idAEliminar = id;
  document.getElementById('delete-modal')?.classList.add('open');
};

function cerrarModal() {
  document.getElementById('delete-modal')?.classList.remove('open');
  idAEliminar = null;
}

function mostrarToast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${tipo==='error'?'#ff4d5a':'#BAC423'};color:#fff;
    padding:12px 24px;border-radius:12px;z-index:9999;font-size:.9rem;font-weight:500`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
