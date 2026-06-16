import { buscarProductosFiltrado, listarCategorias } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

const CAT_COLORES = [
  '#BAC423','#FFAC00','#FF8C99','#4FC3F7','#CE93D8','#80CBC4','#FFCC80','#EF9A9A'
];

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
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

  // Ocultar "Inicio" en navbar si ya está logueado (ya estamos dentro del sistema)
  document.querySelectorAll('a[href="/inicio/inicio.html"], a[href="../../inicio/inicio.html"]').forEach(a => {
    a.style.display = 'none';
  });

  const inputBusqueda          = document.getElementById('input-busqueda');
  const contenedorRecomendados = document.getElementById('recomendados');
  const contenedorPopulares    = document.getElementById('populares');
  const loader                 = document.getElementById('loader');
  const secCategorias          = document.getElementById('barra-categorias');
  const secResultadosVivos     = document.getElementById('resultados-vivos');

  const POR_PAGINA = 6;
  let todosProductos = [];
  let categorias     = [];
  let catSeleccionada = null;
  let ordenActual    = 'nombre';
  let visiblesRec = POR_PAGINA;
  let visiblesPop = POR_PAGINA;
  let debounceTimer;

  // ── Cargar categorías ─────────────────────────────────
  try {
    const { ok, data } = await listarCategorias();
    if (ok && data.length) {
      categorias = data;
      renderCategorias();
    }
  } catch(_) {}

  function renderCategorias() {
    if (!secCategorias) return;
    secCategorias.innerHTML = `
      <div class="cat-scroll">
        <button class="cat-chip cat-chip--active" data-cat="">Todas</button>
        ${categorias.map((c, i) =>
          `<button class="cat-chip" data-cat="${c.id_categoria}"
            style="--cat-color:${CAT_COLORES[i % CAT_COLORES.length]}">${c.nombre_categoria}</button>`
        ).join('')}
      </div>
      <div class="orden-select-wrap">
        <select id="orden-select" class="orden-select">
          <option value="nombre">A-Z</option>
          <option value="precio_asc">Precio ↑</option>
          <option value="precio_desc">Precio ↓</option>
        </select>
      </div>`;

    secCategorias.querySelectorAll('.cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        secCategorias.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('cat-chip--active'));
        btn.classList.add('cat-chip--active');
        catSeleccionada = btn.dataset.cat || null;
        cargarPorFiltro();
      });
    });

    document.getElementById('orden-select')?.addEventListener('change', e => {
      ordenActual = e.target.value;
      cargarPorFiltro();
    });
  }

  // ── Función card ──────────────────────────────────────
  function crearCard(producto, catNombre) {
    const color  = producto.estado_evaluacion === 'insuficiente' ? 'gris' : (producto.color_semaforo || 'gris');
    const imgSrc = getRutaImagen(producto);
    const precio = producto.precio_min != null ? `$${producto.precio_min} – $${producto.precio_max}` : '';
    const catIdx = categorias.findIndex(c => String(c.id_categoria) === String(catSeleccionada));
    const catColor = catNombre ? (CAT_COLORES[catIdx >= 0 ? catIdx : 0]) : '';

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
        ${precio ? `<p class="product-card-grid__price">${precio}</p>` : ''}
        ${catNombre ? `<span class="cat-badge" style="background:${catColor}20;color:${catColor};border:1px solid ${catColor}">${catNombre}</span>` : ''}
      </div>`;
    card.addEventListener('click', () => {
      window.location.href = `/buscador/detalle-producto/detalle-producto.html?id=${producto.id_producto}`;
    });
    return card;
  }

  function renderSeccion(contenedor, lista, visibles, btnId) {
    contenedor.innerHTML = '';
    lista.slice(0, visibles).forEach(p => {
      const catNombre = categorias.find(c => String(c.id_categoria) === String(p.id_categoria_display))?.nombre_categoria || '';
      contenedor.appendChild(crearCard(p, catNombre));
    });
    document.getElementById(btnId)?.remove();
    if (lista.length > visibles) {
      const btn = document.createElement('button');
      btn.id = btnId;
      btn.className = 'btn-cargar-mas';
      btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Cargar más (${lista.length - visibles} restantes)`;
      btn.addEventListener('click', () => {
        const nuevos = visibles + POR_PAGINA;
        renderSeccion(contenedor, lista, nuevos, btnId);
      });
      contenedor.after(btn);
    }
  }

  // ── Carga por filtro ──────────────────────────────────
  async function cargarPorFiltro(q = '') {
    if (loader) loader.style.display = 'block';
    if (contenedorRecomendados) contenedorRecomendados.innerHTML = '';
    if (contenedorPopulares)    contenedorPopulares.innerHTML    = '';

    try {
      const { ok, data } = await buscarProductosFiltrado(q, {
        categoria: catSeleccionada || '',
        orden:     ordenActual,
      });

      if (!ok || !Array.isArray(data)) throw new Error('Sin datos');
      todosProductos = data;

      // Recomendados: solo verdes
      const verdes = data.filter(p => p.color_semaforo === 'verde');
      // Populares: no verdes (o todos si no hay verdes)
      const otros  = data.filter(p => p.color_semaforo !== 'verde');

      visiblesRec = POR_PAGINA;
      visiblesPop = POR_PAGINA;

      if (verdes.length) {
        renderSeccion(contenedorRecomendados, verdes, visiblesRec, 'btn-cargar-rec');
      } else {
        contenedorRecomendados.innerHTML = '<p class="text-muted">Sin recomendados en esta categoría.</p>';
      }

      if (otros.length) {
        renderSeccion(contenedorPopulares, otros, visiblesPop, 'btn-cargar-pop');
      } else if (verdes.length > 0) {
        contenedorPopulares.innerHTML = '<p class="text-muted">Todos los productos son recomendados ✓</p>';
      } else {
        contenedorPopulares.innerHTML = '<p class="text-muted">Sin productos disponibles.</p>';
      }

    } catch (err) {
      if (contenedorRecomendados) contenedorRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    } finally {
      if (loader) loader.style.display = 'none';
    }
  }

  // Carga inicial sin filtro
  if (loader) loader.style.display = 'block';
  await cargarPorFiltro();

  // ── Búsqueda en tiempo real (mínimo 3 chars) ──────────
  let resultadosVivosDiv = secResultadosVivos;

  inputBusqueda?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const texto = inputBusqueda.value.trim();

    if (texto.length === 0) {
      if (resultadosVivosDiv) resultadosVivosDiv.innerHTML = '';
      cargarPorFiltro();
      return;
    }
    if (texto.length < 3) return; // mínimo 3 chars

    debounceTimer = setTimeout(async () => {
      try {
        const { ok, data } = await buscarProductosFiltrado(texto, {
          categoria: catSeleccionada || '',
          orden: ordenActual,
        });
        if (!ok || !data.length) {
          if (resultadosVivosDiv) resultadosVivosDiv.innerHTML = `<p class="text-muted">Sin resultados para "<strong>${texto}</strong>"</p>`;
          return;
        }

        // Mostrar sugerencias inline
        if (resultadosVivosDiv) {
          resultadosVivosDiv.innerHTML = data.slice(0, 8).map(p => {
            const color = p.color_semaforo || 'gris';
            const img   = getRutaImagen(p);
            return `
              <div class="sugerencia-item" data-id="${p.id_producto}" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:var(--radius-md);transition:background 0.15s">
                <img src="${img}" style="width:36px;height:36px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0" onerror="this.src='/assets/images/placeholder.svg'">
                <div class="semaforo-dot" style="width:10px;height:10px;border-radius:50%;background:var(--color-semaforo-${color});flex-shrink:0"></div>
                <span style="font-size:var(--text-base);flex:1">${p.nombre_producto}</span>
                <i class="fa-solid fa-arrow-right" style="color:var(--color-text-muted);font-size:0.8rem"></i>
              </div>`;
          }).join('');

          resultadosVivosDiv.querySelectorAll('.sugerencia-item').forEach(el => {
            el.addEventListener('mouseenter', () => el.style.background = 'var(--color-bg-page)');
            el.addEventListener('mouseleave', () => el.style.background = '');
            el.addEventListener('click', () => {
              window.location.href = `/buscador/detalle-producto/detalle-producto.html?id=${el.dataset.id}`;
            });
          });
        }

        // También actualizar la cuadrícula principal
        const verdes = data.filter(p => p.color_semaforo === 'verde');
        const otros  = data.filter(p => p.color_semaforo !== 'verde');
        if (contenedorRecomendados) { contenedorRecomendados.innerHTML = ''; verdes.forEach(p => contenedorRecomendados.appendChild(crearCard(p, ''))); }
        if (contenedorPopulares)    { contenedorPopulares.innerHTML = ''; otros.forEach(p => contenedorPopulares.appendChild(crearCard(p, ''))); }

      } catch(_) {}
    }, 350); // debounce 350ms
  });

  // Enter → página de resultados
  inputBusqueda?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    if (!texto) return;
    window.location.href = `/buscador/resultados/resultados.html?q=${encodeURIComponent(texto)}`;
  });

  // Cerrar sugerencias al hacer click fuera
  document.addEventListener('click', e => {
    if (!inputBusqueda?.contains(e.target) && !resultadosVivosDiv?.contains(e.target)) {
      if (resultadosVivosDiv) resultadosVivosDiv.innerHTML = '';
    }
  });
});
