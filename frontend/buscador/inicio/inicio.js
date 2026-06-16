import { buscarProductos } from '/assets/js/api.js';
import { getRutaImagen }   from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  // Nav hamburguesa
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

  const inputBusqueda          = document.getElementById('input-busqueda');
  const contenedorRecomendados = document.getElementById('recomendados');
  const contenedorPopulares    = document.getElementById('populares');
  const loader                 = document.getElementById('loader');

  const POR_PAGINA = 6;
  let todosProductos = [];
  let visiblesRec = POR_PAGINA;
  let visiblesPop = POR_PAGINA;

  function crearCard(producto) {
    const color  = producto.estado_evaluacion === 'insuficiente' ? 'gris' : (producto.color_semaforo || 'gris');
    const imgSrc = getRutaImagen(producto);
    const precio = producto.precio_min != null
      ? `$${producto.precio_min} – $${producto.precio_max}`
      : 'Precio no disponible';

    const card = document.createElement('div');
    card.className = 'product-card-grid fade-in-up';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-grid__img">
        <img src="${imgSrc}" alt="${producto.nombre_producto}"
             style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md)"
             onerror="this.src='/assets/images/placeholder.svg'">
        <div class="product-card-grid__dot semaforo-dot--${color}"></div>
      </div>
      <div class="product-card-grid__info">
        <p class="product-card-grid__name">${producto.nombre_producto}</p>
        <p class="product-card-grid__price">${precio}</p>
      </div>`;
    card.addEventListener('click', () => {
      window.location.href = `/buscador/detalle-producto/detalle-producto.html?id=${producto.id_producto}`;
    });
    return card;
  }

  function renderSeccion(contenedor, lista, visibles, btnId) {
    contenedor.innerHTML = '';
    const slice = lista.slice(0, visibles);
    slice.forEach(p => contenedor.appendChild(crearCard(p)));

    // Quitar botón anterior
    document.getElementById(btnId)?.remove();

    if (lista.length > visibles) {
      const btn = document.createElement('button');
      btn.id = btnId;
      btn.className = 'btn-cargar-mas';
      btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Cargar más (${lista.length - visibles} restantes)`;
      contenedor.after(btn);
      return btn;
    }
    return null;
  }

  // Carga inicial
  const TERMINOS = ['shampoo', 'crema', 'jabon', 'locion', 'gel', 'protector', 'acondicionador'];
  if (loader) loader.style.display = 'block';

  try {
    for (const t of TERMINOS) {
      const { ok, data } = await buscarProductos(t);
      if (ok && Array.isArray(data)) {
        data.forEach(p => {
          if (!todosProductos.find(x => x.id_producto === p.id_producto)) todosProductos.push(p);
        });
        if (todosProductos.length >= 40) break;
      }
    }

    const verdes = todosProductos.filter(p => p.color_semaforo === 'verde');
    const otros  = todosProductos.filter(p => p.color_semaforo !== 'verde');

    const btnRec = renderSeccion(contenedorRecomendados, verdes, visiblesRec, 'btn-cargar-rec');
    const btnPop = renderSeccion(contenedorPopulares,    otros,  visiblesPop, 'btn-cargar-pop');

    btnRec?.addEventListener('click', () => {
      visiblesRec += POR_PAGINA;
      renderSeccion(contenedorRecomendados, verdes, visiblesRec, 'btn-cargar-rec')
        ?.addEventListener('click', arguments.callee);
    });

    btnPop?.addEventListener('click', () => {
      visiblesPop += POR_PAGINA;
      renderSeccion(contenedorPopulares, otros, visiblesPop, 'btn-cargar-pop')
        ?.addEventListener('click', arguments.callee);
    });

    if (!verdes.length) contenedorRecomendados.innerHTML = '<p class="text-muted">Sin productos recomendados.</p>';
    if (!otros.length)  contenedorPopulares.innerHTML    = '<p class="text-muted">Sin productos disponibles.</p>';

  } catch (err) {
    console.error(err);
    contenedorRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    contenedorPopulares.innerHTML    = '<p class="text-muted">Error de conexión.</p>';
  } finally {
    if (loader) loader.style.display = 'none';
  }

  // Búsqueda → resultados
  inputBusqueda?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    if (!texto) return;
    window.location.href = `/buscador/resultados/resultados.html?q=${encodeURIComponent(texto)}`;
  });
});
