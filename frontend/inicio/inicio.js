import { buscarArticulos } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // Nav hamburguesa
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

  const inputRecomendacion  = document.getElementById('input-recomendacion');
  const seccionRecomendados = document.getElementById('grid-recomendados');
  const seccionPopulares    = document.getElementById('grid-populares');

  // Los artículos NO tienen precio ni color_semaforo — solo nombre e impacto_ambiental
  function pintarCard(articulo, contenedor) {
    const card = document.createElement('article');
    card.className = 'product-card-grid recomendacion-card fade-in-up';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-grid__img" style="background:var(--color-bg-page);display:flex;align-items:center;justify-content:center;border-radius:var(--radius-md)">
        <i class="fa-solid fa-leaf" style="font-size:2rem;color:var(--color-success)"></i>
      </div>
      <div class="product-card-grid__info">
        <h3 class="product-card-grid__name">${articulo.nombre_articulo}</h3>
        <p class="product-card-grid__price" style="font-size:0.8rem;color:var(--color-text-muted)">
          ${articulo.impacto_ambiental
            ? articulo.impacto_ambiental.substring(0, 60) + (articulo.impacto_ambiental.length > 60 ? '…' : '')
            : 'Alternativa sostenible'}
        </p>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.href = `/recomendaciones/detalle-articulo/detalle-articulo.html?id=${articulo.id_articulo}`;
    });
    contenedor.appendChild(card);
  }

  if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Cargando...</p>';
  if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Cargando...</p>';

  // Términos variados para traer artículos distintos
  const TERMINOS = ['cepillo', 'bolsa', 'botella', 'esponja', 'toalla', 'vaso', 'jabón'];
  let todos = [];

  try {
    for (const termino of TERMINOS) {
      const { ok, data } = await buscarArticulos(termino);
      if (ok && Array.isArray(data)) {
        data.forEach(a => {
          if (!todos.find(x => x.id_articulo === a.id_articulo)) todos.push(a);
        });
        if (todos.length >= 12) break;
      }
    }

    if (seccionRecomendados) {
      seccionRecomendados.innerHTML = '';
      const mitad = Math.ceil(todos.length / 2);
      const recomendados = todos.slice(0, mitad > 6 ? 6 : mitad);
      if (recomendados.length > 0) {
        recomendados.forEach(a => pintarCard(a, seccionRecomendados));
      } else {
        seccionRecomendados.innerHTML = '<p class="text-muted">Sin artículos disponibles.</p>';
      }
    }

    if (seccionPopulares) {
      seccionPopulares.innerHTML = '';
      const mitad = Math.ceil(todos.length / 2);
      const populares = todos.slice(mitad > 6 ? 6 : mitad);
      if (populares.length > 0) {
        populares.forEach(a => pintarCard(a, seccionPopulares));
      } else if (todos.length > 0) {
        // Si no hay suficientes para dos secciones, reusar los primeros
        todos.slice(0, 6).forEach(a => pintarCard(a, seccionPopulares));
      } else {
        seccionPopulares.innerHTML = '<p class="text-muted">Sin artículos disponibles.</p>';
      }
    }

  } catch (err) {
    console.error('Error cargando artículos:', err);
    if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Error de conexión.</p>';
  }

  // Búsqueda → Enter
  inputRecomendacion?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    const texto = inputRecomendacion.value.trim();
    if (!texto) return;
    window.location.href = `/recomendaciones/resultados/resultados.html?q=${encodeURIComponent(texto)}`;
  });
});
