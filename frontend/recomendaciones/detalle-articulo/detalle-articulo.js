// detalle articulo - logica especifica
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

// Botón volver (icono chevron en el header)
const btnVolverResultados = document.getElementById('btn-volver-resultados');
if (btnVolverResultados) {
  btnVolverResultados.addEventListener('click', () => {
    window.location.href = '../resultados/resultados.html';
  });
}

// Favorito (estrella de header y de título)
const btnFavoritoHeader = document.getElementById('btn-favorito');
const iconStarTitle = document.getElementById('icon-star');

function toggleStar(iconElement) {
  if (!iconElement) return;
  iconElement.classList.toggle('fa-regular');
  iconElement.classList.toggle('fa-solid');
  iconElement.classList.toggle('text-warning');
}

// Click estrella del header
if (btnFavoritoHeader) {
  btnFavoritoHeader.addEventListener('click', () => {
    const icon = btnFavoritoHeader.querySelector('i');
    toggleStar(icon);
    toggleStar(iconStarTitle);
  });
}

// Click estrella junto al título
if (iconStarTitle) {
  iconStarTitle.addEventListener('click', () => {
    toggleStar(iconStarTitle);
    const iconHeader = btnFavoritoHeader ? btnFavoritoHeader.querySelector('i') : null;
    toggleStar(iconHeader);
  });
}

// Botón "Ver alternativas sustentables"
const btnVerAlternativas = document.getElementById('btn-ver-alternativas');
if (btnVerAlternativas) {
  btnVerAlternativas.addEventListener('click', () => {
    // Por ahora, redirige a resultados; ajústalo si tienes otra vista
    window.location.href = '../alternativas/alternativas.html';
  });
}
