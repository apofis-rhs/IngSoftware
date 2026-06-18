import { obtenerFavoritos, eliminarFavorito, estaLogueado } from '/assets/js/api.js';
import { agregarFavoritoArticulo, eliminarFavoritoArticulo } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) { window.location.href = '/auth/login/login.html'; return; }

  // ── BOTÓN REGRESAR INTELIGENTE ────────────────────────
  // Captura tanto la flecha superior como un botón inferior si lo hay
  const btnAtras = document.querySelector('.btn-back') || document.getElementById('btn-regresar');
  if (btnAtras) {
    btnAtras.addEventListener('click', irAtras);
  }

  // Nav
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

  // Partículas
  const colors = ['#FFD460','#BAC423','#FF8C99','#FFAC00'];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 15 + 8;
    p.style.cssText = `width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'0 50% 50% 50%':'50%'};
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*6+4}s;
      animation-delay:${Math.random()*5}s;`;
    document.body.appendChild(p);
  }

  const contBuscador = document.getElementById('favoritos-buscador');
  const contRecom    = document.getElementById('favoritos-recomendaciones');
  const filtroModulo = document.getElementById('filtro-modulo');
  const secBuscador  = document.getElementById('seccion-buscador');
  const secRecom     = document.getElementById('seccion-recom');

  let favProductos = [];
  let favArticulos = [];

  // ── Cargar todo desde BD (un solo GET) ───────────────
  try {
    const { ok, data } = await obtenerFavoritos();
    if (ok && Array.isArray(data)) {
      favProductos = data.filter(f => !f.es_articulo);
      favArticulos = data.filter(f =>  f.es_articulo);
    }
  } catch (err) { console.error('Error cargando favoritos:', err); }

  // Filtro
  filtroModulo?.addEventListener('change', e => {
    const v = e.target.value;
    if (secBuscador) secBuscador.style.display = (v === 'todos' || v === 'buscador')        ? 'block' : 'none';
    if (secRecom)    secRecom.style.display    = (v === 'todos' || v === 'recomendaciones') ? 'block' : 'none';
  });

  renderProductos();
  renderArticulos();

  // ── Eliminar (delegado) ───────────────────────────────
  document.addEventListener('click', async e => {
    const btn = e.target.closest('.fav-card__btn-remove');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const card = btn.closest('.fav-card');
    card?.classList.add('removing');

    try {
      if (btn.dataset.tipo === 'articulo') {
        await eliminarFavoritoArticulo(btn.dataset.id);
        favArticulos = favArticulos.filter(f => String(f.id_articulo_id) !== String(btn.dataset.id));
      } else {
        await eliminarFavorito(btn.dataset.id);
        favProductos = favProductos.filter(f => String(f.id_producto_id) !== String(btn.dataset.id));
      }
    } catch (err) { console.error(err); }

    setTimeout(() => card?.remove(), 300);
    toast('Eliminado de favoritos');
  });

  // ── Render PRODUCTOS ──────────────────────────────────
  function renderProductos() {
    if (!contBuscador) return;
    contBuscador.innerHTML = '';

    if (!favProductos.length) {
      contBuscador.innerHTML = `
        <div class="fav-empty" style="padding:40px;text-align:center">
          <i class="fa-regular fa-star" style="font-size:3rem;color:#ddd;display:block;margin-bottom:12px"></i>
          <p style="color:#999;margin:0">No tienes productos favoritos.<br>
          <a href="/buscador/inicio/inicio.html" style="color:var(--color-success)">Explora el buscador</a></p>
        </div>`;
      return;
    }

    const dotColors = { verde:'var(--color-semaforo-verde)', amarillo:'var(--color-semaforo-amarillo)', rojo:'var(--color-semaforo-rojo)' };

    favProductos.forEach((item, i) => {
      const id       = item.id_producto_id;
      const nombre   = item.nombre_producto || 'Producto';
      const color    = item.color_semaforo  || 'gris';
      const dotColor = dotColors[color]     || '#ccc';
      const precio   = item.precio_min != null ? `$${item.precio_min} – $${item.precio_max}` : '';
      const imgSrc   = getRutaImagen({ imagen: item.imagen, id_subcategoria: item.id_subcategoria });

      contBuscador.innerHTML += `
        <div class="fav-card" style="animation-delay:${i*0.08}s">
          <button class="fav-card__btn-remove" data-id="${id}" data-tipo="producto" title="Quitar">
            <i class="fa-regular fa-trash-can"></i>
          </button>
          <a href="/buscador/detalle-producto/detalle-producto.html?id=${id}" class="fav-card__link">
            <div class="fav-card__img-wrap">
              <div class="fav-card__dot" style="background:${dotColor}"></div>
              <img src="${imgSrc}" alt="${nombre}" onerror="this.src='/assets/images/placeholder.svg'">
            </div>
            <div class="fav-card__info">
              <div class="fav-card__title">${nombre}</div>
              <div class="fav-card__price">${precio}</div>
            </div>
          </a>
        </div>`;
    });
  }

  // ── Render ARTÍCULOS ──────────────────────────────────
  function renderArticulos() {
    if (!contRecom) return;
    contRecom.innerHTML = '';

    if (!favArticulos.length) {
      contRecom.innerHTML = `
        <div class="fav-empty" style="padding:40px;text-align:center">
          <i class="fa-solid fa-leaf" style="font-size:3rem;color:var(--color-success);opacity:0.3;display:block;margin-bottom:12px"></i>
          <p style="color:#999;margin:0">No tienes artículos favoritos.<br>
          <a href="/recomendaciones/inicio/inicio.html" style="color:var(--color-success)">Explora recomendaciones</a></p>
        </div>`;
      return;
    }

    const COLORES = { verde:'var(--color-semaforo-verde)', amarillo:'var(--color-semaforo-amarillo)', rojo:'var(--color-semaforo-rojo)' };

    favArticulos.forEach((item, i) => {
      const id       = item.id_articulo_id;
      const nombre   = item.nombre_articulo || 'Artículo';
      const color    = item.color_semaforo_art || 'gris';
      const dotColor = COLORES[color] || '#ccc';
      const precio   = item.precio_estimado ? `$${parseFloat(item.precio_estimado).toFixed(2)}` : '';

      contRecom.innerHTML += `
        <div class="fav-card" style="animation-delay:${i*0.08}s">
          <button class="fav-card__btn-remove" data-id="${id}" data-tipo="articulo" title="Quitar">
            <i class="fa-regular fa-trash-can"></i>
          </button>
          <a href="/recomendaciones/detalle-articulo/detalle-articulo.html?id=${id}" class="fav-card__link">
            <div class="fav-card__img-wrap" style="display:flex;align-items:center;justify-content:center">
              <div style="width:56px;height:56px;border-radius:50%;background:${dotColor};
                          box-shadow:0 0 0 6px ${dotColor}25;flex-shrink:0"></div>
            </div>
            <div class="fav-card__info">
              <div class="fav-card__title">${nombre}</div>
              <div class="fav-card__price">${precio}</div>
            </div>
          </a>
        </div>`;
    });
  }

  function toast(msg) {
    let tc = document.querySelector('.toast-container');
    if (!tc) { tc = document.createElement('div'); tc.className = 'toast-container'; document.body.appendChild(tc); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
});

// ── FUNCIÓN MAESTRA PARA REGRESAR ───────────────────────────────
function irAtras(e) {
  if (e) e.preventDefault(); // Evita que recargue la página si es una etiqueta <a>
  
  const prev = document.referrer;
  
  if (!prev || prev.includes('/auth/')) {
    // Si viene directo del login o de una URL externa, lo mandamos al inicio
    window.location.href = '/inicio/inicio.html';
  } else {
    // Regresa a la página exacta de donde vino (ej. el detalle del producto)
    window.history.back();
  }
}