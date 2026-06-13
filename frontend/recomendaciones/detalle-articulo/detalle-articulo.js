// recomendaciones: detalle-articulo - logica especifica
import { obtenerArticulo, agregarFavorito, eliminarFavorito, logout } from '../../assets/js/api.js';

// ── NAVBAR: hamburguesa + drawer ──────────────────────────────
const hamburger = document.getElementById('hamburger');
const navDrawer  = document.getElementById('nav-drawer');

if (hamburger && navDrawer) {
  hamburger.addEventListener('click', () => navDrawer.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navDrawer.contains(e.target)) {
      navDrawer.classList.remove('open');
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 769) navDrawer.classList.remove('open');
  });
}

// ── Cerrar sesión ─────────────────────────────────────────────
['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  }
});

// ── Lógica principal ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '../../auth/login/login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    mostrarError('No se especificó ID del artículo');
    return;
  }

  await cargarArticulo(id);
  setupEventos(id);
});

async function cargarArticulo(id) {
  try {
    const { ok, data } = await obtenerArticulo(id);

    if (!ok) {
      mostrarError(data?.mensaje || 'Artículo no encontrado');
      return;
    }

    // Nombre
    const elNombre = document.getElementById('nombre-articulo') || document.querySelector('.detalle-header__title');
    if (elNombre) elNombre.textContent = data.nombre_articulo;

    // Precio
    const elPrecio = document.getElementById('precio');
    if (elPrecio) {
      elPrecio.textContent = data.precio_min != null
        ? `$${data.precio_min} - $${data.precio_max}`
        : 'Precio no disponible';
    }

    // Semáforo
    const color = data.color_semaforo || 'gris';
    const elDot = document.getElementById('semaforo-dot');
    if (elDot) elDot.style.background = `var(--color-semaforo-${color})`;

    const elEstado = document.getElementById('estado-evaluacion');
    if (elEstado) {
      const estados = {
        'aprobado': 'Aprobado',
        'precaucion': 'Usar con precaución',
        'no_recomendado': 'No recomendado',
        'insuficiente': 'Datos insuficientes'
      };
      elEstado.textContent = estados[data.estado_evaluacion] || data.estado_evaluacion || '';
    }

    // Descripción / explicación
    const elExplicacion = document.getElementById('explicacion-semaforo') || document.getElementById('descripcion');
    if (elExplicacion) elExplicacion.textContent = data.razon_clasificacion || data.explicacion_semaforo || '';

    // Alternativas (lista previa si el backend las incluye)
    if (data.alternativas && data.alternativas.length) {
      const listaAlt = document.getElementById('lista-alternativas');
      if (listaAlt) {
        listaAlt.innerHTML = data.alternativas.map(alt => `
          <div class="list-item" style="cursor:pointer" onclick="window.location.href='detalle-articulo.html?id=${alt.id_articulo}'">
            <div class="list-item__dot" style="background:var(--color-semaforo-${alt.color_semaforo || 'gris'})"></div>
            <span class="list-item__text">${alt.nombre_articulo}</span>
          </div>
        `).join('');
      }
    }

    // Mostrar contenido, ocultar loader
    const loader    = document.getElementById('loader');
    const contenido = document.getElementById('contenido-articulo') || document.getElementById('contenido-producto');
    if (loader)    loader.classList.add('hidden');
    if (contenido) contenido.classList.remove('hidden');

  } catch (err) {
    console.error('Error cargando artículo:', err);
    mostrarError(`Error de conexión: ${err.message}`);
  }
}

function setupEventos(id) {
  // Volver
  const btnVolver = document.getElementById('btn-volver-resultados');
  if (btnVolver) btnVolver.addEventListener('click', () => window.history.back());

  // Ver alternativas
  const btnVerAlternativas = document.getElementById('btn-ver-alternativas');
  if (btnVerAlternativas) {
    btnVerAlternativas.addEventListener('click', () => {
      window.location.href = `../alternativas/alternativas.html?id=${id}`;
    });
  }

  // Favorito
  let esFavorito = false;
  const btnFavorito  = document.getElementById('btn-favorito');
  const iconStar     = document.getElementById('icon-star');

  function actualizarEstrella(activo) {
    esFavorito = activo;
    [btnFavorito?.querySelector('i'), iconStar].forEach(icon => {
      if (!icon) return;
      icon.classList.toggle('fa-regular', !activo);
      icon.classList.toggle('fa-solid',   activo);
      icon.classList.toggle('text-warning', activo);
    });
  }

  if (btnFavorito) {
    btnFavorito.addEventListener('click', async () => {
      try {
        if (esFavorito) {
          await eliminarFavorito(id);
          actualizarEstrella(false);
        } else {
          await agregarFavorito(id);
          actualizarEstrella(true);
        }
      } catch (err) {
        console.error('Error actualizando favorito:', err);
      }
    });
  }

  if (iconStar) {
    iconStar.addEventListener('click', () => btnFavorito?.click());
  }
}

function mostrarError(mensaje) {
  const loader = document.getElementById('loader');
  if (loader) loader.innerHTML = `<div class="alerta alerta--error">${mensaje}</div>`;
}
