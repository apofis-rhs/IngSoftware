// recomendaciones: resultados - logica especifica
import { buscarArticulos, logout } from '../../assets/js/api.js';
import { getRutaImagen }           from '../../assets/js/imagenes.js';

// ── NAVBAR ────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navDrawer  = document.getElementById('nav-drawer');
if (hamburger && navDrawer) {
  hamburger.addEventListener('click', () => navDrawer.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navDrawer.contains(e.target)) navDrawer.classList.remove('open');
  });
  window.addEventListener('resize', () => { if (window.innerWidth >= 769) navDrawer.classList.remove('open'); });
}
['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token'); localStorage.removeItem('usuario');
    window.location.href = '../../auth/login/login.html';
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '../../auth/login/login.html';
    return;
  }

  const inputRecomendacion = document.getElementById('input-recomendacion');
  const listaResultados    = document.getElementById('lista-resultados');
  const contadorResultados = document.getElementById('resultado-count');

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  if (inputRecomendacion) inputRecomendacion.value = q;

  if (q) {
    await ejecutarBusqueda(q, listaResultados, contadorResultados);
  } else {
    if (listaResultados) listaResultados.innerHTML = '<p class="text-muted">Escribe algo para buscar.</p>';
  }

  if (inputRecomendacion) {
    inputRecomendacion.addEventListener('keypress', async (e) => {
      if (e.key !== 'Enter') return;
      const texto = inputRecomendacion.value.trim();
      if (!texto) return;
      const url = new URL(window.location);
      url.searchParams.set('q', texto);
      window.history.pushState({}, '', url);
      await ejecutarBusqueda(texto, listaResultados, contadorResultados);
    });
  }
});

async function ejecutarBusqueda(q, listaResultados, contadorResultados) {
  if (!listaResultados) return;
  listaResultados.innerHTML = '<p class="text-muted">Buscando...</p>';

  try {
    const { ok, data } = await buscarArticulos(q);

    if (!ok) {
      if (data?.detail?.toLowerCase().includes('token')) { logout(); return; }
      listaResultados.innerHTML = `<div class="alerta alerta--error">Error al buscar artículos</div>`;
      return;
    }

    if (!data || data.length === 0) {
      if (contadorResultados) contadorResultados.textContent = '0';
      listaResultados.innerHTML = `<div class="alerta alerta--warning">No encontramos resultados para "<strong>${q}</strong>"</div>`;
      return;
    }

    if (contadorResultados) contadorResultados.textContent = data.length;

    listaResultados.innerHTML = data.map(a => {
      const color  = a.color_semaforo || 'gris';
      const imgSrc = getRutaImagen(a, '../../');
      const precio = a.precio_min != null ? `$${a.precio_min} - $${a.precio_max}` : 'Precio no disponible';
      return `
        <article class="resultado-card" data-id="${a.id_articulo}"
                 style="cursor:pointer; display:flex; align-items:center; gap:var(--space-3)">
          <img src="${imgSrc}"
               alt="${a.nombre_articulo}"
               style="width:52px; height:52px; object-fit:cover; border-radius:var(--radius-sm); flex-shrink:0;"
               onerror="this.src='../../assets/images/placeholder.svg'">
          <div class="resultado-card__dot semaforo-${color}" style="flex-shrink:0"></div>
          <div class="resultado-card__content" style="flex:1">
            <h3 class="resultado-card__title">${a.nombre_articulo}</h3>
            <p class="resultado-card__price">${precio}</p>
          </div>
        </article>
      `;
    }).join('');

    listaResultados.querySelectorAll('.resultado-card').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `../detalle-articulo/detalle-articulo.html?id=${el.dataset.id}`;
      });
    });

  } catch (err) {
    console.error('Error en búsqueda:', err);
    listaResultados.innerHTML = `<div class="alerta alerta--error">Error de conexión al servidor</div>`;
  }
}
