// admin/dashboard.js
import { buscarProductos } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  const token   = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const esAdmin = usuario.rol === 'admin' || usuario.is_staff === true || usuario.is_superuser === true;

  if (!token || !esAdmin) {
    window.location.href = '../../auth/login/login.html'; return;
  }

  const elNombre = document.getElementById('admin-nombre');
  if (elNombre) elNombre.textContent = usuario.nombre_usuario || usuario.username || 'Admin';

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

  await cargarMetricas();
});

async function cargarMetricas() {
  // Usa buscarProductos de api.js en lugar de fetch directo
  const terminos = ['shampoo', 'crema', 'jabon', 'locion', 'gel', 'pasta', 'toalla',
                    'cepillo', 'desodorante', 'protector', 'aceite', 'acondicionador'];
  let todos = [];

  try {
    for (const t of terminos) {
      const { ok, data } = await buscarProductos(t);
      if (ok && Array.isArray(data)) {
        data.forEach(p => {
          if (!todos.find(x => x.id_producto === p.id_producto)) todos.push(p);
        });
      }
      if (todos.length >= 90) break;
    }

    setMetrica('metric-total',    todos.length);
    setMetrica('metric-verdes',   todos.filter(p => p.color_semaforo === 'verde').length);
    setMetrica('metric-amarillos',todos.filter(p => p.color_semaforo === 'amarillo').length);
    setMetrica('metric-rojos',    todos.filter(p => p.color_semaforo === 'rojo').length);
    setMetrica('metric-sin-info', todos.filter(p => p.estado_evaluacion === 'insuficiente').length);

  } catch (err) {
    console.warn('No se pudieron cargar métricas:', err.message);
  }
}

function setMetrica(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}
