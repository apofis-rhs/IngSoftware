// recomendaciones/alternativas.js — conectado a la BD
import { obtenerAlternativasArticulo, estaLogueado } from '../../assets/js/api.js';

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

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = '../inicio/inicio.html'; return; }

  const lista  = document.getElementById('lista-alternativas');
  const loader = document.getElementById('loader');
  const titulo = document.getElementById('titulo-alternativas');

  try {
    const { ok, data } = await obtenerAlternativasArticulo(id);

    loader?.classList.add('hidden');

    if (!ok || !data.length) {
      lista.innerHTML = `<p style="color:#999;text-align:center;padding:40px">Sin alternativas registradas.</p>`;
      return;
    }

    const ordenadas = data
      .sort((a, b) => (a.precio_min || 0) - (b.precio_min || 0))
      .slice(0, 5); // RN-17: máximo 5

    if (titulo) titulo.textContent = `${ordenadas.length} alternativa${ordenadas.length !== 1 ? 's' : ''} encontrada${ordenadas.length !== 1 ? 's' : ''}`;

    lista.innerHTML = ordenadas.map((a, i) => `
      <div class="alt-card" style="animation-delay:${i*0.12}s">
        <div class="alt-card__rank">${i + 1}</div>
        <div class="alt-card__body">
          <div class="alt-card__nombre">${a.nombre}</div>
          ${a.descripcion ? `<div class="alt-card__desc">${a.descripcion}</div>` : ''}
          ${a.precio_min  ? `<div class="alt-card__precio">$${a.precio_min} – $${a.precio_max}</div>` : ''}
        </div>
        <div class="alt-card__badge"><i class="fa-solid fa-leaf"></i> Sustentable</div>
      </div>`).join('');

  } catch {
    loader.innerHTML = `<p style="color:#999;text-align:center;padding:40px">Error de conexión.</p>`;
  }
});