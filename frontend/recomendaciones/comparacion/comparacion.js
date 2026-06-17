import { compararArticulos } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

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
    mostrarError('Necesitas al menos 2 artículos para comparar.');
    return;
  }

  try {
    const { ok, data } = await compararArticulos(ids);
    if (!ok || !data?.length) throw new Error(data?.error || 'Sin datos');
    pintarComparacion(data, idOriginal);
  } catch (err) {
    mostrarError(`Error: ${err.message}`);
  }

  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);
});

function pintarComparacion(articulos, idOriginal) {
  const original     = articulos.find(a => a.id_articulo === idOriginal) || articulos[0];
  const alternativas = articulos.filter(a => a.id_articulo !== idOriginal);
  const ordenados    = [original, ...alternativas];

  const subtitulo = document.getElementById('subtitulo-comparacion');
  if (subtitulo) {
    subtitulo.textContent = `Comparando ${ordenados.length} artículo${ordenados.length > 1 ? 's' : ''} de la misma subcategoría`;
  }

  // ── Cards de artículos ───────────────────────────────
  const gridArticulos = document.getElementById('grid-articulos');
  gridArticulos.style.gridTemplateColumns = `repeat(${ordenados.length}, 1fr)`;
  gridArticulos.innerHTML = ordenados.map((a, i) => {
    const color  = a.estado_evaluacion === 'insuficiente' ? 'gris' : (a.color_semaforo || 'gris');
    const precio = a.precio_estimado != null ? `$${a.precio_estimado}` : '—';
    const isOrig = i === 0;
    return `
      <div class="cmp-card ${isOrig ? 'cmp-card--original' : 'cmp-card--alt'}">
        <span class="cmp-badge ${isOrig ? '' : 'cmp-badge--alt'}">${isOrig ? 'Tu artículo' : 'Alternativa'}</span>
        <div class="cmp-dot" style="background:var(--color-semaforo-${color});margin-top:var(--space-4)"></div>
        <h3 class="cmp-card__name">${a.nombre_articulo}</h3>
        <p class="cmp-card__price">${precio}</p>
        <a href="/recomendaciones/detalle-articulo/detalle-articulo.html?id=${a.id_articulo}"
           class="btn btn--secondary" style="margin-top:var(--space-2);font-size:var(--text-sm)">Ver detalle</a>
      </div>`;
  }).join('');

  // ── Tabla comparativa ────────────────────────────────
  const tabla = document.getElementById('tabla-comparacion');
  if (!tabla) {
    document.getElementById('loader')?.classList.add('hidden');
    document.getElementById('contenido-comparacion')?.classList.remove('hidden');
    return;
  }

  const cols     = ordenados.length;
  tabla.style.setProperty('--cmp-cols', `160px repeat(${cols}, 1fr)`);

  const ETQ_SEM = { verde:'🟢 Verde', amarillo:'🟡 Amarillo', rojo:'🔴 Rojo', gris:'⚪ Sin datos' };

  const fila = (label, icon, celdas) => `
    <div class="cmp-row">
      <div class="cmp-label"><i class="${icon}"></i> ${label}</div>
      ${celdas}
    </div>`;

  const header = `
    <div class="cmp-row cmp-row--header">
      <div class="cmp-label">Atributo</div>
      ${ordenados.map((a, i) => `
        <div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''}">
          ${a.nombre_articulo}
        </div>`).join('')}
    </div>`;

  // Precio estimado
  const precios   = ordenados.map(a => a.precio_estimado != null ? parseFloat(a.precio_estimado) : null);
  const minPrecio = Math.min(...precios.filter(n => n !== null));
  const filaPrecio = fila('Precio estimado', 'fa-solid fa-tag',
    ordenados.map((a, i) => {
      const precio  = precios[i];
      const esMejor = precio !== null && precio === minPrecio;
      return `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''} ${esMejor ? 'cmp-cell--best' : ''}">
        ${precio != null ? `$${precio}` : '—'}
        ${esMejor ? '<i class="fa-solid fa-circle-check" style="color:var(--color-success)"></i>' : ''}
      </div>`;
    }).join('')
  );

  // Semáforo
  const filaSem = fila('Semáforo', 'fa-solid fa-traffic-light',
    ordenados.map((a, i) => {
      const c = a.estado_evaluacion === 'insuficiente' ? 'gris' : (a.color_semaforo || 'gris');
      return `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''} ${c === 'verde' ? 'cmp-cell--best' : ''}">
        ${ETQ_SEM[c] || c}
      </div>`;
    }).join('')
  );

  // Descripción
  const filaDesc = fila('Descripción', 'fa-solid fa-align-left',
    ordenados.map((a, i) => {
      const texto = a.descripcion?.trim() || '';
      return `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''}">
        ${texto
          ? `<p style="font-size:var(--text-sm);text-align:left;margin:0;line-height:1.5">${texto}</p>`
          : '<span style="color:var(--color-text-muted)">—</span>'}
      </div>`;
    }).join('')
  );

  // Razón de clasificación
  const filaRazon = fila('Razón de clasificación', 'fa-solid fa-magnifying-glass-chart',
    ordenados.map((a, i) => {
      const texto = a.razon_clasificacion?.trim() || '';
      return `<div class="cmp-cell ${i === 0 ? 'cmp-cell--original' : ''}">
        ${texto
          ? `<p style="font-size:var(--text-sm);text-align:left;margin:0;line-height:1.5">${texto}</p>`
          : '<span style="color:var(--color-text-muted)">—</span>'}
      </div>`;
    }).join('')
  );

  tabla.innerHTML = header + filaPrecio + filaSem + filaDesc + filaRazon;

  document.getElementById('loader')?.classList.add('hidden');
  document.getElementById('contenido-comparacion')?.classList.remove('hidden');
}

function mostrarError(msg) {
  const loader = document.getElementById('loader');
  if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
}

function irAtras() {
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}
