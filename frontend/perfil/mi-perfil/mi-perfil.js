// perfil/mi-perfil.js
import { obtenerPerfil, eliminarCuenta, estaLogueado } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) { window.location.href = '/auth/login/login.html'; return; }

  // Nav
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });
  ['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '/auth/login/login.html';
    });
  });

  // ── Cargar perfil desde la BD ─────────────────────────────
  try {
    const { ok, data } = await obtenerPerfil();
    if (ok) {
      const nombre = data.nombre_completo || data.nombre || data.nombre_usuario || 'Usuario';
      const usuario = data.nombre_usuario || '';

      const elNombre  = document.getElementById('perfil-nombre');
      const elUsuario = document.getElementById('perfil-usuario');
      const elIniciales = document.getElementById('avatar-iniciales');

      if (elNombre)    elNombre.textContent  = nombre;
      if (elUsuario)   elUsuario.textContent = '@' + usuario;
      if (elIniciales) elIniciales.textContent = nombre.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

      // Guardar en localStorage por si otros módulos lo necesitan
      localStorage.setItem('usuario', JSON.stringify(data));
    }
  } catch (err) { console.error('Error cargando perfil:', err); }

  // ── Modal eliminar cuenta ─────────────────────────────────
  const btnAbrir    = document.getElementById('btn-eliminar');
  const modal       = document.getElementById('modal-eliminar');
  const btnCancelar = document.getElementById('btn-cancelar-eliminar');
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
  const textoEl     = document.getElementById('texto-eliminar');
  const loadingEl   = document.getElementById('loading-eliminar');

  document.getElementById('btn-regresar')?.addEventListener('click', irAtras);

  btnAbrir?.addEventListener('click', e => { e.preventDefault(); modal?.classList.add('active'); });
  btnCancelar?.addEventListener('click', () => modal?.classList.remove('active'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

  btnConfirmar?.addEventListener('click', async () => {
    if (btnConfirmar) btnConfirmar.disabled = true;
    textoEl?.classList.add('hidden');
    loadingEl?.classList.remove('hidden');
    if (btnCancelar) btnCancelar.style.pointerEvents = 'none';

    // Usa eliminarCuenta de api.js
    await eliminarCuenta().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/auth/login/login.html';
  });
});

function irAtras() {
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}
