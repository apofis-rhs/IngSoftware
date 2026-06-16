import { obtenerRecomendaciones } from '/assets/js/api.js';
import { getRutaImagen }          from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html?sesion=expirada'; return;
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

  const inputRecomendacion  = document.getElementById('input-recomendacion');
  const seccionRecomendados = document.getElementById('grid-recomendados');
  const seccionPopulares    = document.getElementById('grid-populares');

  function pintarCard(articulo, contenedor) {
    const tieneImagen = !!articulo.id_subcategoria;
    const card = document.createElement('article');
    card.className = 'product-card-grid recomendacion-card fade-in-up';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-grid__img"
           style="background:var(--color-bg-page);display:flex;align-items:center;
                  justify-content:center;border-radius:var(--radius-md);overflow:hidden">
        ${tieneImagen
          ? `<img src="${getRutaImagen(articulo)}" alt="${articulo.nombre_articulo}"
                  style="width:100%;height:100%;object-fit:cover"
                  onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-leaf\\' style=\\'font-size:2rem;color:var(--color-success)\\'></i>'">`
          : `<i class="fa-solid fa-leaf" style="font-size:2rem;color:var(--color-success)"></i>`}
      </div>
      <div class="product-card-grid__info">
        <h3 class="product-card-grid__name">${articulo.nombre_articulo}</h3>
        <p class="product-card-grid__price" style="font-size:0.8rem;color:var(--color-text-muted)">
          ${articulo.impacto_ambiental
            ? articulo.impacto_ambiental.substring(0, 70) + (articulo.impacto_ambiental.length > 70 ? '…' : '')
            : 'Alternativa sostenible'}
        </p>
      </div>`;
    card.addEventListener('click', () => {
      window.location.href = `/recomendaciones/detalle-articulo/detalle-articulo.html?id=${articulo.id_articulo}`;
    });
    contenedor.appendChild(card);
  }

  if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Cargando...</p>';
  if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Cargando...</p>';

  try {
    // Endpoint con algoritmo basado en historial
    const { ok, data } = await obtenerRecomendaciones();

    if (!ok) throw new Error('Error del servidor');

    // ── Recomendados (basados en historial del usuario) ──────────
    if (seccionRecomendados) {
      seccionRecomendados.innerHTML = '';
      if (data.recomendados?.length) {
        data.recomendados.forEach(a => pintarCard(a, seccionRecomendados));
      } else {
        seccionRecomendados.innerHTML = '<p class="text-muted">Explora artículos para recibir recomendaciones personalizadas.</p>';
      }
    }

    // ── Más populares (más consultados globalmente) ──────────────
    if (seccionPopulares) {
      seccionPopulares.innerHTML = '';
      if (data.populares?.length) {
        data.populares.forEach(a => pintarCard(a, seccionPopulares));
      } else {
        seccionPopulares.innerHTML = '<p class="text-muted">Sin datos de popularidad aún.</p>';
      }
    }

  } catch (err) {
    console.error('Error cargando recomendaciones:', err);
    if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Error de conexión.</p>';
  }

  // Búsqueda → Enter (mínimo 3 chars)
  inputRecomendacion?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    const texto = inputRecomendacion.value.trim();
    if (texto.length < 3) return;
    window.location.href = `/recomendaciones/resultados/resultados.html?q=${encodeURIComponent(texto)}`;
  });
});
