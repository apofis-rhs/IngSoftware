import { buscarProductos } from '/assets/js/api.js';
import { getRutaImagen }   from '/assets/js/imagenes.js';

const POR_PAGINA = 10;
let todosResultados = [];
let visibles = POR_PAGINA;

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
  const btnRegresar      = document.querySelector('#btn-regresar');

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  if (inputBusqueda) inputBusqueda.value = q;
  if (q) await ejecutarBusqueda(q, listaResultados, tituloResultados);
  else if (listaResultados) listaResultados.innerHTML = '<p class="text-muted text-center">Escribe algo para buscar</p>';

  inputBusqueda?.addEventListener('keypress', async e => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    if (!texto) return;
    const url = new URL(window.location);
    url.searchParams.set('q', texto);
    window.history.pushState({}, '', url);
    visibles = POR_PAGINA;
    await ejecutarBusqueda(texto, listaResultados, tituloResultados);
  });

  btnRegresar?.addEventListener('click', () => window.history.back());
});

async function ejecutarBusqueda(q, listaResultados, tituloResultados) {
  listaResultados.innerHTML = '<p class="text-muted text-center">Buscando...</p>';
  document.getElementById('btn-cargar-resultados')?.remove();

  try {
    const { ok, data } = await buscarProductos(q);

    if (!ok || !data?.length) {
      if (tituloResultados) tituloResultados.textContent = 'Resultados (0)';
      listaResultados.innerHTML = `<div class="alerta alerta--warning">No encontramos resultados para "<strong>${q}</strong>"</div>`;
      return;
    }

    todosResultados = data;
    visibles = POR_PAGINA;
    if (tituloResultados) tituloResultados.textContent = `Resultados (${data.length})`;
    renderResultados(listaResultados);

  } catch (err) {
    listaResultados.innerHTML = '<div class="alerta alerta--error">Error de conexión al servidor</div>';
  }
}

function renderResultados(listaResultados) {
  const slice = todosResultados.slice(0, visibles);

  listaResultados.innerHTML = slice.map(p => {
    const color  = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
    const imgSrc = getRutaImagen(p);
    const precio = p.precio_min != null ? `$${p.precio_min} – $${p.precio_max}` : 'Precio no disponible';
    return `
      <div class="list-item-full fade-in-up" data-id="${p.id_producto}" style="cursor:pointer;display:flex;align-items:center;gap:var(--space-3)">
        <img src="${imgSrc}" alt="${p.nombre_producto}"
             style="width:52px;height:52px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0"
             onerror="this.src='/assets/images/placeholder.svg'">
        <div class="semaforo-dot" style="width:12px;height:12px;border-radius:50%;background:var(--color-semaforo-${color});flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <p class="list-item-full__name" style="margin:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.nombre_producto}</p>
          <p class="list-item-full__sub" style="margin:0;color:var(--color-text-muted);font-size:0.85rem">${precio}</p>
        </div>
        <i class="fa-solid fa-chevron-right" style="color:var(--color-text-muted);flex-shrink:0"></i>
      </div>`;
  }).join('');

  // Click en cada item
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
