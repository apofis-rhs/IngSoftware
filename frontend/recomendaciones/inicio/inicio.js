// recomendaciones/inicio.js — conectado a la BD
import { buscarArticulos, estaLogueado } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', () => {

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

  const inputBuscar = document.getElementById('input-buscar');
  const btnBuscar   = document.getElementById('btn-buscar');
  const loader      = document.getElementById('loader');

  async function buscar() {
    const texto = inputBuscar?.value.trim();
    if (!texto || texto.length < 3) {
      mostrarToast('Escribe al menos 3 caracteres para buscar.'); return;
    }

    if (loader) loader.style.display = 'flex';
    if (btnBuscar) btnBuscar.disabled = true;

    try {
      const { ok, data } = await buscarArticulos(texto);
      if (ok) {
        localStorage.setItem('resultadosArticulos', JSON.stringify(data));
        localStorage.setItem('textoArticulo', texto);
        window.location.href = '../resultados/resultados.html';
      } else {
        mostrarToast('Error al buscar. Intenta de nuevo.');
      }
    } finally {
      if (loader) loader.style.display = 'none';
      if (btnBuscar) btnBuscar.disabled = false;
    }
  }

  btnBuscar?.addEventListener('click', buscar);
  inputBuscar?.addEventListener('keypress', e => { if (e.key === 'Enter') buscar(); });

  function mostrarToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:0.9rem';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
});