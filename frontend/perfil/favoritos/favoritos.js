// favoritos.js — conectado a la BD
import { obtenerFavoritos, eliminarFavorito, estaLogueado } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) {
    window.location.href = '../../auth/login/login.html'; return;
  }

  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  });

  inyectarParticulas();

  // Contenedores de las dos secciones del HTML original
  const contBuscador      = document.getElementById('favoritos-buscador');
  const contRecomendaciones = document.getElementById('favoritos-recomendaciones');
  const filtroModulo      = document.getElementById('filtro-modulo');
  const seccionBuscador   = document.getElementById('seccion-buscador');
  const seccionRecom      = document.getElementById('seccion-recom');

  // Filtro de módulo (mantiene la lógica original)
  filtroModulo?.addEventListener('change', e => {
    const valor = e.target.value;
    if (seccionBuscador) seccionBuscador.style.display = (valor === 'todos' || valor === 'buscador') ? 'block' : 'none';
    if (seccionRecom)    seccionRecom.style.display    = (valor === 'todos' || valor === 'recomendaciones') ? 'block' : 'none';
  });

  await cargarFavoritos();

  // Eliminar con delegación de eventos (igual que el diseño original)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.fav-card__btn-remove');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();

    const id   = btn.getAttribute('data-id');
    const card = btn.closest('.fav-card');

    card?.classList.add('removing');
    setTimeout(async () => {
      const { ok } = await eliminarFavorito(id);
      if (ok) {
        card?.remove();
        mostrarToast('Eliminado de favoritos');
      }
    }, 300);
  });

  async function cargarFavoritos() {
    try {
      const { ok, data } = await obtenerFavoritos();
      if (!ok) { mostrarError(contBuscador); mostrarError(contRecomendaciones); return; }

      // Los favoritos en esta BD son solo de productos (buscador)
      // Si el backend también soporta artículos en favoritos, data vendrá mezclada
      const favsBuscador = data; // todos son productos
      const favsRecom    = [];   // ampliar si el backend lo soporta

      inyectarTarjetas(contBuscador, favsBuscador, '../../buscador/detalle-producto/detalle-producto.html');
      inyectarTarjetas(contRecomendaciones, favsRecom, '../../recomendaciones/detalle-articulo/detalle-articulo.html');

    } catch {
      mostrarError(contBuscador);
    }
  }
});

function inyectarTarjetas(contenedor, lista, rutaBase) {
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (!lista.length) {
    contenedor.innerHTML = `<div class="fav-empty" style="padding:30px"><p style="color:#999;margin:0">No tienes elementos guardados en esta sección.</p></div>`;
    return;
  }

  lista.forEach((item, index) => {
    const color = item.color_semaforo || 'gris';
    const dotColor = { verde:'#BAC423', amarillo:'#FFAC00', rojo:'#FF4A58' }[color] || '#9E9E9E';
    const id = item.id_producto_id || item.id_producto;
    const nombre = item.nombre_producto || item.nombre || 'Producto';
    const precio = item.precio_min ? `$${item.precio_min} – $${item.precio_max}` : '';

    contenedor.innerHTML += `
      <div class="fav-card" style="animation-delay:${index*0.1}s">
        <button class="fav-card__btn-remove" data-id="${id}" title="Quitar de favoritos">
          <i class="fa-regular fa-trash-can"></i>
        </button>
        <a href="${rutaBase}?id=${id}" class="fav-card__link">
          <div class="fav-card__img-wrap">
            <div class="fav-card__dot" style="background:${dotColor}"></div>
          </div>
          <div class="fav-card__info">
            <div class="fav-card__title">${nombre}</div>
            <div class="fav-card__price">${precio}</div>
          </div>
        </a>
      </div>`;
  });
}

function mostrarError(cont) {
  if (cont) cont.innerHTML = `<p style="color:#999;padding:20px;text-align:center">Error al cargar.</p>`;
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

function inyectarParticulas() {
  const colors = ['#FFD460','#BAC423','#FF8C99','#FFAC00'];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 15 + 8;
    p.style.cssText = `width:${size}px;height:${size}px;background:${colors[i%4]};
      border-radius:${Math.random()>.5?'0 50% 50% 50%':'50%'};
      left:${Math.random()*100}%;animation-duration:${Math.random()*6+4}s;animation-delay:${Math.random()*5}s`;
    document.body.appendChild(p);
  }
}