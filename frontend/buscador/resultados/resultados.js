// buscador: resultados - logica especifica
import { buscarProductos, logout } from '../../assets/js/api.js';
import { getRutaImagen }           from '../../assets/js/imagenes.js';

const inputBusqueda   = document.querySelector('#input-busqueda');
const listaResultados = document.querySelector('#lista-resultados');
const tituloResultados = document.querySelector('#titulo-resultados');
const btnRegresar     = document.querySelector('#btn-regresar');

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '../../auth/login/login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  inputBusqueda.value = q;

  if (q) {
    await ejecutarBusqueda(q);
  } else {
    listaResultados.innerHTML = `<p class="text-muted text-center">Escribe algo para buscar</p>`;
  }

  inputBusqueda.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    if (!texto) return;
    const url = new URL(window.location);
    url.searchParams.set('q', texto);
    window.history.pushState({}, '', url);
    await ejecutarBusqueda(texto);
  });

  if (btnRegresar) btnRegresar.addEventListener('click', () => window.history.back());
});

async function ejecutarBusqueda(q) {
  listaResultados.innerHTML = `<p class="text-muted text-center">Buscando...</p>`;

  try {
    const { ok, data } = await buscarProductos(q);

    if (!ok) {
      if (data?.detail?.toLowerCase().includes('token')) { logout(); return; }
      listaResultados.innerHTML = `<div class="alerta alerta--error">Error al buscar productos</div>`;
      return;
    }

    if (!data || data.length === 0) {
      tituloResultados.textContent = `Resultados (0)`;
      listaResultados.innerHTML = `<div class="alerta alerta--warning">No encontramos resultados para "<strong>${q}</strong>"</div>`;
      return;
    }

    tituloResultados.textContent = `Resultados (${data.length})`;

    listaResultados.innerHTML = data.map(p => {
      const colorFinal = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
      const imgSrc     = getRutaImagen(p, '../../');
      const precio     = p.precio_min != null ? `$${p.precio_min} - $${p.precio_max}` : 'Precio no disponible';
      return `
        <div class="list-item-full" data-id="${p.id_producto}" style="cursor:pointer; display:flex; align-items:center; gap:var(--space-3)">
          <img src="${imgSrc}"
               alt="${p.nombre_producto}"
               style="width:52px; height:52px; object-fit:cover; border-radius:var(--radius-sm); flex-shrink:0;"
               onerror="this.src='../../assets/images/placeholder.svg'">
          <div class="list-item-full__dot" style="background:var(--color-semaforo-${colorFinal}); flex-shrink:0"></div>
          <div class="list-item-full__info" style="flex:1">
            <p class="list-item-full__name">${p.nombre_producto}</p>
            <p class="list-item-full__sub">${precio}</p>
          </div>
          <i class="fa-solid fa-chevron-right" style="color:var(--color-text-muted); flex-shrink:0"></i>
        </div>
      `;
    }).join('');

    listaResultados.querySelectorAll('.list-item-full').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `../detalle-producto/detalle-producto.html?id=${el.dataset.id}`;
      });
    });

  } catch (err) {
    console.error('Error en búsqueda:', err);
    listaResultados.innerHTML = `<div class="alerta alerta--error">Error de conexión al servidor</div>`;
  }
}
