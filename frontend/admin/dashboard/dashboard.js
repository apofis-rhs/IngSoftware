import { listarProductos } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token   = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const esAdmin = usuario.rol === 'admin' || usuario.is_staff === true || usuario.is_superuser === true;

  if (!token || !esAdmin) {
    window.location.href = '/auth/login/login.html'; return;

  // ✨ NUEVO: Saludo Inteligente por hora ✨
  const greetingEl = document.getElementById('time-greeting');
  if (greetingEl) {
    const hora = new Date().getHours();
    if (hora < 12) {
      greetingEl.textContent = '¡Buenos días!';
    } else if (hora < 19) {
      greetingEl.textContent = '¡Buenas tardes!';
    } else {
      greetingEl.textContent = '¡Buenas noches!';
    }
  }
  }

  const elNombre = document.getElementById('admin-nombre');
  if (elNombre) elNombre.textContent = usuario.nombre_usuario || usuario.username || 'Admin';
  const elNombreMobile = document.getElementById('admin-nombre-mobile');
  if (elNombreMobile) elNombreMobile.textContent = usuario.nombre_usuario || usuario.username || 'Admin';



  ['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '/auth/login/login.html';
    });
  });

  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });

  animarKPIs();
  await cargarMetricas();
});

async function cargarMetricas() {
  try {
    // Una sola llamada al endpoint de admin que trae todos los productos
    const { ok, data } = await listarProductos();

    if (!ok || !Array.isArray(data)) {
      console.warn('No se pudieron cargar métricas');
      return;
    }

    animarNumero('metric-total',     data.length);
    animarNumero('metric-verdes',    data.filter(p => p.color_semaforo === 'verde').length);
    animarNumero('metric-amarillos', data.filter(p => p.color_semaforo === 'amarillo').length);
    animarNumero('metric-rojos',     data.filter(p => p.color_semaforo === 'rojo').length);
    animarNumero('metric-sin-info',  data.filter(p => !p.color_semaforo || p.estado_evaluacion === 'insuficiente').length);

  } catch (err) {
    console.warn('Error métricas:', err.message);
  }
}

function animarNumero(id, final) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!final) { el.textContent = '0'; return; }
  let current = 0;
  const step = Math.ceil(final / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, final);
    el.textContent = current;
    if (current >= final) clearInterval(interval);
  }, 40);
}

function animarKPIs() {
  document.querySelectorAll('.kpi-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + i * 100);
  });
}
