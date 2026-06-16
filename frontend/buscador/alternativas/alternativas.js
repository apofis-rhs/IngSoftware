import { obtenerProducto, obtenerAlternativasProducto } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // Nav
  ['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '/auth/login/login.html';
    });
  });
  const hamburger = document.getElementById('hamburger');
  const navDrawer  = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });

  const loader           = document.getElementById('loader');
  const grid             = document.getElementById('grid-alternativas');
  const acciones         = document.getElementById('acciones-comparar');
  const btnComparar      = document.getElementById('btn-ver-comparaciones');
  const productoOriginal = document.getElementById('producto-original');

  const params   = new URLSearchParams(window.location.search);
  const idOriginal = params.get('id');

  if (!idOriginal) { mostrarError('Falta el ID del producto'); return; }

  let seleccionadas = new Set();

  try {
    // Llamar con obtenerProducto (productos, no artículos)
    const [resProd, resAlts] = await Promise.all([
      obtenerProducto(idOriginal),
      obtenerAlternativasProducto(idOriginal)
    ]);

    if (!resProd.ok) { mostrarError('Producto no encontrado'); return; }
    const original = resProd.data;

    // Si ya es verde
    if (original.color_semaforo === 'verde' && original.estado_evaluacion !== 'insuficiente') {
      if (productoOriginal) productoOriginal.innerHTML = `<strong>${original.nombre_producto}</strong> ya tiene semáforo verde. ¡Es la mejor opción!`;
      loader?.classList.add('hidden');
      grid.innerHTML = '<div class="alerta alerta--info">Este producto ya es la mejor alternativa disponible.</div>';
      grid?.classList.remove('hidden');
      return;
    }

    // Sin alternativas
    if (!resAlts.ok || !resAlts.data?.length) {
      if (productoOriginal) productoOriginal.innerHTML = `No hay alternativas verdes para <strong>${original.nombre_producto}</strong> aún.`;
      loader?.classList.add('hidden');
      grid.innerHTML = '<div class="alerta alerta--warning">Sin alternativas disponibles en este momento.</div>';
      grid?.classList.remove('hidden');
      return;
    }

    // Máximo 3 (ya viene limitado del backend)
    const alts = resAlts.data.slice(0, 3);

    if (productoOriginal) {
      productoOriginal.innerHTML = `${alts.length} alternativa${alts.length > 1 ? 's' : ''} verde${alts.length > 1 ? 's' : ''} para <strong>${original.nombre_producto}</strong>`;
    }

    grid.innerHTML = alts.map(alt => {
      const imgSrc = getRutaImagen(alt);
      const precio = alt.precio_min != null ? `$${alt.precio_min} – $${alt.precio_max}` : 'Precio no disponible';
      return `
        <div class="card card-alternativa" data-id="${alt.id_producto}">
          <label style="display:flex;gap:var(--space-3);align-items:center;cursor:pointer">
            <input type="checkbox" class="checkbox-alternativa" value="${alt.id_producto}" style="width:20px;height:20px;flex-shrink:0">
            <img src="${imgSrc}" alt="${alt.nombre_producto}"
                 style="width:48px;height:48px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0"
                 onerror="this.src='/assets/images/placeholder.svg'">
            <div class="semaforo-dot" style="background:var(--color-semaforo-verde);width:14px;height:14px;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1">
              <h3 class="text-h3" style="margin-bottom:4px">${alt.nombre_producto}</h3>
              <p class="text-muted" style="font-size:0.85rem">${precio}</p>
            </div>
            <a href="/buscador/detalle-producto/detalle-producto.html?id=${alt.id_producto}"
               class="btn btn--secondary" style="flex-shrink:0" onclick="event.stopPropagation()">Ver</a>
          </label>
        </div>`;
    }).join('');

    // Checkboxes — máximo 2 para comparar (+ el original = 3)
    grid.querySelectorAll('.checkbox-alternativa').forEach(cb => {
      cb.addEventListener('change', e => {
        if (e.target.checked) seleccionadas.add(e.target.value);
        else seleccionadas.delete(e.target.value);

        if (btnComparar) {
          const hay = seleccionadas.size > 0;
          btnComparar.disabled = !hay;
          btnComparar.style.opacity = hay ? '1' : '0.5';
          btnComparar.textContent = `Comparar (${seleccionadas.size + 1} productos)`;
        }

        // Bloquear si ya seleccionó 2
        grid.querySelectorAll('.checkbox-alternativa:not(:checked)').forEach(box => {
          box.disabled = seleccionadas.size >= 2;
        });
      });
    });

    loader?.classList.add('hidden');
    grid?.classList.remove('hidden');
    acciones?.classList.remove('hidden');

  } catch (err) {
    mostrarError(`Error de conexión: ${err.message}`);
  }

  document.getElementById('btn-regresar')?.addEventListener('click', () => window.history.back());
  btnComparar?.addEventListener('click', () => {
    if (!seleccionadas.size) return;
    const ids = [idOriginal, ...Array.from(seleccionadas)];
    window.location.href = `/buscador/comparacion/comparacion.html?${ids.map(id=>`id=${id}`).join('&')}`;
  });

  function mostrarError(msg) {
    if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
  }
});
