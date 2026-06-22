import { obtenerArticulo, obtenerFavoritos, agregarFavoritoArticulo, eliminarFavoritoArticulo } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // ── DECLARACIÓN GLOBAL DE NAV (Fuera de try) ──────────
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');

  // ── Nav Eventos ───────────────────────────────────────
  try {
    hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
        navDrawer?.classList.remove('open');
    });
    // ... tus botones de cerrar sesión ...
  } catch(navErr) { console.warn('Nav error:', navErr); }

  // ── CIERRE AUTOMÁTICO DEL MENÚ MÓVIL ────────────────────────
  // Ahora navDrawer ya está definido y vive aquí sin errores
  const enlacesMenu = navDrawer?.querySelectorAll('a');
  enlacesMenu?.forEach(enlace => {
    enlace.addEventListener('click', () => {
      navDrawer?.classList.remove('open');
    });
  });

  window.addEventListener('pageshow', () => {
    navDrawer?.classList.remove('open');
  });

  // ... el resto de tu código ...

  // ── ID del artículo ───────────────────────────────────
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { mostrarError('No se especificó ID del artículo'); return; }

  const loader    = document.getElementById('loader');
  const contenido = document.getElementById('contenido-articulo');

  // ── Llamadas al backend ───────────────────────────────
  const favPromise = obtenerFavoritos().catch(() => null);
  let ok, data;
  try {
    const res = await obtenerArticulo(id);
    ok   = res.ok;
    data = res.data;
  } catch (fetchErr) {
    console.error('Fetch error:', fetchErr);
    mostrarError('No se pudo conectar al servidor.');
    return;
  }

  if (!ok) {
    mostrarError(data?.error || data?.mensaje || 'Artículo no encontrado');
    return;
  }

  // ── Rellenar la Vista ─────────────────────────────────
  try { document.title = `LUMIKA — ${data.nombre_articulo}`; } catch(_){}

  // Semáforo y Círculo Visual
  try {
    const color = data.estado_evaluacion === 'insuficiente' ? 'gris' : (data.color_semaforo || 'gris');
    
    // Halo de luz
    const elDot = document.getElementById('semaforo-dot');
    if (elDot) elDot.style.background = `var(--color-semaforo-${color})`;
    
    // Círculo gigante principal
    const elCirculo = document.getElementById('circulo-semaforo');
    if (elCirculo) elCirculo.style.backgroundColor = `var(--color-semaforo-${color})`;

    const ETIQUETAS = { verde:'Recomendado ✓', amarillo:'Usar con precaución ⚠', rojo:'No recomendado ✗', gris:'Sin datos suficientes' };
    setText('estado-evaluacion', ETIQUETAS[color] || '');
  } catch(e) { console.warn('semaforo error:', e); }

  // Nombre y precio (CORREGIDO: Artículos usan precio_estimado)
  setText('nombre-articulo', data.nombre_articulo || '');
  setText('precio', data.precio_estimado != null ? `Aprox. $${data.precio_estimado} MXN` : 'Precio no disponible');

  // Razón de la clasificación
  setText('explicacion-semaforo', data.razon_clasificacion || data.explicacion_semaforo || 'Sin descripción disponible.');

  // ── Tarjetas Dinámicas ────────────────────────────────

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

  // Ingredientes/Componentes (Normalmente vacío en artículos, lo ocultamos si no hay datos)
  try {
    const listaIng = document.getElementById('lista-ingredientes');
    const cardIng = document.getElementById('card-ingredientes');
    if (listaIng && cardIng) {
      if (data.componentes?.trim()) {
        listaIng.innerHTML = `<p style="font-size:1rem;line-height:1.5;color:var(--color-text-secondary)">${data.componentes}</p>`;
      } else {
        cardIng.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('componentes error:', e); }

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

  // Desventajas / Limitaciones Dinámicas
  try {
    const listaDes = document.getElementById('lista-desventajas');
    const cardDes = document.getElementById('card-desventajas');
    
    if (listaDes && cardDes) {
      if (data.desventajas?.length) {
        const esArticuloVerde = data.estado_evaluacion !== 'insuficiente' && data.color_semaforo === 'verde';
        const tituloCard = cardDes.querySelector('.info-card__titulo');
        
        if (tituloCard) {
          if (esArticuloVerde) {
            tituloCard.className = 'info-card__titulo text-amarillo';
            tituloCard.innerHTML = `<i class="fa-solid fa-triangle-exclamation info-card__icono"></i> Limitaciones`;
          } else {
            tituloCard.className = 'info-card__titulo text-rojo';
            tituloCard.innerHTML = `<i class="fa-solid fa-triangle-exclamation info-card__icono"></i> Desventajas`;
          }
        }

        const colorIcono = esArticuloVerde ? '#d39e00' : 'var(--color-error)';

        listaDes.innerHTML = data.desventajas.map(d =>
          `<div>
            <i class="fa-solid fa-triangle-exclamation" style="color:${colorIcono}; margin-top:4px;"></i>
            <span>${d.descripcion}</span>
          </div>`
        ).join('');
        
        cardDes.classList.remove('hidden');
      } else {
        cardDes.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('desventajas error:', e); }

  // Descripción general del artículo (CORREGIDO)
  try {
    const cardDesc = document.getElementById('card-descripcion-articulo');
    const textoDesc = document.getElementById('texto-descripcion-articulo');
    if (cardDesc && textoDesc) {
      if (data.descripcion?.trim()) {
        textoDesc.textContent = data.descripcion;
      } else {
        cardDesc.classList.add('hidden');
      }
    }
  } catch(e) { console.warn('descripcion general error:', e); }

  // ── Mostrar contenido ─────────────────────────────────
  loader?.classList.add('hidden');
  contenido?.classList.remove('hidden');

  // ── Botones ───────────────────────────────────────────
  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);
  document.getElementById('btn-alternativas')?.addEventListener('click', () => {
    window.location.href = `/recomendaciones/alternativas/alternativas.html?id=${id}`;
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
      // Validamos usando solo el ID del artículo
      esFav = data.some(f => String(f.id_articulo_id || f.id_articulo) === String(id));
      actualizarFav(btn, esFav);
    }
  } catch (_) {}

  btn.addEventListener('click', async () => {
    try {
      if (esFav) { 
        await eliminarFavoritoArticulo(id); 
        esFav = false; 
      } else { 
        await agregarFavoritoArticulo(id);  
        esFav = true;  
      }
      actualizarFav(btn, esFav);
      toast(esFav ? '⭐ Agregado a favoritos' : 'Eliminado de favoritos');
    } catch (err) { 
      console.error('favorito click error:', err); 
    }
  });
}

function actualizarFav(btn, activo) {
  if (!btn) return;
  btn.innerHTML = `<i class="${activo ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
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
    window.location.href = '/recomendaciones/inicio/inicio.html';
  } else {
    window.history.back();
  }
}

