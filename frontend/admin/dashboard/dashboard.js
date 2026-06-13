// admin: dashboard - logica especifica
document.addEventListener('DOMContentLoaded', () => {

  // ── Protección de ruta: solo admins ───────────────────────
  const token   = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const esAdmin = usuario.rol === 'admin' ||
                  usuario.is_staff === true ||
                  usuario.is_superuser === true;

  if (!token || !esAdmin) {
    // No tiene token o no es admin → regresa al login
    window.location.href = '../../auth/login/login.html';
    return;
  }

  // ── Muestra nombre del admin en la navbar ─────────────────
  const elNombre = document.getElementById('admin-nombre');
  if (elNombre) {
    elNombre.textContent = usuario.nombre_usuario || usuario.username || 'Admin';
  }

  // ── Cerrar sesión ─────────────────────────────────────────
  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
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

  // ── Navbar hamburguesa ────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  if (hamburger && navDrawer) {
    hamburger.addEventListener('click', () => navDrawer.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navDrawer.contains(e.target)) {
        navDrawer.classList.remove('open');
      }
    });
  }

  // ── Carga métricas reales desde el backend ─────────────────
  cargarMetricas();
});

async function cargarMetricas() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    // Buscar con varios términos para estimar totales
    // (cuando el backend tenga /api/admin/metricas/ reemplaza esto)
    const terminos = ['shampoo', 'crema', 'jabon', 'locion', 'gel', 'toalla', 'pasta'];
    let todos = [];

    for (const t of terminos) {
      const res = await fetch(`http://localhost:8000/api/productos/buscar/?q=${t}`, { headers });
      if (res.ok) {
        const data = await res.json();
        data.forEach(p => {
          if (!todos.find(x => x.id_producto === p.id_producto)) todos.push(p);
        });
      }
    }

    if (todos.length > 0) {
      const total    = todos.length;
      const verdes   = todos.filter(p => p.color_semaforo === 'verde').length;
      const rojos    = todos.filter(p => p.color_semaforo === 'rojo').length;
      const sinInfo  = todos.filter(p => p.estado_evaluacion === 'insuficiente').length;

      setMetrica('metric-total',   total);
      setMetrica('metric-verdes',  verdes);
      setMetrica('metric-rojos',   rojos);
      setMetrica('metric-sin-info', sinInfo);
    }
  } catch (err) {
    console.warn('No se pudieron cargar métricas:', err.message);
    // Las métricas hardcodeadas del HTML se quedan como fallback
  }
}

function setMetrica(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

