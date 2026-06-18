import { compararProductos } from '/assets/js/api.js';
import { getRutaImagen }     from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // ── Botón Regresar Inteligente ────────────────────────
  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);

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

  const params     = new URLSearchParams(window.location.search);
  const ids        = params.getAll('id').map(Number).filter(Boolean);
  const idOriginal = ids[0];

  if (ids.length < 2) {
    mostrarError('Necesitas al menos 2 productos para comparar.');
    return;
  }

  try {
    const { ok, data } = await compararProductos(ids);
    if (!ok || !data?.length) throw new Error(data?.error || 'Sin datos');
    pintarComparacion(data, idOriginal);
  } catch (err) {
    mostrarError(`Error: ${err.message}`);
  }
});

function pintarComparacion(productos, idOriginal) {
  const original     = productos.find(p => p.id_producto === idOriginal) || productos[0];
  const alternativas = productos.filter(p => p.id_producto !== idOriginal);
  const ordenados    = [original, ...alternativas];

  const colorOrig = original.estado_evaluacion === 'insuficiente' ? 'gris' : (original.color_semaforo || 'gris');
  const subtitulo = document.getElementById('subtitulo-comparacion');
  if (subtitulo) {
    subtitulo.textContent = `Comparando ${ordenados.length} producto${ordenados.length > 1 ? 's' : ''} de la misma subcategoría`;
  }

  // Cards de productos
  const gridProductos = document.getElementById('grid-productos');
  gridProductos.style.gridTemplateColumns = `repeat(${ordenados.length}, 1fr)`;
  gridProductos.innerHTML = ordenados.map((p, i) => {
    const color    = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
    const img      = getRutaImagen(p);
    const precioMax = p.precio_max != null ? `Hasta $${p.precio_max}` : '—';
    const isOrig   = i === 0;
    return `
      <div class="cmp-card ${isOrig ? 'cmp-card--original' : 'cmp-card--alt'}">
        <span class="cmp-badge ${isOrig ? '' : 'cmp-badge--alt'}">${isOrig ? 'Tu producto' : 'Alternativa'}</span>
        <img src="${img}" alt="${p.nombre_producto}" class="cmp-card__img" onerror="this.src='/assets/images/placeholder.svg'">
        <div class="cmp-dot" style="background:var(--color-semaforo-${color})"></div>
        <h3 class="cmp-card__name">${p.nombre_producto}</h3>
        <p class="cmp-card__price">${precioMax}</p>
        <a href="/buscador/detalle-producto/detalle-producto.html?id=${p.id_producto}" class="btn btn--secondary" style="margin-top:var(--space-2);font-size:var(--text-sm)">Ver detalle</a>
      </div>`;
  }).join('');

  // Tabla comparativa
  const tabla = document.getElementById('tabla-comparacion');
  if (!tabla) {
    document.getElementById('loader')?.classList.add('hidden');
    document.getElementById('contenido-comparacion')?.classList.remove('hidden');
    return;
  }

  const cols = ordenados.length;
  tabla.style.setProperty('--cmp-cols', `160px repeat(${cols}, 1fr)`);
  const ETQ_SEM = { verde:'🟢 Verde', amarillo:'🟡 Amarillo', rojo:'🔴 Rojo', gris:'⚪ Sin datos' };

  const fila = (label, icon, celdas) => `
    <div class="cmp-row">
      <div class="cmp-label"><i class="${icon}"></i> ${label}</div>
      ${celdas}
    </div>`;

  const header = `<div class="cmp-row cmp-row--header"><div class="cmp-label">Atributo</div>${ordenados.map((p, i) => `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''}">${p.nombre_producto}</div>`).join('')}</div>`;

  const preciosMax = ordenados.map(p => p.precio_max != null ? parseFloat(p.precio_max) : null);
  const minPrecio  = Math.min(...preciosMax.filter(n => n !== null));
  const filaPrecio = fila('Precio máximo', 'fa-solid fa-tag', ordenados.map((p, i) => {
    const precio = preciosMax[i];
    const esMejor = precio !== null && precio === minPrecio;
    return `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''} ${esMejor ? 'cmp-cell--best' : ''}">${precio != null ? `$${precio}` : '—'} ${esMejor ? '<i class="fa-solid fa-circle-check" style="color:var(--color-success)"></i>' : ''}</div>`;
  }).join(''));

  const filaSem = fila('Semáforo', 'fa-solid fa-traffic-light', ordenados.map((p, i) => {
    const c = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
    return `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''} ${c === 'verde' ? 'cmp-cell--best' : ''}">${ETQ_SEM[c] || c}</div>`;
  }).join(''));

  tabla.innerHTML = header + filaPrecio + filaSem;
  document.getElementById('loader')?.classList.add('hidden');
  document.getElementById('contenido-comparacion')?.classList.remove('hidden');
}

function mostrarError(msg) {
  const loader = document.getElementById('loader');
  if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
}

// ── FUNCIÓN MAESTRA PARA REGRESAR ───────────────────────────────
function irAtras(e) {
  if (e) e.preventDefault();
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}