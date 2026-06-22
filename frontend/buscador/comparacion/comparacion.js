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

  // ── CIERRE AUTOMÁTICO DEL MENÚ MÓVIL ────────────────────────
  
  // 1. Cierra el menú inmediatamente al hacer clic en cualquier enlace dentro de él
  const enlacesMenu = navDrawer?.querySelectorAll('a');
  enlacesMenu?.forEach(enlace => {
    enlace.addEventListener('click', () => {
      navDrawer?.classList.remove('open');
    });
  });

  // 2. Failsafe: Si el navegador restaura la página desde el caché (bfcache), fuerza el cierre
  window.addEventListener('pageshow', () => {
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

  const subtitulo = document.getElementById('subtitulo-comparacion');
  if (subtitulo) subtitulo.textContent = `Comparando ${ordenados.length} producto${ordenados.length > 1 ? 's' : ''}`;

  // Cards superiores
  const gridProductos = document.getElementById('grid-productos');
  gridProductos.style.gridTemplateColumns = `repeat(${ordenados.length}, 1fr)`;
  gridProductos.innerHTML = ordenados.map((p, i) => {
    const color = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
    const isOrig = i === 0;
    return `
      <div class="cmp-card ${isOrig ? 'cmp-card--original' : 'cmp-card--alt'}">
        <span class="cmp-badge ${isOrig ? '' : 'cmp-badge--alt'}">${isOrig ? 'Tu producto' : 'Alternativa'}</span>
        <img src="${getRutaImagen(p)}" alt="${p.nombre_producto}" class="cmp-card__img" onerror="this.src='/assets/images/placeholder.svg'">
        <div class="cmp-dot" style="background:var(--color-semaforo-${color})"></div>
        <h3 class="cmp-card__name">${p.nombre_producto}</h3>
        <p class="cmp-card__price">${p.precio_max != null ? `Hasta $${p.precio_max}` : '—'}</p>
        <a href="/buscador/detalle-producto/detalle-producto.html?id=${p.id_producto}" class="btn btn--secondary" style="margin-top:var(--space-2);font-size:var(--text-sm)">Ver detalle</a>
      </div>`;
  }).join('');

  // Tabla
  const tabla = document.getElementById('tabla-comparacion');
  const cols = ordenados.length;
  tabla.style.setProperty('--cmp-cols', `160px repeat(${cols}, 1fr)`);

  const fila = (label, icon, celdas) => `<div class="cmp-row"><div class="cmp-label"><i class="${icon}"></i> ${label}</div>${celdas}</div>`;

  // Filas
  const header = `<div class="cmp-row cmp-row--header"><div class="cmp-label">Nombre</div>${ordenados.map((p, i) => `<div class="cmp-cell ${i===0?'cmp-cell--original':''}">${p.nombre_producto}</div>`).join('')}</div>`;
  
  const filaPrecio = fila('Precio', 'fa-solid fa-tag', ordenados.map((p, i) => `<div class="cmp-cell ${i===0?'cmp-cell--original':''}">${p.precio_max ? '$'+p.precio_max : '—'}</div>`).join(''));
  
  const filaCaract = fila('Características', 'fa-solid fa-list-check', ordenados.map((p, i) => {
    const list = (p.caracteristicas || []).map(c => `<li>${c.descripcion}</li>`).join('');
    return `<div class="cmp-cell ${i===0?'cmp-cell--original':''}"><ul class="cmp-vent-list">${list || '—'}</ul></div>`;
  }).join(''));

  const filaVent = fila('Ventajas ecológicas', 'fa-solid fa-leaf', ordenados.map((p, i) => {
    const list = (p.ventajas || []).map(v => `<li>${v.descripcion}</li>`).join('');
    return `<div class="cmp-cell ${i===0?'cmp-cell--original':''}"><ul class="cmp-vent-list">${list || '—'}</ul></div>`;
  }).join(''));

  tabla.innerHTML = header + filaPrecio + filaCaract + filaVent;
  document.getElementById('loader')?.classList.add('hidden');
  document.getElementById('contenido-comparacion')?.classList.remove('hidden');
}

function mostrarError(msg) {
  const loader = document.getElementById('loader');
  if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
}

function irAtras(e) {
  if (e) e.preventDefault();
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) window.location.href = '/inicio/inicio.html';
  else window.history.back();
}