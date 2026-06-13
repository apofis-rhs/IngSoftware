// buscador: resultados - logica especifica
import { buscarProductos, obtenerHistorial, logout } from '../../assets/js/api.js';

const inputBusqueda = document.querySelector('#input-busqueda');
const listaResultados = document.querySelector('#lista-resultados');
const tituloResultados = document.querySelector('#titulo-resultados');

document.addEventListener('DOMContentLoaded', async () => {
  
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  inputBusqueda.value = q;

  if (q) {
    await ejecutarBusqueda(q);
  } else {
    listaResultados.innerHTML = `<p class="text-muted text-center">Escribe algo para buscar</p>`;
  }
});

async function ejecutarBusqueda(q) {
  
  listaResultados.innerHTML = `<p class="text-muted text-center">Buscando...</p>`;
  
  const { ok, data } = await buscarProductos(q);
  
  if (!ok && data.detail?.includes('Token')) {
    logout();
    return;
  }

  if (!ok) {
    listaResultados.innerHTML = `<div class="alerta alerta--error">Error al buscar productos</div>`;
    return;
  }

  if (data.length === 0) {
    listaResultados.innerHTML = `<div class="alerta alerta--warning">No encontramos resultados para "${q}"</div>`;
    tituloResultados.textContent = `Resultados (0)`;
    return;
  }
  
  tituloResultados.textContent = `Resultados (${data.length})`;
  
  listaResultados.innerHTML = data.map(p => {
    const colorFinal = p.estado_evaluacion === 'insuficiente' ? 'gris' : p.color_semaforo;
    return `
      <div class="list-item-full" data-id="${p.id_producto}" style="cursor:pointer">
        <div class="list-item-full__dot" style="background:var(--color-semaforo-${colorFinal})"></div>
        <div class="list-item-full__info">
          <p class="list-item-full__name">${p.nombre_producto}</p>
          <p class="list-item-full__sub">$${p.precio_min} - $${p.precio_max}</p>
        </div>
      </div>
    `;
  }).join('');
}