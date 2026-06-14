// mi-perfil.js — conectado a la BD
import { obtenerPerfil, eliminarCuenta, estaLogueado } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) {
    window.location.href = '../../auth/login/login.html'; return;
  }

  // ── Navbar: cerrar sesión ─────────────────────────────────
  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  });

  // ── Cargar perfil real desde la BD ───────────────────────
  try {
    const { ok, data } = await obtenerPerfil();
    if (ok) {
      document.getElementById('perfil-nombre').textContent  = data.nombre_completo || data.nombre_usuario;
      document.getElementById('perfil-usuario').textContent = '@' + data.nombre_usuario;

      const iniciales = (data.nombre_completo || data.nombre_usuario || '?')
        .split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
      const avatar = document.getElementById('avatar-iniciales');
      if (avatar) avatar.textContent = iniciales;

      // Guardar en localStorage para otras pantallas
      localStorage.setItem('usuario', JSON.stringify(data));
    }
  } catch (err) {
    console.error('Error al cargar perfil:', err);
  }

  // ── Modal eliminar cuenta ─────────────────────────────────
  const btnAbrirModal  = document.getElementById('btn-eliminar');
  const modalEliminar  = document.getElementById('modal-eliminar');
  const btnCancelar    = document.getElementById('btn-cancelar-eliminar');
  const btnConfirmar   = document.getElementById('btn-confirmar-eliminar');
  const textoEliminar  = document.getElementById('texto-eliminar');
  const loadingEliminar = document.getElementById('loading-eliminar');

  btnAbrirModal?.addEventListener('click', e => {
    e.preventDefault();
    modalEliminar?.classList.add('active');
  });

  btnCancelar?.addEventListener('click', () => modalEliminar?.classList.remove('active'));

  modalEliminar?.addEventListener('click', e => {
    if (e.target === modalEliminar) modalEliminar.classList.remove('active');
  });

  btnConfirmar?.addEventListener('click', async () => {
    if (btnConfirmar) btnConfirmar.disabled = true;
    textoEliminar?.classList.add('hidden');
    loadingEliminar?.classList.remove('hidden');

    const { ok } = await eliminarCuenta();

    if (ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    } else {
      textoEliminar?.classList.remove('hidden');
      loadingEliminar?.classList.add('hidden');
      if (btnConfirmar) btnConfirmar.disabled = false;
      alert('No se pudo eliminar la cuenta. Intenta de nuevo.');
    }
  });
}); 