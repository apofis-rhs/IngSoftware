import { obtenerRecomendaciones, obtenerFavoritosArticulo, agregarFavoritoArticulo, eliminarFavoritoArticulo } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html?sesion=expirada'; return;
  }

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

  // Cargar IDs de artículos ya favoritos
  let favIds = new Set();
  try {
    const { ok, data } = await obtenerFavoritosArticulo();
    if (ok && Array.isArray(data)) data.forEach(f => favIds.add(String(f.id_articulo_id)));
  } catch(_) {}

  const COLORES = { verde:'var(--color-semaforo-verde)', amarillo:'var(--color-semaforo-amarillo)', rojo:'var(--color-semaforo-rojo)' };

  function pintarCard(articulo, contenedor) {
    const color    = articulo.estado_evaluacion === 'insuficiente' ? 'gris' : (articulo.color_semaforo || 'gris');
    const dotColor = COLORES[color] || '#ccc';
    const precio   = articulo.precio_estimado ? `$${parseFloat(articulo.precio_estimado).toFixed(2)}` : '';
    const esFav    = favIds.has(String(articulo.id_articulo));

    const card = document.createElement('article');
    card.className = 'product-card-grid recomendacion-card fade-in-up';
    card.style.cssText = 'cursor:pointer;position:relative';
    card.innerHTML = `
      <button class="btn-fav-card" data-id="${articulo.id_articulo}"
              style="position:absolute;top:8px;right:8px;z-index:2;
                     background:rgba(255,255,255,0.9);border:none;border-radius:50%;
                     width:32px;height:32px;cursor:pointer;display:flex;align-items:center;
                     justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.15)">
        <i class="${esFav ? 'fa-solid' : 'fa-regular'} fa-star"
           style="color:${esFav ? 'var(--color-primary-dark)' : 'var(--color-text-muted)'}"></i>
      </button>
      <div class="product-card-grid__img"
           style="background:var(--color-bg-page);display:flex;align-items:center;
                  justify-content:center;border-radius:var(--radius-md)">
        <div style="width:56px;height:56px;border-radius:50%;background:${dotColor};
                    box-shadow:0 0 0 8px ${dotColor}25"></div>
      </div>
      <div class="product-card-grid__info">
        <h3 class="product-card-grid__name">${articulo.nombre_articulo}</h3>
        ${precio ? `<p class="product-card-grid__price" style="font-size:0.8rem">${precio}</p>` : ''}
      </div>`;

    card.addEventListener('click', e => {
      if (e.target.closest('.btn-fav-card')) return;
      window.location.href = `/recomendaciones/detalle-articulo/detalle-articulo.html?id=${articulo.id_articulo}`;
    });

    card.querySelector('.btn-fav-card').addEventListener('click', async e => {
      e.stopPropagation();
      const btn  = e.currentTarget;
      const icon = btn.querySelector('i');
      const id   = String(articulo.id_articulo);

      try {
        if (favIds.has(id)) {
          await eliminarFavoritoArticulo(id);
          favIds.delete(id);
          icon.className = 'fa-regular fa-star';
          icon.style.color = 'var(--color-text-muted)';
          toast('Eliminado de favoritos');
        } else {
          await agregarFavoritoArticulo(id);
          favIds.add(id);
          icon.className = 'fa-solid fa-star';
          icon.style.color = 'var(--color-primary-dark)';
          toast('⭐ Agregado a favoritos');
        }
      } catch(err) { console.error('Error favorito:', err); }
    });

    contenedor.appendChild(card);
  }

  if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Cargando...</p>';
  if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Cargando...</p>';

  try {
    const { ok, data } = await obtenerRecomendaciones();
    if (!ok) throw new Error('Error del servidor');

    if (seccionRecomendados) {
      seccionRecomendados.innerHTML = '';
      data.recomendados?.length
        ? data.recomendados.forEach(a => pintarCard(a, seccionRecomendados))
        : (seccionRecomendados.innerHTML = '<p class="text-muted">Explora artículos para recibir recomendaciones.</p>');
    }
    if (seccionPopulares) {
      seccionPopulares.innerHTML = '';
      data.populares?.length
        ? data.populares.forEach(a => pintarCard(a, seccionPopulares))
        : (seccionPopulares.innerHTML = '<p class="text-muted">Sin datos de popularidad aún.</p>');
    }
  } catch (err) {
    console.error(err);
    if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Error de conexión.</p>';
  }

  inputRecomendacion?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    const texto = inputRecomendacion.value.trim();
    if (texto.length < 3) return;
    window.location.href = `/recomendaciones/resultados/resultados.html?q=${encodeURIComponent(texto)}`;
  });
});

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'lumika-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
