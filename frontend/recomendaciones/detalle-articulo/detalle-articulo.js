// recomendaciones/detalle-articulo.js — conectado a la BD
import { obtenerArticulo, estaLogueado } from '../../assets/js/api.js';

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

  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = '../inicio/inicio.html'; return; }

  const loader   = document.getElementById('loader');
  const contenido = document.getElementById('contenido');

  try {
    const { ok, data } = await obtenerArticulo(id);

    if (!ok) { mostrarError('No se encontró el artículo.'); return; }

    // Título e impacto
    const elNombre  = document.getElementById('nombre-articulo');
    const elImpacto = document.getElementById('impacto-ambiental');
    if (elNombre)  elNombre.textContent  = data.nombre_articulo;
    if (elImpacto) elImpacto.textContent = data.impacto_ambiental;

    // Alternativas
    const listaAlt = document.getElementById('lista-alternativas');
    if (listaAlt) {
      if (data.alternativas?.length) {
        listaAlt.innerHTML = data.alternativas
          .sort((a, b) => (a.precio_min || 0) - (b.precio_min || 0))
          .slice(0, 5)
          .map((a, i) => `
            <div class="alt-card" style="animation-delay:${i*0.1}s">
              <div class="alt-card__icon"><i class="fa-solid fa-seedling"></i></div>
              <div class="alt-card__body">
                <div class="alt-card__nombre">${a.nombre}</div>
                <div class="alt-card__desc">${a.descripcion || ''}</div>
                ${a.precio_min ? `<div class="alt-card__precio">$${a.precio_min} – $${a.precio_max}</div>` : ''}
              </div>
            </div>`).join('');
      } else {
        listaAlt.innerHTML = `<p style="color:#999;padding:20px 0">No hay alternativas registradas.</p>`;
      }
    }

    // Botón ver comparación
    document.getElementById('btn-ver-comparacion')?.addEventListener('click', () => {
      window.location.href = `../alternativas/alternativas.html?id=${id}`;
    });

    loader?.classList.add('hidden');
    contenido?.classList.remove('hidden');

  } catch {
    mostrarError('Error de conexión con el servidor.');
  }
});

function mostrarError(msg) {
  document.getElementById('loader').innerHTML =
    `<div style="text-align:center;padding:40px;color:#999"><i class="fa-solid fa-circle-exclamation" style="font-size:2rem;margin-bottom:12px"></i><br>${msg}</div>`;
}