// cambiar-contrasena.js — conectado a la BD
import { cambiarContrasena, estaLogueado } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', () => {

  if (!estaLogueado()) {
    window.location.href = '../../auth/login/login.html'; return;
  }

  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  });

  const formView    = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const btnGuardar  = document.getElementById('btn-guardar');
  const inputActual = document.getElementById('contrasena-actual');
  const inputNueva  = document.getElementById('contrasena-nueva');
  const inputConf   = document.getElementById('contrasena-confirmar');
  const divMsg      = document.getElementById('mensaje');

  // Toggle visibilidad contraseñas
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const inputId = btn.getAttribute('data-target');
      const input   = document.getElementById(inputId);
      if (!input) return;
      const esPassword = input.type === 'password';
      input.type = esPassword ? 'text' : 'password';
      btn.querySelector('i')?.classList.toggle('fa-eye', !esPassword);
      btn.querySelector('i')?.classList.toggle('fa-eye-slash', esPassword);
    });
  });

  btnGuardar?.addEventListener('click', async (e) => {
    e.preventDefault();
    ocultarMensaje();

    const actual = inputActual?.value;
    const nueva  = inputNueva?.value;
    const conf   = inputConf?.value;

    if (!actual || !nueva || !conf) {
      mostrarMensaje('Completa todos los campos.', 'error'); return;
    }
    if (nueva !== conf) {
      mostrarMensaje('Las contraseñas nuevas no coinciden.', 'error'); return;
    }
    if (nueva.length < 8) {
      mostrarMensaje('La nueva contraseña debe tener al menos 8 caracteres.', 'error'); return;
    }
    if (nueva === actual) {
      mostrarMensaje('La nueva contraseña debe ser diferente a la actual.', 'error'); return;
    }

    const textoOrig = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const { ok, data } = await cambiarContrasena(actual, nueva);

    if (ok) {
      if (formView)    formView.style.display    = 'none';
      if (successView) successView.style.display = 'flex';
    } else {
      const msg = data?.error || data?.contrasena_actual?.[0] || 'La contraseña actual es incorrecta.';
      mostrarMensaje(msg, 'error');
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = textoOrig;
    }
  });

  function mostrarMensaje(texto, tipo) {
    if (!divMsg) return;
    divMsg.className = `alerta alerta--${tipo}`;
    divMsg.textContent = texto;
    divMsg.style.display = 'block';
  }
  function ocultarMensaje() {
    if (divMsg) divMsg.style.display = 'none';
  }
});