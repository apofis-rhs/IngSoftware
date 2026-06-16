import { buscarProductosFiltrado, listarCategorias } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

const POR_PAGINA = 10;
let todosResultados  = [];
let visibles         = POR_PAGINA;
let categoriaActual  = '';
let ordenActual      = 'nombre';
let categorias       = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // Nav
  const hamburger = document.getElementById('hamburger');
  const navDrawer  = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });
  ['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '/auth/login/login.html';
    });
  });

  const inputBusqueda    = document.querySelector('#input-busqueda');
  const tituloResultados = document.querySelector('#titulo-resultados');
  const listaResultados  = document.querySelector('#lista-resultados');
  const pillsContainer   = document.getElementById('pills-categoria');

  // ── Cargar categorías reales desde la BD ─────────────
  try {
    const { ok, data } = await listarCategorias();
    if (ok && data.length) {
      categorias = data;
      // Reconstruir pills con categorías reales
      if (pillsContainer) {
        pillsContainer.innerHTML = `<button class="pill pill--active" data-cat="">Todas</button>` +
          data.map(c =>
            `<button class="pill" data-cat="${c.id_categoria}">${c.nombre_categoria}</button>`
          ).join('');

        pillsContainer.querySelectorAll('.pill').forEach(btn => {
          btn.addEventListener('click', () => {
            pillsContainer.querySelectorAll('.pill').forEach(b => b.classList.remove('pill--active'));
            btn.classList.add('pill--active');
            categoriaActual = btn.dataset.cat || '';
            visibles = POR_PAGINA;
            ejecutarBusqueda(inputBusqueda?.value.trim() || '');
          });
        });
      }
    }
  } catch(_) {}

  // ── Búsqueda inicial desde URL ────────────────────────
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  if (inputBusqueda) inputBusqueda.value = q;

  if (q) {
    await ejecutarBusqueda(q);
  } else {
    // Sin q → cargar todos
    await ejecutarBusqueda('');
  }

  // Nueva búsqueda al escribir (Enter)
  inputBusqueda?.addEventListener('keypress', async e => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    const url = new URL(window.location);
    url.searchParams.set('q', texto);
    window.history.pushState({}, '', url);
    visibles = POR_PAGINA;
    await ejecutarBusqueda(texto);
  });

  document.querySelector('#btn-regresar')?.addEventListener('click', () => window.history.back());

  async function ejecutarBusqueda(q) {
    if (listaResultados) listaResultados.innerHTML = '<p class="text-muted text-center">Buscando...</p>';
    document.getElementById('btn-cargar-resultados')?.remove();

    try {
      const { ok, data } = await buscarProductosFiltrado(q, {
        categoria: categoriaActual,
        orden:     ordenActual,
      });

      if (!ok || !data?.length) {
        if (tituloResultados) tituloResultados.textContent = 'Resultados (0)';
        if (listaResultados) listaResultados.innerHTML =
          `<div class="alerta alerta--warning">No encontramos resultados${q ? ` para "<strong>${q}</strong>"` : ''}.</div>`;
        return;
      }

      todosResultados = data;
      visibles = POR_PAGINA;
      if (tituloResultados) tituloResultados.textContent = `Resultados (${data.length})`;
      renderResultados(listaResultados);

    } catch (err) {
      if (listaResultados) listaResultados.innerHTML = '<div class="alerta alerta--error">Error de conexión</div>';
    }
  }
});

function renderResultados(listaResultados) {
  if (!listaResultados) return;
  const slice = todosResultados.slice(0, visibles);

  listaResultados.innerHTML = slice.map(p => {
    const color  = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
    const imgSrc = getRutaImagen(p);
    const precio = p.precio_min != null ? `$${p.precio_min} – $${p.precio_max}` : '';

    // Nombre de categoría desde el id_subcategoria
    const catNombre = '';  // opcional — se puede agregar si el serializer lo incluye

    return `
      <div class="list-item-full fade-in-up" data-id="${p.id_producto}"
           style="cursor:pointer;display:flex;align-items:center;gap:var(--space-3)">
        <img src="${imgSrc}" alt="${p.nombre_producto}"
             style="width:52px;height:52px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0"
             onerror="this.src='/assets/images/placeholder.svg'">
        <div class="semaforo-dot"
             style="width:12px;height:12px;border-radius:50%;background:var(--color-semaforo-${color});flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <p style="margin:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${p.nombre_producto}
          </p>
          ${precio ? `<p style="margin:0;color:var(--color-text-muted);font-size:0.85rem">${precio}</p>` : ''}
        </div>
        <i class="fa-solid fa-chevron-right" style="color:var(--color-text-muted);flex-shrink:0"></i>
      </div>`;
  }).join('');

  listaResultados.querySelectorAll('.list-item-full').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = `/buscador/detalle-producto/detalle-producto.html?id=${el.dataset.id}`;
    });
  });

  // Botón cargar más
  document.getElementById('btn-cargar-resultados')?.remove();
  if (todosResultados.length > visibles) {
    const btn = document.createElement('button');
    btn.id = 'btn-cargar-resultados';
    btn.className = 'btn-cargar-mas';
    btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Cargar más (${todosResultados.length - visibles} restantes)`;
    btn.addEventListener('click', () => {
      visibles += POR_PAGINA;
      renderResultados(listaResultados);
    });
    listaResultados.after(btn);
  }
}
