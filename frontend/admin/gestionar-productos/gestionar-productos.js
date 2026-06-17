import { listarProductos, eliminarProducto, listarArticulosAdmin, eliminarArticulo } from '/assets/js/api.js';

const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
if (!token || (usuario.rol !== 'admin' && !usuario.is_staff && !usuario.is_superuser)) {
  window.location.href = '/auth/login/login.html';
}

let todosProductos = [];
let todosArticulos = [];
let tabActual      = 'productos';  
let idAEliminar    = null;
let tipoAEliminar  = null;

document.addEventListener('DOMContentLoaded', async () => {

  ['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
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

  // Búsqueda
  document.getElementById('input-buscar')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (tabActual === 'productos') {
      renderLista(q ? todosProductos.filter(p => p.nombre_producto.toLowerCase().includes(q)) : todosProductos, 'productos');
    } else {
      renderLista(q ? todosArticulos.filter(a => a.nombre_articulo.toLowerCase().includes(q)) : todosArticulos, 'articulos');
    }
  });

  // Modal
  document.getElementById('btn-cancelar-eliminar')?.addEventListener('click', cerrarModal);
  document.getElementById('delete-modal')?.addEventListener('click', e => {
    if (e.target.id === 'delete-modal') cerrarModal();
  });
  document.getElementById('btn-confirmar-eliminar')?.addEventListener('click', confirmarEliminar);

  // Carga
  await cargarTodo();
});

async function cargarTodo() {
  const loader  = document.getElementById('loader');
  const listaEl = document.getElementById('lista-items');

  try {
    const [resP, resA] = await Promise.all([listarProductos(), listarArticulosAdmin()]);
    todosProductos = (resP.ok && Array.isArray(resP.data)) ? resP.data : [];
    todosArticulos = (resA.ok && Array.isArray(resA.data)) ? resA.data : [];
    renderLista(todosProductos, 'productos');
  } catch (err) {
    console.error('Error cargando:', err);
    if (listaEl) listaEl.innerHTML = '<p style="color:#999;text-align:center;padding:30px">Error de conexión al servidor.</p>';
  } finally {
    loader?.classList.add('hidden');
    listaEl?.classList.remove('hidden');
  }
}

window.cambiarTab = function(tab) {
  tabActual = tab;
  document.getElementById('input-buscar').value = '';

  document.getElementById('tab-productos')?.classList.toggle('active', tab === 'productos');
  document.getElementById('tab-articulos')?.classList.toggle('active', tab === 'articulos');

  const tipoEl = document.getElementById('tipo-actual');
  if (tipoEl) tipoEl.textContent = tab === 'productos' ? 'Productos' : 'Artículos';

  if (tab === 'productos') {
    renderLista(todosProductos, 'productos');
  } else {
    renderLista(todosArticulos, 'articulos');
  }
};

/* ── RENDER ACTUALIZADO PARA DISEÑO DE TARJETAS ── */
function renderLista(lista, tipo) {
  const listaEl = document.getElementById('lista-items');
  const totalEl = document.getElementById('total-items');
  if (!listaEl) return;

  const n = lista.length;
  if (totalEl) totalEl.textContent = `${n} ${tipo === 'productos' ? 'Producto' : 'Artículo'}${n !== 1 ? 's' : ''} en total`;

  if (!n) {
    listaEl.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #fff; border-radius: 20px; border: 2px dashed #eee;">
        <i class="fa-solid fa-box-open" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
        <p style="color:#999; font-weight: bold;">No se encontraron resultados.</p>
      </div>`;
    return;
  }

  const dotColors = { verde:'var(--color-success)', amarillo:'#FF9800', rojo:'var(--color-secondary-dark)' };

  listaEl.innerHTML = lista.map((item, i) => {
    const esProducto = tipo === 'productos';
    const id     = esProducto ? item.id_producto   : item.id_articulo;
    const nombre = esProducto ? item.nombre_producto : item.nombre_articulo;
    const color  = esProducto ? item.color_semaforo : null;
    const dot    = color ? `background:${dotColors[color] || '#ccc'}` : 'background:var(--color-success)';
    const editHref = esProducto
      ? `/admin/agregar-producto/agregar-producto.html?tipo=producto&edit=true&id=${id}`
      : `/admin/agregar-producto/agregar-producto.html?tipo=articulo&edit=true&id=${id}`;

    // El animation-delay hace el efecto escalonado al cargar
    return `
      <div class="product-item-card" style="animation-delay: ${i * 0.05}s">
        <div class="product-item-card__info">
          <span class="status-indicator" style="${dot}"></span>
          <span class="product-item-card__name">${nombre}</span>
        </div>
        <div class="product-item-card__actions">
          <a href="${editHref}" class="btn-action-trigger btn-action-trigger--edit" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </a>
          <button class="btn-action-trigger btn-action-trigger--delete" title="Eliminar"
                  onclick="abrirModal(${id}, '${tipo}', '${nombre.replace(/'/g,"\\'")}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

window.abrirModal = function(id, tipo, nombre) {
  idAEliminar   = id;
  tipoAEliminar = tipo;
  const el = document.getElementById('modal-nombre-item');
  if (el) el.textContent = `"${nombre}"`;
  document.getElementById('delete-modal')?.classList.add('open');
};

function cerrarModal() {
  document.getElementById('delete-modal')?.classList.remove('open');
  idAEliminar = tipoAEliminar = null;
}

async function confirmarEliminar() {
  if (!idAEliminar) return;
  const btn = document.getElementById('btn-confirmar-eliminar');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const { ok } = tipoAEliminar === 'productos'
      ? await eliminarProducto(idAEliminar)
      : await eliminarArticulo(idAEliminar);

    if (ok) {
      if (tipoAEliminar === 'productos') {
        todosProductos = todosProductos.filter(p => p.id_producto !== idAEliminar);
        renderLista(todosProductos, 'productos');
      } else {
        todosArticulos = todosArticulos.filter(a => a.id_articulo !== idAEliminar);
        renderLista(todosArticulos, 'articulos');
      }
      mostrarToast('Eliminado correctamente.');
    } else {
      mostrarToast('No se pudo eliminar.', 'error');
    }
  } catch { mostrarToast('Error de conexión.', 'error'); }
  finally {
    btn.disabled = false; btn.innerHTML = 'Eliminar';
    cerrarModal();
  }
}

function mostrarToast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.className = 'lumika-toast';
  t.style.background = tipo === 'error' ? 'var(--color-secondary-dark)' : 'var(--color-success)';
  t.textContent = msg;
  
  // Estilos dinámicos para que se vea bonito el toast
  Object.assign(t.style, {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%) translateY(50px)',
    color: 'white', padding: '12px 24px', borderRadius: '50px', fontWeight: 'bold',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)', opacity: '0', transition: 'all 0.3s ease', zIndex: '9999'
  });

  document.body.appendChild(t);
  
  setTimeout(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(50px)';
    setTimeout(() => t.remove(), 300);
  }, 2800);
}