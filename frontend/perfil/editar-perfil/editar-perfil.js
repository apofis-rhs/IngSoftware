// perfil/editar-perfil.js
import { obtenerPerfil, editarPerfil, estaLogueado } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) { window.location.href = '/auth/login/login.html'; return; }

  // ── BOTONES REGRESAR INTELIGENTES ────────────────────────
  const btnAtrasForm = document.getElementById('btn-regresar');
  const btnAtrasExito = document.getElementById('btn-regresar-exito');
  
  if (btnAtrasForm) btnAtrasForm.addEventListener('click', irAtras);
  if (btnAtrasExito) btnAtrasExito.addEventListener('click', irAtras);

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

  const formView    = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const btnGuardar  = document.getElementById('btnGuardar');
  const divMensaje  = document.getElementById('mensaje');
  const inputNombre  = document.getElementById('nombre');
  const inputUsuario = document.getElementById('usuario');
  const inputCorreo  = document.getElementById('correo');

  // ── Cargar datos actuales desde la BD ────────────────────
  try {
    const { ok, data } = await obtenerPerfil();
    if (ok) {
      if (inputNombre)  inputNombre.value  = data.nombre_completo || data.nombre || '';
      if (inputUsuario) inputUsuario.value = data.nombre_usuario  || '';
      if (inputCorreo)  inputCorreo.value  = data.correo          || '';
    }
  } catch (err) { console.error('Error cargando perfil:', err); }

  // ── Guardar cambios en la BD ──────────────────────────────
  btnGuardar?.addEventListener('click', async e => {
    e.preventDefault();
    if (divMensaje) divMensaje.innerHTML = '';

    if (!inputNombre?.value.trim() || !inputUsuario?.value.trim() || !inputCorreo?.value.trim()) {
      mostrarError('Por favor, completa todos los campos.');
      return;
    }

    const textoOrig = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    btnGuardar.disabled = true;

    try {
      const { ok, data } = await editarPerfil({
        nombre_completo: inputNombre.value.trim(),
        nombre_usuario:  inputUsuario.value.trim(),
        correo:          inputCorreo.value.trim(),
      });

      if (ok) {
        localStorage.setItem('usuario', JSON.stringify(data));
        if (formView)    formView.style.display    = 'none';
        if (successView) successView.style.display = 'flex';
      } else {
        const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Error al guardar.';
        mostrarError(msg);
      }
    } catch { mostrarError('Error de conexión.'); }
    finally  { btnGuardar.innerHTML = textoOrig; btnGuardar.disabled = false; }
  });

  function mostrarError(texto) {
    if (divMensaje) {
      divMensaje.innerHTML = `<div class="alerta alerta--error" style="margin-top:16px">${texto}</div>`;
      setTimeout(() => { if (divMensaje) divMensaje.innerHTML = ''; }, 3000);
    }
  }
});

// ── FUNCIÓN MAESTRA PARA REGRESAR ───────────────────────────────
function irAtras(e) {
  if (e) e.preventDefault();
  
  const prev = document.referrer;
  
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}