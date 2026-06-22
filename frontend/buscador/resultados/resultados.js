import { buscarProductosFiltrado, listarSubcategorias } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

const POR_PAGINA = 15;
let todosResultados     = [];
let visibles            = POR_PAGINA;
let todasSubcats        = [];
let subcatsSeleccionadas = new Set(); // IDs seleccionadas (multi-select)

const urlParams  = new URLSearchParams(window.location.search);
const catActual  = urlParams.get('categoria')  || '';
const catNombre  = urlParams.get('cat_nombre') || '';
const qInicial   = urlParams.get('q')          || '';

// Pre-seleccionar subcat si viene en la URL
const subcatInicial = urlParams.get('subcategoria') || '';
if (subcatInicial) subcatsSeleccionadas.add(String(subcatInicial));

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

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

  const inputBusqueda    = document.getElementById('input-busqueda');
  const listaResultados  = document.getElementById('lista-resultados');
  const tituloResultados = document.getElementById('titulo-resultados');
  const filtrosContenedor = document.getElementById('filtros-activos');
  const btnRegresar = document.getElementById('btn-regresar');

  // Conectar botón regresar
  if (btnRegresar) {
    btnRegresar.addEventListener('click', irAtras);
  }

  let qActual = qInicial;
  if (inputBusqueda) inputBusqueda.value = qActual;

  const [, subcatsRes] = await Promise.all([
    ejecutarBusqueda(),
    listarSubcategorias().catch(() => ({ ok: false, data: [] })),
  ]);

  if (subcatsRes.ok) todasSubcats = subcatsRes.data;
  renderFiltros();

  function renderFiltros() {
    if (!filtrosContenedor) return;
    const subcatsDeCategoria = todasSubcats.filter(s => String(s.id_categoria) === String(catActual));
    let html = '';

    if (catNombre) {
      html += `
        <div class="filtros-fila">
          <span class="filtro-chip filtro-chip--cat">
            <i class="fa-solid fa-tag"></i> ${catNombre}
            <button class="filtro-chip__x" id="btn-cambiar-cat" title="Volver a categorías">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </span>
        </div>`;
    }

    if (subcatsDeCategoria.length) {
      const pills = subcatsDeCategoria.map(s => {
        const activa = subcatsSeleccionadas.has(String(s.id_subcategoria));
        return `
          <button class="subcat-pill ${activa ? 'subcat-pill--active' : ''}" data-id="${s.id_subcategoria}">
            ${s.nombre_subcategoria}
          </button>`;
      }).join('');

      html += `
        <div class="filtros-fila filtros-fila--subcats">
          <span class="filtros-label">Subcategorías:</span>
          <div class="subcat-pills-row">${pills}</div>
        </div>`;
    }

    filtrosContenedor.innerHTML = html;

    filtrosContenedor.querySelector('#btn-cambiar-cat')?.addEventListener('click', () => {
      window.location.href = '/buscador/inicio/inicio.html';
    });

    filtrosContenedor.querySelectorAll('.subcat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = String(btn.dataset.id);
        if (subcatsSeleccionadas.has(id)) subcatsSeleccionadas.delete(id);
        else subcatsSeleccionadas.add(id);
        
        btn.classList.toggle('subcat-pill--active', subcatsSeleccionadas.has(id));
        qActual = '';
        if (inputBusqueda) inputBusqueda.value = '';
        visibles = POR_PAGINA;
        ejecutarBusqueda();
      });
    });
  }

  async function ejecutarBusqueda() {
    if (listaResultados) listaResultados.innerHTML = '<p class="text-muted text-center">Buscando...</p>';
    document.getElementById('btn-cargar-resultados')?.remove();

    try {
      const opcs = subcatsSeleccionadas.size ? { subcategorias: [...subcatsSeleccionadas] } : { categoria: catActual };
      const { ok, data } = await buscarProductosFiltrado(qActual, opcs);

      if (!ok || !data?.length) {
        if (tituloResultados) tituloResultados.textContent = 'Resultados (0)';
        if (listaResultados) listaResultados.innerHTML = `<div class="alerta alerta--warning">No encontramos resultados.</div>`;
        return;
      }

      todosResultados = data;
      visibles = POR_PAGINA;
      if (tituloResultados) tituloResultados.textContent = `Resultados (${data.length})`;
      renderResultados();
    } catch {
      if (listaResultados) listaResultados.innerHTML = '<div class="alerta alerta--error">Error de conexión</div>';
    }
  }

  function renderResultados() {
    if (!listaResultados) return;
    const slice = todosResultados.slice(0, visibles);

    listaResultados.innerHTML = slice.map(p => {
      const color = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
      const imgSrc = getRutaImagen(p);
      const precio = p.precio_min != null ? `$${p.precio_min} – $${p.precio_max}` : 'Precio no disponible';

      return `
        <div class="resultado-card-modern fade-in-up" data-id="${p.id_producto}">
          <div class="resultado-card__imagen">
             <img src="${imgSrc}" alt="${p.nombre_producto}" onerror="this.src='/assets/img/placeholder-product.png'">
          </div>
          <div class="resultado-card__info">
            <h3 class="resultado-card__titulo">${p.nombre_producto}</h3>
            <div class="resultado-card__detalles">
                <span class="resultado-card__etiqueta text-${color}">
                    <span class="resultado-card__punto bg-${color}"></span> Semáforo ${color.charAt(0).toUpperCase() + color.slice(1)}
                </span>
                <span class="resultado-card__precio">${precio}</span>
            </div>
          </div>
          <div class="resultado-card__flecha">
            <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>`;
    }).join('');

    listaResultados.querySelectorAll('.resultado-card-modern').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `/buscador/detalle-producto/detalle-producto.html?id=${el.dataset.id}`;
      });
    });

    document.getElementById('btn-cargar-resultados')?.remove();
    if (todosResultados.length > visibles) {
      const btn = document.createElement('button');
      btn.id = 'btn-cargar-resultados';
      btn.className = 'btn-cargar-mas';
      btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Cargar más`;
      btn.addEventListener('click', () => { visibles += POR_PAGINA; renderResultados(); });
      listaResultados.after(btn);
    }
  }

  inputBusqueda?.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return;
    qActual = inputBusqueda.value.trim();
    visibles = POR_PAGINA;
    ejecutarBusqueda();
  });
});

// ── FUNCIÓN MAESTRA ───────────────────────────────
function irAtras(e) {
  if (e) e.preventDefault();
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}