// filtrar-resultados.js — conectado a la BD
import { buscarProductos, agregarFavorito, estaLogueado } from '../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) {
    window.location.href = '../auth/login/login.html'; return;
  }

  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '../auth/login/login.html';
    });
  });

  const lista       = document.getElementById('lista-resultados');
  const loader      = document.getElementById('loader');
  const sinResults  = document.getElementById('sin-resultados');
  const chips       = document.querySelectorAll('[data-filtro]');
  const tituloTexto = document.getElementById('texto-busqueda');

  const q = new URLSearchParams(window.location.search).get('q')
         || localStorage.getItem('textoBuscado') || '';

  if (tituloTexto) tituloTexto.textContent = q ? `"${q}"` : '';

  let todos        = JSON.parse(localStorage.getItem('resultadosBusqueda') || 'null');
  let filtroActivo = 'todos';

  // Si no hay cache, buscar en la BD
  if (!todos && q) {
    const { ok, data } = await buscarProductos(q);
    todos = ok ? data : [];
    localStorage.setItem('resultadosBusqueda', JSON.stringify(todos));
  }
  todos = todos || [];

  loader?.classList.add('hidden');
  pintarLista(todos);

  // Chips de filtro
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      filtroActivo = chip.dataset.filtro;
      chips.forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');

      const filtrado = filtroActivo === 'todos'
        ? todos
        : todos.filter(p => {
            if (filtroActivo === 'sin-info') return p.estado_evaluacion === 'insuficiente' || !p.color_semaforo;
            return p.color_semaforo === filtroActivo;
          });
      pintarLista(filtrado);
    });
  });

  // Favorito desde la lista de filtros
  lista?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-fav');
    if (!btn) return;
    e.stopPropagation();
    const id = btn.dataset.id;
    const { ok } = await agregarFavorito(id);
    if (ok) {
      btn.classList.add('btn-fav--active');
      btn.innerHTML = '<i class="fa-solid fa-star"></i>';
      btn.title = 'En favoritos';
    }
  });

  function pintarLista(data) {
    if (!lista) return;

    if (!data.length) {
      lista.innerHTML = '';
      sinResults?.classList.remove('hidden');
      return;
    }
    sinResults?.classList.add('hidden');

    lista.innerHTML = data.map((p, i) => {
      const sinInfo = p.estado_evaluacion === 'insuficiente' || !p.color_semaforo;
      const color   = sinInfo ? 'gris' : p.color_semaforo;
      const dotColor = { verde:'#BAC423', amarillo:'#FFAC00', rojo:'#FF4A58', gris:'#9E9E9E' }[color];
      const badge    = sinInfo
        ? '<span class="badge badge--gris">Sin información</span>'
        : `<span class="badge badge--${color}">${capitalizar(color)}</span>`;
      const precio = p.precio_min ? `$${p.precio_min} – $${p.precio_max}` : '';

      return `
        <div class="resultado-card" style="animation-delay:${i*0.07}s">
          <a href="../buscador/detalle-producto/detalle-producto.html?id=${p.id_producto}" class="resultado-card__link">
            <div class="resultado-card__dot" style="background:${dotColor}"></div>
            <div class="resultado-card__info">
              <div class="resultado-card__nombre">${p.nombre_producto}</div>
              <div class="resultado-card__precio">${precio}</div>
              ${badge}
            </div>
          </a>
          <button class="btn-fav" data-id="${p.id_producto}" title="Guardar en favoritos">
            <i class="fa-regular fa-star"></i>
          </button>
        </div>`;
    }).join('');
  }

  function capitalizar(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }
});