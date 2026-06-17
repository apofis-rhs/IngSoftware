import { listarCategorias, listarSubcategorias, buscarProductosFiltrado } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

const CAT_COLORES  = ['#FFD460','#BAC423','#FF8C99','#4FC3F7','#FFAC00','#CE93D8','#80CBC4','#EF9A9A'];
const SUBCAT_COLOR = '#f5f5f5'; // neutro para subcategorías

function getCatEmoji(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('piel'))                       return '🌸';
  if (n.includes('capilar'))                    return '💆';
  if (n.includes('corporal') || n.includes('baño')) return '🛁';
  if (n.includes('higiene') && n.includes('bucal')) return '🦷';
  if (n.includes('depila') || n.includes('afeit')) return '✨';
  if (n.includes('ínti') || n.includes('inti')) return '🌺';
  return '🌿';
}

function getSubcatEmoji(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('shampoo'))           return '🧴';
  if (n.includes('acondicion'))        return '💧';
  if (n.includes('mascarilla'))        return '💆';
  if (n.includes('jabón') || n.includes('jabon')) return '🧼';
  if (n.includes('crema') || n.includes('suero')) return '✨';
  if (n.includes('limpiador'))         return '🧽';
  if (n.includes('solar') || n.includes('protector')) return '☀️';
  if (n.includes('desmaquill'))        return '🪞';
  if (n.includes('desodor'))           return '💨';
  if (n.includes('exfoli'))            return '🫧';
  if (n.includes('loción') || n.includes('locion')) return '🧴';
  if (n.includes('pasta') || n.includes('dental')) return '🦷';
  if (n.includes('enjuague'))          return '🫧';
  if (n.includes('cepillo'))           return '🪥';
  if (n.includes('hilo'))              return '🧵';
  if (n.includes('lengua'))            return '👅';
  if (n.includes('rasur') || n.includes('rastrill')) return '🪒';
  if (n.includes('espuma') || n.includes('afeit'))    return '🫧';
  if (n.includes('gel'))               return '💧';
  if (n.includes('toalla'))            return '🧻';
  if (n.includes('tampón') || n.includes('tampon'))   return '🌸';
  if (n.includes('copa'))              return '🌺';
  if (n.includes('íntim') || n.includes('intim'))     return '🌺';
  if (n.includes('aceite'))            return '🫙';
  return '📦';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  const hamburger     = document.getElementById('hamburger');
  const navDrawer      = document.getElementById('nav-drawer');
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

  const inputBusqueda    = document.getElementById('input-busqueda');
  const resultadosVivos  = document.getElementById('resultados-vivos');
  const gridCategorias   = document.getElementById('grid-categorias');
  const secCategorias    = document.getElementById('sec-categorias');
  const secSubcategorias = document.getElementById('sec-subcategorias');
  const gridSubcategorias = document.getElementById('grid-subcategorias');
  const titSeccion       = document.getElementById('tit-seccion');
  const btnVolver        = document.getElementById('btn-volver');

  let todasCats   = [];
  let todasSubcats = [];
  let catActiva    = null;  // { id_categoria, nombre_categoria }
  let debounceTimer;

  // ── Cargar categorías + subcategorías en paralelo ─────
  // ── Cargar categorías + subcategorías en paralelo ─────
  try {
    const [catsRes, subcatsRes] = await Promise.all([
      listarCategorias(),
      listarSubcategorias(),
    ]);

    if (catsRes.ok && catsRes.data.length) {
      // FILTRO: Ignorar las categorías de "Herramientas"
      todasCats = catsRes.data.filter(cat => 
        !cat.nombre_categoria.toLowerCase().includes('herramientas')
      );
      renderCategorias();
    } else {
      gridCategorias.innerHTML = '<p class="text-muted">Sin categorías disponibles.</p>';
    }

    if (subcatsRes.ok && subcatsRes.data.length) {
      todasSubcats = subcatsRes.data;
    }
  } catch (_) {
    gridCategorias.innerHTML = '<p class="text-muted">Error de conexión.</p>';
  }

  // ── Render: vista de categorías ───────────────────────
  function renderCategorias() {
    gridCategorias.innerHTML = todasCats.map((cat, i) => {
      const color = CAT_COLORES[i % CAT_COLORES.length];
      const emoji = getCatEmoji(cat.nombre_categoria);
      return `
        <button class="cat-card fade-in-up" data-cat-id="${cat.id_categoria}"
                style="--cat-color:${color};animation-delay:${i * 0.07}s">
          <span class="cat-card__emoji" aria-hidden="true">${emoji}</span>
          <span class="cat-card__name">${cat.nombre_categoria}</span>
          <span class="cat-card__arrow"><i class="fa-solid fa-chevron-right"></i></span>
        </button>`;
    }).join('');

    gridCategorias.querySelectorAll('.cat-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = Number(btn.dataset.catId);
        catActiva = todasCats.find(c => c.id_categoria === catId);
        mostrarSubcategorias();
      });
    });
  }

  // ── Render: vista de subcategorías ───────────────────
  function mostrarSubcategorias() {
    const subcats = todasSubcats.filter(s => s.id_categoria === catActiva.id_categoria);

    // Actualizar cabecera
    titSeccion.textContent = catActiva.nombre_categoria;
    btnVolver.classList.remove('hidden');
    if (inputBusqueda) {
      inputBusqueda.placeholder = `Buscar en ${catActiva.nombre_categoria}...`;
    }

    // Cambiar vistas
    secCategorias.classList.add('hidden');
    secSubcategorias.classList.remove('hidden');

    if (!subcats.length) {
      gridSubcategorias.innerHTML = '<p class="text-muted">Sin subcategorías disponibles.</p>';
      return;
    }

    gridSubcategorias.innerHTML = subcats.map((sub, i) => {
      const emoji = getSubcatEmoji(sub.nombre_subcategoria);
      const catIdx = todasCats.findIndex(c => c.id_categoria === catActiva.id_categoria);
      const color  = CAT_COLORES[catIdx % CAT_COLORES.length];
      return `
        <button class="cat-card subcat-card fade-in-up"
                data-subcat-id="${sub.id_subcategoria}"
                data-subcat-nombre="${sub.nombre_subcategoria}"
                style="--cat-color:${color};animation-delay:${i * 0.07}s">
          <span class="cat-card__emoji" aria-hidden="true">${emoji}</span>
          <span class="cat-card__name">${sub.nombre_subcategoria}</span>
        </button>`;
    }).join('');

    gridSubcategorias.querySelectorAll('.subcat-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const params = new URLSearchParams({
          categoria:    catActiva.id_categoria,
          cat_nombre:   catActiva.nombre_categoria,
          subcategoria: btn.dataset.subcatId,
          sub_nombre:   btn.dataset.subcatNombre,
        });
        window.location.href = `/buscador/resultados/resultados.html?${params}`;
      });
    });
  }

  // ── Botón volver a categorías ─────────────────────────
  btnVolver?.addEventListener('click', () => {
    catActiva = null;
    titSeccion.textContent = 'Explorar por categoría';
    btnVolver.classList.add('hidden');
    if (inputBusqueda) inputBusqueda.placeholder = 'Buscar producto o marca...';
    secSubcategorias.classList.add('hidden');
    secCategorias.classList.remove('hidden');
    resultadosVivos.innerHTML = '';
  });

  // ── Búsqueda en tiempo real ───────────────────────────
  inputBusqueda?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const texto = inputBusqueda.value.trim();
    if (!texto) { resultadosVivos.innerHTML = ''; return; }
    if (texto.length < 2) return;

    debounceTimer = setTimeout(async () => {
      try {
        const opciones = catActiva
          ? { categoria: catActiva.id_categoria }
          : {};
        const { ok, data } = await buscarProductosFiltrado(texto, opciones);
        if (!ok || !data.length) {
          resultadosVivos.innerHTML = `<p class="sug-vacio">Sin resultados para "<strong>${texto}</strong>"</p>`;
          return;
        }
        resultadosVivos.innerHTML = data.slice(0, 8).map(p => {
          const color = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
          const img   = getRutaImagen(p);
          return `
            <div class="sugerencia-item" data-id="${p.id_producto}">
              <img src="${img}" alt="${p.nombre_producto}"
                   style="width:36px;height:36px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0"
                   onerror="this.src='/assets/images/placeholder.svg'">
              <span class="sug-dot" style="background:var(--color-semaforo-${color})"></span>
              <span style="flex:1;font-size:var(--text-base)">${p.nombre_producto}</span>
              <i class="fa-solid fa-arrow-right" style="color:var(--color-text-muted);font-size:.8rem"></i>
            </div>`;
        }).join('');
        resultadosVivos.querySelectorAll('.sugerencia-item').forEach(el => {
          el.addEventListener('mouseenter', () => el.style.background = 'var(--color-bg-page)');
          el.addEventListener('mouseleave', () => el.style.background = '');
          el.addEventListener('click', () => {
            window.location.href = `/buscador/detalle-producto/detalle-producto.html?id=${el.dataset.id}`;
          });
        });
      } catch (_) {}
    }, 320);
  });

  // Enter → página de resultados
  inputBusqueda?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    if (!texto) return;
    const p = new URLSearchParams({ q: texto });
    if (catActiva) p.set('categoria', catActiva.id_categoria);
    window.location.href = `/buscador/resultados/resultados.html?${p}`;
  });

  document.addEventListener('click', e => {
    if (!inputBusqueda?.contains(e.target) && !resultadosVivos?.contains(e.target))
      resultadosVivos.innerHTML = '';
  });

  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);
});

function irAtras() {
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}
