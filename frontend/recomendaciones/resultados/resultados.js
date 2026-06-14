// recomendaciones/resultados.js — conectado a la BD
import { buscarArticulos, estaLogueado } from '../../assets/js/api.js';

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

  const lista        = document.getElementById('lista-resultados');
  const loader       = document.getElementById('loader');
  const tituloTexto  = document.getElementById('texto-busqueda');
  const sinResultados = document.getElementById('sin-resultados');

  const q = new URLSearchParams(window.location.search).get('q')
         || localStorage.getItem('textoArticulo') || '';

  if (tituloTexto) tituloTexto.textContent = q ? `"${q}"` : '';

  let data = JSON.parse(localStorage.getItem('resultadosArticulos') || 'null');

  if (!data && q) {
    const res = await buscarArticulos(q);
    data = res.ok ? res.data : [];
  }
  data = data || [];

  loader?.classList.add('hidden');

  if (!data.length) {
    sinResultados?.classList.remove('hidden');
    return;
  }

  lista.innerHTML = data.map((a, i) => `
    <div class="resultado-card" style="animation-delay:${i*0.08}s">
      <a href="../detalle-articulo/detalle-articulo.html?id=${a.id_articulo}" class="resultado-card__link">
        <div class="resultado-card__icono">
          <i class="fa-solid fa-leaf"></i>
        </div>
        <div class="resultado-card__info">
          <div class="resultado-card__nombre">${a.nombre_articulo}</div>
          <div class="resultado-card__sub">Ver alternativas sustentables</div>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
      </a>
    </div>`).join('');
});