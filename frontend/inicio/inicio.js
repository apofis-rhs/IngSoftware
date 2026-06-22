document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (token) {
    // ── Hub (usuario logueado) ────────────────────────────
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('hub-section').classList.remove('hidden');
    document.getElementById('navbar-landing').classList.add('hidden');
    document.getElementById('navbar-hub').classList.remove('hidden');

    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const nombre = usuario.nombre || usuario.nombre_usuario || '';
      const greet = document.getElementById('hub-greeting');
      if (greet && nombre) greet.textContent = `¡Hola, ${nombre}!`;
    } catch (_) {}

    const hamburger = document.getElementById('hamburger');
    const navDrawer  = document.getElementById('nav-drawer');
    hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
        navDrawer?.classList.remove('open');
    });
    ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.reload();
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

  } else {
    // ── Landing (sin login) ───────────────────────────────
    document.getElementById('btn-login')?.addEventListener('click', () => {
      window.location.href = '/auth/login/login.html';
    });
    document.getElementById('btn-registro')?.addEventListener('click', () => {
      window.location.href = '/auth/login/login.html?modo=registro';
    });
  }
});
