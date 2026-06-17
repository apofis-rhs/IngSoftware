import { obtenerArticulo, obtenerAlternativasArticulo } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
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

  const loader          = document.getElementById('loader');
  const grid            = document.getElementById('grid-alternativas');
  const acciones        = document.getElementById('acciones-comparar');
  const btnComparar     = document.getElementById('btn-ver-comparaciones');
  const articuloOriginal = document.getElementById('articulo-original');

  const params     = new URLSearchParams(window.location.search);
  const idOriginal = params.get('id');

  if (!idOriginal) { mostrarError('Falta el ID del artículo'); return; }

  try {
    const [resArt, resAlts] = await Promise.all([
      obtenerArticulo(idOriginal),
      obtenerAlternativasArticulo(idOriginal),
    ]);

    if (!resArt.ok) { mostrarError('Artículo no encontrado'); return; }
    const original = resArt.data;
    const alts     = (resAlts.ok && Array.isArray(resAlts.data)) ? resAlts.data : [];

    const colorOrig = original.estado_evaluacion === 'insuficiente' ? 'gris' : (original.color_semaforo || 'gris');
    const esVerde   = colorOrig === 'verde';

    if (articuloOriginal) {
      articuloOriginal.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <span style="width:14px;height:14px;border-radius:50%;background:var(--color-semaforo-${colorOrig});display:inline-block;flex-shrink:0"></span>
            <strong>${original.nombre_articulo}</strong>
          </div>
          ${esVerde ? `
            <span style="background:var(--color-success-bg);color:var(--color-success);border:1px solid var(--color-success);
                         border-radius:var(--radius-full);padding:2px 12px;font-size:var(--text-sm);font-weight:600">
              ✓ Ya es verde — comparamos precio
            </span>` : ''}
        </div>
        <p class="text-muted" style="margin-top:var(--space-2);font-size:var(--text-sm)">
          ${alts.length
            ? `${alts.length} alternativa${alts.length > 1 ? 's' : ''} verde${alts.length > 1 ? 's' : ''} de la misma subcategoría`
            : 'Sin alternativas verdes disponibles en esta subcategoría'}
        </p>`;
    }

    loader?.classList.add('hidden');

    if (!alts.length) {
      grid.innerHTML = `<div class="alerta alerta--warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        No encontramos alternativas verdes en esta subcategoría por el momento.
      </div>`;
      grid?.classList.remove('hidden');
      if (btnComparar) btnComparar.style.display = 'none';
      acciones?.classList.remove('hidden');
      return;
    }

    grid.innerHTML = alts.map(alt => {
      const precio = alt.precio_estimado != null
        ? `$${alt.precio_estimado}`
        : 'Precio no disponible';
      return `
        <div class="card alt-card" style="display:flex;align-items:center;gap:var(--space-4);padding:var(--space-4)">
          <span style="width:12px;height:12px;border-radius:50%;background:var(--color-semaforo-verde);flex-shrink:0"></span>
          <div style="flex:1;min-width:0">
            <p style="margin:0 0 2px;font-weight:600;font-size:var(--text-base);
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${alt.nombre_articulo}</p>
            <p style="margin:0;color:var(--color-text-muted);font-size:var(--text-sm)">${precio}</p>
          </div>
          <a href="/recomendaciones/detalle-articulo/detalle-articulo.html?id=${alt.id_articulo}"
             class="btn btn--secondary" style="flex-shrink:0;white-space:nowrap"
             onclick="event.stopPropagation()">Ver detalle</a>
        </div>`;
    }).join('');

    grid?.classList.remove('hidden');
    acciones?.classList.remove('hidden');

    if (btnComparar) {
      btnComparar.innerHTML = `<i class="fa-solid fa-scale-balanced"></i> Comparar (${alts.length + 1} artículos)`;
      btnComparar.addEventListener('click', () => {
        const ids = [idOriginal, ...alts.map(a => a.id_articulo)];
        window.location.href = `/recomendaciones/comparacion/comparacion.html?${ids.map(id => `id=${id}`).join('&')}`;
      });
    }

  } catch (err) {
    mostrarError(`Error de conexión: ${err.message}`);
  }

  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);

  function mostrarError(msg) {
    if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
  }
});

function irAtras() {
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}
