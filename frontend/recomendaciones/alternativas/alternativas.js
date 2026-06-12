// recomendaciones: alternativas - logica especifica
// NAVBAR: hamburguesa + drawer
const hamburger = document.getElementById('hamburger');
const navDrawer = document.getElementById('nav-drawer');

if (hamburger && navDrawer) {
  hamburger.addEventListener('click', () => {
    navDrawer.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navDrawer.contains(e.target)) {
      navDrawer.classList.remove('open');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 769) {
      navDrawer.classList.remove('open');
    }
  });
}

// Cerrar sesión (desktop + móvil)
['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach((id) => {
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

// Botón "Ver Comparaciones"
const btnVerComparaciones = document.getElementById('btn-ver-comparaciones');
if (btnVerComparaciones) {
  btnVerComparaciones.addEventListener('click', () => {
    // Ajusta esta ruta si tu pantalla de comparaciones tiene otro nombre o ubicación
    window.location.href = '../comparaciones/comparaciones.html';
  });
}
