// recomendaciones: resultados - logica especifica
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

// Lógica simple de filtros (chips Plástico / Metal)
const chips = document.querySelectorAll('.chip');
const resultadoCards = document.querySelectorAll('.resultado-card');
const resultadoCount = document.getElementById('resultado-count');

function actualizarResultados(filtro) {
  let visibles = 0;

  resultadoCards.forEach(card => {
    const tipo = card.getAttribute('data-tipo'); // "plastico" | "metal"
    if (!filtro || filtro === tipo) {
      card.style.display = 'flex';
      visibles++;
    } else {
      card.style.display = 'none';
    }
  });

  if (resultadoCount) {
    resultadoCount.textContent = visibles;
  }
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');

    const filtro = chip.getAttribute('data-filtro'); // "plastico" | "metal"
    actualizarResultados(filtro);
  });
});

// Estado inicial: chip "Plástico" activo ya en el HTML → filtramos plástico
actualizarResultados('plastico');
