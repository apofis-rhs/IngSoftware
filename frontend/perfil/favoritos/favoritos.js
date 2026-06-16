import { obtenerFavoritos, eliminarFavorito, estaLogueado } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!estaLogueado()) { window.location.href = '/auth/login/login.html'; return; }

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

  // Partículas decorativas
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

  const contBuscador  = document.getElementById('favoritos-buscador');
  const contRecom     = document.getElementById('favoritos-recomendaciones');
  const filtroModulo  = document.getElementById('filtro-modulo');
  const secBuscador   = document.getElementById('seccion-buscador');
  const secRecom      = document.getElementById('seccion-recom');

  let favoritos = [];

  // ── Cargar favoritos de la BD ─────────────────────────
  try {
    const { ok, data } = await obtenerFavoritos();
    // Serializer devuelve: { id_favorito, id_producto_id, nombre_producto,
    //   color_semaforo, precio_min, precio_max, imagen, ingredientes, id_subcategoria }
    if (ok && Array.isArray(data)) favoritos = data;
  } catch (err) { console.error('Error cargando favoritos:', err); }

  renderGrid();

  // Filtro
  filtroModulo?.addEventListener('change', e => {
    const v = e.target.value;
    if (secBuscador) secBuscador.style.display = (v === 'todos' || v === 'buscador') ? 'block' : 'none';
    if (secRecom)    secRecom.style.display    = (v === 'todos' || v === 'recomendaciones') ? 'block' : 'none';
  });

  // Eliminar (delegado)
  document.addEventListener('click', async e => {
    const btn = e.target.closest('.fav-card__btn-remove');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();

    const idProducto = btn.dataset.id;
    const card = btn.closest('.fav-card');
    card?.classList.add('removing');

    try {
      await eliminarFavorito(idProducto);
      favoritos = favoritos.filter(f => String(f.id_producto_id) !== String(idProducto));
    } catch (err) { console.error('Error eliminando favorito:', err); }

    setTimeout(() => { card?.remove(); mostrarToast('Eliminado de favoritos'); }, 300);
  });

  // ── Render ────────────────────────────────────────────
  function renderGrid() {
    inyectarTarjetas(contBuscador, favoritos, '/buscador/detalle-producto/detalle-producto.html');
    // Sección recomendaciones vacía (favoritos solo son de productos por ahora)
    if (contRecom) contRecom.innerHTML = `
      <div class="fav-empty" style="padding:30px;text-align:center">
        <i class="fa-solid fa-leaf" style="font-size:2rem;color:var(--color-success);opacity:0.4;margin-bottom:8px;display:block"></i>
        <p style="color:#999;margin:0">Los artículos favoritos estarán disponibles próximamente.</p>
      </div>`;
  }

  function inyectarTarjetas(contenedor, lista, rutaBase) {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (!lista.length) {
      contenedor.innerHTML = `
        <div class="fav-empty" style="padding:40px;text-align:center">
          <i class="fa-regular fa-star" style="font-size:3rem;color:#ddd;margin-bottom:12px;display:block"></i>
          <p style="color:#999;margin:0">Aún no tienes favoritos.<br>
          <a href="/buscador/inicio/inicio.html" style="color:var(--color-success)">Explora productos</a> y guarda los que más te gusten.</p>
        </div>`;
      return;
    }

    const dotColors = {
      verde:    'var(--color-semaforo-verde)',
      amarillo: 'var(--color-semaforo-amarillo)',
      rojo:     'var(--color-semaforo-rojo)',
    };

    lista.forEach((item, i) => {
      const id       = item.id_producto_id;
      const nombre   = item.nombre_producto || 'Producto';
      const color    = item.color_semaforo  || 'gris';
      const dotColor = dotColors[color]     || 'var(--color-semaforo-gris)';
      const precio   = item.precio_min != null ? `$${item.precio_min} – $${item.precio_max}` : '';

      // getRutaImagen usa imagen + id_subcategoria del item
      const imgSrc = getRutaImagen({
        imagen: item.imagen,
        id_subcategoria: item.id_subcategoria,
      });

      contenedor.innerHTML += `
        <div class="fav-card" style="animation-delay:${i * 0.08}s">
          <button class="fav-card__btn-remove" data-id="${id}" title="Quitar de favoritos">
            <i class="fa-regular fa-trash-can"></i>
          </button>
          <a href="${rutaBase}?id=${id}" class="fav-card__link">
            <div class="fav-card__img-wrap">
              <div class="fav-card__dot" style="background:${dotColor}"></div>
              <img src="${imgSrc}" alt="${nombre}"
                   onerror="this.src='/assets/images/placeholder.svg'">
            </div>
            <div class="fav-card__info">
              <div class="fav-card__title">${nombre}</div>
              <div class="fav-card__price">${precio}</div>
            </div>
          </a>
        </div>`;
    });
  }

  function mostrarToast(msg) {
    let tc = document.querySelector('.toast-container');
    if (!tc) { tc = document.createElement('div'); tc.className = 'toast-container'; document.body.appendChild(tc); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
});
