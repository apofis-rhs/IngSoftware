// recomendaciones/alternativas.js
import { obtenerArticulo, obtenerAlternativasArticulo } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

// Nav
const hamburger = document.getElementById('hamburger');
const navDrawer  = document.getElementById('nav-drawer');
if (hamburger && navDrawer) {
  hamburger.addEventListener('click', () => navDrawer.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !navDrawer.contains(e.target))
      navDrawer.classList.remove('open');
  });
  window.addEventListener('resize', () => { if (window.innerWidth >= 769) navDrawer.classList.remove('open'); });
}
['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('token'); localStorage.removeItem('usuario');
    window.location.href = '/auth/login/login.html';
  });
});

let idOriginal = null;
let seleccionadas = new Set();

document.addEventListener('DOMContentLoaded', async () => {

  if (!localStorage.getItem('token')) { window.location.href = '/auth/login/login.html'; return; }

  const params = new URLSearchParams(window.location.search);
  idOriginal   = params.get('id');
  if (!idOriginal) { mostrarError('Falta el ID del artículo en la URL (?id=X)'); return; }

  await cargarAlternativas(idOriginal);

  document.getElementById('btn-regresar')?.addEventListener('click', () => window.history.back());
  document.getElementById('btn-ver-comparaciones')?.addEventListener('click', irAComparacion);
});

async function cargarAlternativas(id) {
  const loader      = document.getElementById('loader');
  const grid        = document.getElementById('grid-alternativas');
  const acciones    = document.getElementById('acciones-comparar');
  const elDescripcion = document.getElementById('producto-original');

  try {
    const [resArticulo, resAlts] = await Promise.all([
      obtenerArticulo(id),
      obtenerAlternativasArticulo(id)
    ]);

    if (!resArticulo.ok) { mostrarError('Artículo no encontrado'); return; }

    const original = resArticulo.data;

    // Si ya es verde, no necesita alternativas
    if (original.color_semaforo === 'verde' && original.estado_evaluacion !== 'insuficiente') {
      if (elDescripcion) elDescripcion.innerHTML =
        `<strong>${original.nombre_articulo}</strong> ya tiene semáforo verde. ¡Es una de las mejores opciones!`;
      loader?.classList.add('hidden');
      if (grid) grid.innerHTML = `<div class="alerta alerta--info">Este artículo ya es la mejor opción disponible.</div>`;
      grid?.classList.remove('hidden');
      return;
    }

    if (!resAlts.ok || !Array.isArray(resAlts.data) || resAlts.data.length === 0) {
      if (elDescripcion) elDescripcion.innerHTML =
        `No encontramos alternativas para <strong>${original.nombre_articulo}</strong> por ahora.`;
      loader?.classList.add('hidden');
      if (grid) grid.innerHTML = `<div class="alerta alerta--warning">No hay alternativas disponibles.</div>`;
      grid?.classList.remove('hidden');
      return;
    }

    const ordenadas = [...resAlts.data].sort((a, b) => (a.precio_min || 0) - (b.precio_min || 0));

    if (elDescripcion) elDescripcion.innerHTML =
      `${ordenadas.length} alternativas para <strong>${original.nombre_articulo}</strong>, ordenadas por precio.`;

    if (grid) {
      grid.innerHTML = ordenadas.map(alt => {
        const color  = alt.color_semaforo || 'gris';
        const imgSrc = getRutaImagen(alt);
        const precio = alt.precio_min != null ? `$${alt.precio_min}` : 'Precio no disponible';
        return `
          <div class="card card-alternativa" data-id="${alt.id_articulo}">
            <label style="display:flex;gap:var(--space-3);align-items:center;cursor:pointer">
              <input type="checkbox" class="checkbox-alternativa" value="${alt.id_articulo}" style="width:20px;height:20px;flex-shrink:0">
              <img src="${imgSrc}" alt="${alt.nombre_articulo}"
                   style="width:48px;height:48px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0"
                   onerror="this.src='/assets/images/placeholder.svg'">
              <div class="semaforo-dot"
                   style="background:var(--color-semaforo-${color});width:14px;height:14px;border-radius:50%;flex-shrink:0"></div>
              <div style="flex:1">
                <h3 class="text-h3" style="margin-bottom:var(--space-1)">${alt.nombre_articulo}</h3>
                <p class="text-muted">${precio}</p>
              </div>
              <a href="/recomendaciones/detalle-articulo/detalle-articulo.html?id=${alt.id_articulo}"
                 class="btn btn--secondary" onclick="event.stopPropagation()">Ver</a>
            </label>
          </div>`;
      }).join('');

      // Checkboxes — máximo 2 alternativas
      const btnComparar = document.getElementById('btn-ver-comparaciones');
      grid.querySelectorAll('.checkbox-alternativa').forEach(cb => {
        cb.addEventListener('change', e => {
          if (e.target.checked) seleccionadas.add(e.target.value);
          else seleccionadas.delete(e.target.value);

          if (btnComparar) {
            btnComparar.disabled = seleccionadas.size === 0;
            btnComparar.textContent = `Ver Comparaciones (${seleccionadas.size + 1})`;
          }

          // Máx 2 alternativas + 1 original = 3
          grid.querySelectorAll('.checkbox-alternativa:not(:checked)').forEach(box => {
            box.disabled = seleccionadas.size >= 2;
          });
        });
      });
    }

    loader?.classList.add('hidden');
    grid?.classList.remove('hidden');
    acciones?.classList.remove('hidden');

  } catch (err) { mostrarError(`Error de conexión: ${err.message}`); }
}

function irAComparacion() {
  if (seleccionadas.size === 0) return;
  const ids = [idOriginal, ...Array.from(seleccionadas)];
  window.location.href = `/recomendaciones/comparacion/comparacion.html?${ids.map(id => `id=${id}`).join('&')}`;
}

function mostrarError(msg) {
  const loader = document.getElementById('loader');
  if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
}
