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

  // ── Llamadas al backend en paralelo ──────────────────
  const favPromise = obtenerFavoritos().catch(() => null);
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

 // ── Rellenar Tarjetas Dinámicas ──────────────────────

  // Ingredientes
  try {
    const listaIng = document.getElementById('lista-ingredientes');
    const cardIng = document.getElementById('card-ingredientes');
    if (listaIng && cardIng) {
      if (data.ingredientes?.trim()) {
        listaIng.innerHTML = `<p style="font-size:1rem;line-height:1.5;color:var(--color-text-secondary)">${data.ingredientes}</p>`;
      } else {
        cardIng.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('ingredientes error:', e); }

  // Características
  try {
    const listaCarac = document.getElementById('lista-caracteristicas');
    const cardCarac = document.getElementById('card-caracteristicas');
    if (listaCarac && cardCarac) {
      if (data.caracteristicas?.length) {
        listaCarac.innerHTML = data.caracteristicas.map(c =>
          `<div><i class="fa-solid fa-circle-dot" style="color:var(--color-success);font-size:0.6rem;margin-top:6px;"></i><span>${c.descripcion}</span></div>`
        ).join('');
      } else {
        cardCarac.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('caracteristicas error:', e); }

  // Ventajas Ecológicas
  try {
    const listaVent = document.getElementById('lista-ventajas');
    const cardVent = document.getElementById('card-ventajas');
    if (listaVent && cardVent) {
      if (data.ventajas?.length) {
        listaVent.innerHTML = data.ventajas.map(v =>
          `<div><i class="fa-solid fa-leaf" style="color:var(--color-success);margin-top:4px;"></i><span>${v.descripcion}</span></div>`
        ).join('');
      } else {
        cardVent.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('ventajas error:', e); }

  // ── Desventajas / Limitaciones Dinámicas ──────────────────────
  try {
    const listaDes = document.getElementById('lista-desventajas');
    const cardDes = document.getElementById('card-desventajas');
    
    if (listaDes && cardDes) {
      if (data.desventajas?.length) {
        // Evaluamos si el producto es estrictamente verde
        const esProductoVerde = data.estado_evaluacion !== 'insuficiente' && data.color_semaforo === 'verde';
        
        // Target al elemento del título dentro de esta tarjeta
        const tituloCard = cardDes.querySelector('.info-card__titulo');
        
        if (tituloCard) {
          if (esProductoVerde) {
            // Si es verde, cambiamos el texto a "Limitaciones" y la clase a amarillo
            tituloCard.className = 'info-card__titulo text-amarillo';
            tituloCard.innerHTML = `<i class="fa-solid fa-triangle-exclamation info-card__icono"></i> Limitaciones`;
          } else {
            // Si es de cualquier otro color, se mantiene como "Desventajas" en rojo
            tituloCard.className = 'info-card__titulo text-rojo';
            tituloCard.innerHTML = `<i class="fa-solid fa-triangle-exclamation info-card__icono"></i> Desventajas`;
          }
        }

        // Definimos el color del ícono de cada elemento de la lista
        const colorIcono = esProductoVerde ? '#d39e00' : 'var(--color-error)';

        // Renderizamos la lista aplicando el color dinámico en los íconos
        listaDes.innerHTML = data.desventajas.map(d =>
          `<div>
            <i class="fa-solid fa-triangle-exclamation" style="color:${colorIcono}; margin-top:4px;"></i>
            <span>${d.descripcion}</span>
          </div>`
        ).join('');
        
        // Nos aseguramos de que la tarjeta sea visible si tiene elementos
        cardDes.classList.remove('hidden');
        
      } else {
        // Si no tiene ningún registro, ocultamos la tarjeta por completo
        cardDes.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('desventajas error:', e); }


  // ── Mostrar contenido ─────────────────────────────────
  loader?.classList.add('hidden');
  contenido?.classList.remove('hidden');

  // ── Botones ───────────────────────────────────────────
  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);
  document.getElementById('btn-alternativas')?.addEventListener('click', () => {
    window.location.href = `/buscador/alternativas/alternativas.html?id=${id}`;
  });

  // ── Favorito ──────────────────────────────────────────
  const favRes = await favPromise;
  try { await setupFavorito(id, favRes); } catch(e) { console.warn('favorito error:', e); }
});

async function setupFavorito(id, preloadedFavs) {
  const btn = document.getElementById('btn-favorito');
  if (!btn) return;

  let esFav = false;
  try {
    const { ok, data } = preloadedFavs || await obtenerFavoritos();
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
