// editar-perfil.js — conectado a la BD
import { obtenerPerfil, editarPerfil, estaLogueado } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) {
    window.location.href = '../../auth/login/login.html'; return;
  }

  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  });

  const formView   = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const btnGuardar = document.getElementById('btnGuardar');
  const divMensaje = document.getElementById('mensaje');
  const inputNombre  = document.getElementById('nombre');
  const inputUsuario = document.getElementById('usuario');
  const inputCorreo  = document.getElementById('correo');

  // ── Cargar datos actuales del perfil ─────────────────────
  try {
    const { ok, data } = await obtenerPerfil();
    if (ok) {
      if (inputNombre)  inputNombre.value  = data.nombre_completo || '';
      if (inputUsuario) inputUsuario.value = data.nombre_usuario  || '';
      if (inputCorreo)  inputCorreo.value  = data.correo          || '';
    }
  } catch (err) {
    console.error('Error al cargar perfil:', err);
  }

  // ── Guardar cambios reales en la BD ──────────────────────
  btnGuardar?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (divMensaje) divMensaje.innerHTML = '';

    const nombre_completo = inputNombre?.value.trim();
    const nombre_usuario  = inputUsuario?.value.trim();
    const correo          = inputCorreo?.value.trim();

    if (!nombre_completo || !nombre_usuario || !correo) {
      mostrarError('Por favor, completa todos los campos.'); return;
    }

    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    btnGuardar.disabled = true;

    const { ok, data } = await editarPerfil({ nombre_completo, nombre_usuario, correo });

    if (ok) {
      localStorage.setItem('usuario', JSON.stringify(data));
      if (formView)    formView.style.display    = 'none';
      if (successView) successView.style.display = 'flex';
    } else {
      const msg = data?.correo?.[0] || data?.nombre_usuario?.[0] || data?.error || 'No se pudo actualizar.';
      mostrarError(msg);
      btnGuardar.innerHTML = textoOriginal;
      btnGuardar.disabled  = false;
    }
  });

  function mostrarError(texto) {
    if (!divMensaje) return;
    divMensaje.innerHTML = `<div class="alerta alerta--error" style="margin-top:16px">${texto}</div>`;
    setTimeout(() => { divMensaje.innerHTML = ''; }, 4000);
  }
});