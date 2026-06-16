import { obtenerProducto, obtenerFavoritos, agregarFavorito, eliminarFavorito } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // ── Nav ───────────────────────────────────────────────
  try {
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
  } catch(navErr) { console.warn('Nav error:', navErr); }

  // ── ID del producto ───────────────────────────────────
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { mostrarError('No se especificó ID de producto'); return; }

  // ── Mostrar loader ────────────────────────────────────
  const loader   = document.getElementById('loader');
  const contenido = document.getElementById('contenido-producto');

  // ── Llamada al backend ────────────────────────────────
  let ok, data;
  try {
    const res = await obtenerProducto(id);
    ok   = res.ok;
    data = res.data;
  } catch (fetchErr) {
    console.error('Fetch error:', fetchErr);
    mostrarError('No se pudo conectar al servidor.');
    return;
  }

  if (!ok) {
    mostrarError(data?.error || 'Producto no encontrado');
    return;
  }

  // ── Rellenar el HTML uno a uno — todos con null check ──
  try { document.title = `LUMIKA — ${data.nombre_producto}`; } catch(_){}

  // Imagen
  try {
    const elImg = document.getElementById('imagen-producto');
    if (elImg) {
      elImg.src = getRutaImagen(data);
      elImg.alt = data.nombre_producto || '';
      elImg.onerror = () => { elImg.src = '/assets/images/placeholder.svg'; };
    }
  } catch(e) { console.warn('img error:', e); }

  // Semáforo
  try {
    const color = data.estado_evaluacion === 'insuficiente' ? 'gris' : (data.color_semaforo || 'gris');
    const elDot = document.getElementById('semaforo-dot');
    if (elDot) elDot.style.background = `var(--color-semaforo-${color})`;

    const ETIQUETAS = { verde:'Recomendado ✓', amarillo:'Usar con precaución ⚠', rojo:'No recomendado ✗', gris:'Sin datos suficientes' };
    setText('estado-evaluacion', ETIQUETAS[color] || '');
  } catch(e) { console.warn('semaforo error:', e); }

  // Nombre y precio
  setText('nombre-producto', data.nombre_producto || '');
  setText('precio', data.precio_min != null ? `$${data.precio_min} – $${data.precio_max}` : 'Precio no disponible');

  // Descripción
  setText('explicacion-semaforo', data.razon_clasificacion || 'Sin descripción disponible.');

  // Ingredientes
  try {
    const listaIng = document.getElementById('lista-ingredientes');
    if (listaIng) {
      if (data.ingredientes?.trim()) {
        listaIng.innerHTML = `<p style="font-size:var(--text-base);line-height:1.8;color:var(--color-text-secondary)">${data.ingredientes}</p>`;
      } else if (data.caracteristicas?.length) {
        listaIng.innerHTML = data.caracteristicas.map(c =>
          `<div style="padding:6px 0;border-bottom:1px solid var(--color-border);font-size:var(--text-base)">
             <i class="fa-solid fa-circle-dot" style="color:var(--color-success);margin-right:8px;font-size:0.7rem"></i>${c.descripcion}
           </div>`
        ).join('');
      } else {
        document.getElementById('card-ingredientes')?.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('ingredientes error:', e); }

  // Criterios
  try {
    const listaCrit = document.getElementById('lista-criterios');
    if (listaCrit && data.criterios?.length) {
      const cols  = { cumple:'var(--color-success)', parcial:'var(--color-primary-dark)', 'no cumple':'var(--color-error)' };
      const icons = { cumple:'fa-check', parcial:'fa-minus', 'no cumple':'fa-xmark' };
      listaCrit.innerHTML = data.criterios.map(c => `
        <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--color-border)">
          <i class="fa-solid ${icons[c.resultado]||'fa-question'}" style="color:${cols[c.resultado]||'#999'};width:16px;flex-shrink:0"></i>
          <span style="flex:1;font-size:var(--text-base)">${c.nombre_criterio}</span>
          <span style="font-size:var(--text-sm);color:${cols[c.resultado]||'#999'};font-weight:600;text-transform:capitalize">${c.resultado}</span>
        </div>`
      ).join('');
    } else if (listaCrit !== null) {
      document.getElementById('card-criterios')?.classList.add('hidden');
    }
  } catch(e) { console.warn('criterios error:', e); }

  // Ventajas
  try {
    const listaVent = document.getElementById('lista-ventajas');
    if (listaVent && data.ventajas?.length) {
      listaVent.innerHTML = data.ventajas.map(v =>
        `<div style="display:flex;gap:var(--space-2);padding:var(--space-2) 0">
           <i class="fa-solid fa-leaf" style="color:var(--color-success);margin-top:3px;flex-shrink:0"></i>
           <span style="font-size:var(--text-base)">${v.descripcion}</span>
         </div>`
      ).join('');
    } else {
      document.getElementById('card-ventajas')?.classList.add('hidden');
    }
  } catch(e) { console.warn('ventajas error:', e); }

  // Desventajas
  try {
    const listaDes = document.getElementById('lista-desventajas');
    if (listaDes && data.desventajas?.length) {
      listaDes.innerHTML = data.desventajas.map(d =>
        `<div style="display:flex;gap:var(--space-2);padding:var(--space-2) 0">
           <i class="fa-solid fa-triangle-exclamation" style="color:var(--color-error);margin-top:3px;flex-shrink:0"></i>
           <span style="font-size:var(--text-base)">${d.descripcion}</span>
         </div>`
      ).join('');
    } else {
      document.getElementById('card-desventajas')?.classList.add('hidden');
    }
  } catch(e) { console.warn('desventajas error:', e); }

  // ── Mostrar contenido ─────────────────────────────────
  loader?.classList.add('hidden');
  contenido?.classList.remove('hidden');

  // ── Botones ───────────────────────────────────────────
  document.getElementById('btn-regresar')?.addEventListener('click', () => window.history.back());
  document.getElementById('btn-alternativas')?.addEventListener('click', () => {
    window.location.href = `/buscador/alternativas/alternativas.html?id=${id}`;
  });

  // ── Favorito ──────────────────────────────────────────
  try { await setupFavorito(id); } catch(e) { console.warn('favorito error:', e); }
});

async function setupFavorito(id) {
  const btn = document.getElementById('btn-favorito');
  if (!btn) return;

  let esFav = false;
  try {
    const { ok, data } = await obtenerFavoritos();
    if (ok && Array.isArray(data)) {
      esFav = data.some(f => String(f.id_producto_id ?? f.id_producto) === String(id));
      actualizarFav(btn, esFav);
    }
  } catch (_) {}

  btn.addEventListener('click', async () => {
    try {
      if (esFav) { await eliminarFavorito(id); esFav = false; }
      else        { await agregarFavorito(id);  esFav = true;  }
      actualizarFav(btn, esFav);
      toast(esFav ? '⭐ Agregado a favoritos' : 'Eliminado de favoritos');
    } catch (err) { console.error('favorito click error:', err); }
  });
}

function actualizarFav(btn, activo) {
  if (!btn) return;
  btn.innerHTML = `<i class="${activo ? 'fa-solid' : 'fa-regular'} fa-star"></i> ${activo ? 'Guardado' : 'Guardar'}`;
  btn.style.background  = activo ? 'var(--color-primary)' : '';
  btn.style.borderColor = activo ? 'var(--color-primary-dark)' : '';
}

function setText(id, texto) {
  try {
    const el = document.getElementById(id);
    if (el) el.textContent = texto ?? '';
  } catch(e) { console.warn(`setText(${id}) error:`, e); }
}

function mostrarError(msg) {
  try {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.innerHTML = `<div class="alerta alerta--error" style="margin:var(--space-4)">${msg}</div>`;
    } else {
      // Fallback: crear el div en el body
      const div = document.createElement('div');
      div.className = 'alerta alerta--error';
      div.style.cssText = 'margin:40px 20px;';
      div.textContent = msg;
      document.body.appendChild(div);
    }
  } catch(e) { console.error('mostrarError fallback:', msg, e); }
}

function toast(msg) {
  try {
    const t = document.createElement('div');
    t.className = 'lumika-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  } catch(_) {}
}
