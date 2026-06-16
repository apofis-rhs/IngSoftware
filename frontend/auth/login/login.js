import { login, registro, loginAdmin } from '/assets/js/api.js';

// ── SLIDER ────────────────────────────────────────────────
const contenedor     = document.querySelector('.contenedor__login-register');
const cajaTrLogin    = document.querySelector('.caja__trasera-login');
const cajaTrRegister = document.querySelector('.caja__trasera-register');

function limpiarFormulario(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('input').forEach(i => {
    i.value = '';
    i.classList.remove('input--error', 'input--ok');
  });
  form.querySelectorAll('.form-error').forEach(e => e.classList.add('hidden'));
  form.querySelectorAll('.alerta').forEach(e => e.classList.add('hidden'));
  const check = form.querySelector('#check-pass');
  if (check) check.classList.add('hidden');
}

function register() {
  limpiarFormulario('form-login');
  contenedor?.classList.add('is-register');
  if (window.innerWidth > 850) {
    contenedor.style.left        = '440px';
    cajaTrRegister.style.opacity = '0';
    cajaTrLogin.style.opacity    = '1';
  } else {
    cajaTrRegister.style.display = 'none';
    cajaTrLogin.style.display    = 'block';
    cajaTrLogin.style.opacity    = '1';
  }
}

function iniciarSesion() {
  limpiarFormulario('form-register');
  contenedor?.classList.remove('is-register');
  if (window.innerWidth > 850) {
    contenedor.style.left        = '10px';
    cajaTrRegister.style.opacity = '1';
    cajaTrLogin.style.opacity    = '0';
  } else {
    cajaTrRegister.style.display = 'block';
    cajaTrLogin.style.display    = 'none';
  }
}

function anchoPagina() {
  if (window.innerWidth > 850) {
    cajaTrRegister.style.display = 'block';
    cajaTrLogin.style.display    = 'block';
  } else {
    cajaTrRegister.style.display = 'block';
    cajaTrRegister.style.opacity = '1';
    cajaTrLogin.style.display    = 'none';
  }
}

document.getElementById('btn-mostrar-registro')?.addEventListener('click', register);
document.getElementById('btn-mostrar-login')?.addEventListener('click', iniciarSesion);
window.addEventListener('resize', anchoPagina);
anchoPagina();

const params = new URLSearchParams(window.location.search);
if (params.get('modo') === 'registro') register();
contenedor?.classList.add('listo');

// ── Ojo contraseña ─────────────────────────────────────
document.querySelectorAll('.btn-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const esPassword = input.type === 'password';
    input.type = esPassword ? 'text' : 'password';
    btn.querySelector('i').className = esPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });
});

// ── Palomita confirmación contraseña ──────────────────
const inputPass1 = document.getElementById('reg-contrasena');
const inputPass2 = document.getElementById('reg-contrasena2');
const checkPass  = document.getElementById('check-pass');

function verificarCoincidencia() {
  if (!inputPass1 || !inputPass2 || !checkPass) return;
  const v1 = inputPass1.value;
  const v2 = inputPass2.value;
  if (v2.length === 0) { checkPass.classList.add('hidden'); return; }
  if (v1 === v2 && v2.length >= 8) {
    checkPass.classList.remove('hidden');
    inputPass2.classList.remove('input--error');
    inputPass2.classList.add('input--ok');
  } else {
    checkPass.classList.add('hidden');
    inputPass2.classList.remove('input--ok');
    if (v2.length > 0) inputPass2.classList.add('input--error');
  }
}
inputPass1?.addEventListener('input', verificarCoincidencia);
inputPass2?.addEventListener('input', verificarCoincidencia);

// ── Ripple ────────────────────────────────────────────
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const s = Math.max(btn.offsetWidth, btn.offsetHeight);
    r.style.cssText = `width:${s}px;height:${s}px;left:${e.offsetX-s/2}px;top:${e.offsetY-s/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

function shakeError() {
  contenedor?.classList.add('shake');
  setTimeout(() => contenedor?.classList.remove('shake'), 400);
}

// ── Modal términos ─────────────────────────────────────
const TERMINOS_TEXTO = `
<p>Al registrarte en LUMIKA aceptas usar la plataforma únicamente para consultar información sobre productos de cuidado personal y sus alternativas sustentables.</p>
<p style="margin-top:12px">Queda prohibido el uso de la plataforma para fines comerciales, scraping de datos o cualquier actividad que atente contra su funcionamiento.</p>
<p style="margin-top:12px">LUMIKA se reserva el derecho de suspender cuentas que incumplan estos términos.</p>`;

const PRIVACIDAD_TEXTO = `
<p>LUMIKA recopila únicamente los datos necesarios para tu experiencia: nombre, correo y usuario.</p>
<p style="margin-top:12px">Tus datos <strong>no son vendidos</strong> a terceros. Se usan exclusivamente para personalizar tus búsquedas, recomendaciones y favoritos.</p>
<p style="margin-top:12px">Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento desde tu perfil.</p>`;

const modalTerminos   = document.getElementById('modal-terminos');
const modalTitulo     = document.getElementById('modal-terminos-titulo');
const modalContenido  = document.getElementById('modal-terminos-contenido');

document.getElementById('link-terminos')?.addEventListener('click', e => {
  e.preventDefault();
  modalTitulo.textContent = 'Términos de uso';
  modalContenido.innerHTML = TERMINOS_TEXTO;
  modalTerminos.classList.add('open');
});
document.getElementById('link-privacidad')?.addEventListener('click', e => {
  e.preventDefault();
  modalTitulo.textContent = 'Aviso de privacidad';
  modalContenido.innerHTML = PRIVACIDAD_TEXTO;
  modalTerminos.classList.add('open');
});
document.getElementById('cerrar-modal-terminos')?.addEventListener('click', () => {
  modalTerminos.classList.remove('open');
});
modalTerminos?.addEventListener('click', e => {
  if (e.target === modalTerminos) modalTerminos.classList.remove('open');
});

// ── LOGIN ─────────────────────────────────────────────
const inputUsuario    = document.getElementById('usuario');
const inputContrasena = document.getElementById('contrasena');
const btnLogin        = document.getElementById('btn-login');
const btnTexto        = document.getElementById('btn-texto');
const btnLoading      = document.getElementById('btn-loading');
const alertaError     = document.getElementById('alerta-error');
const alertaTexto     = document.getElementById('alerta-texto');
const errorUsuario    = document.getElementById('error-usuario');
const errorContrasena = document.getElementById('error-contrasena');

inputUsuario?.addEventListener('input', () => {
  errorUsuario?.classList.add('hidden');
  inputUsuario.classList.remove('input--error');
  alertaError?.classList.add('hidden');
});
inputContrasena?.addEventListener('input', () => {
  errorContrasena?.classList.add('hidden');
  inputContrasena.classList.remove('input--error');
  alertaError?.classList.add('hidden');
});
[inputUsuario, inputContrasena].forEach(el =>
  el?.addEventListener('keydown', e => { if (e.key === 'Enter') manejarLogin(); })
);
btnLogin?.addEventListener('click', manejarLogin);

function validarLogin() {
  let ok = true;
  if (!inputUsuario?.value.trim()) {
    errorUsuario?.classList.remove('hidden');
    inputUsuario?.classList.add('input--error'); ok = false;
  }
  if (!inputContrasena?.value) {
    errorContrasena?.classList.remove('hidden');
    inputContrasena?.classList.add('input--error'); ok = false;
  }
  return ok;
}

function setLoading(cargando) {
  if (btnLogin) btnLogin.disabled = cargando;
  btnTexto?.classList.toggle('hidden', cargando);
  btnLoading?.classList.toggle('hidden', !cargando);
}

function esAdmin(u) {
  return u.rol === 'admin' || u.is_staff === true || u.is_superuser === true;
}

async function manejarLogin() {
  if (!validarLogin()) { shakeError(); return; }
  setLoading(true);
  alertaError?.classList.add('hidden');

  try {
    const { ok, data } = await login(inputUsuario.value.trim(), inputContrasena.value);
    if (ok) {
      localStorage.setItem('token',   data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.href = esAdmin(data.usuario)
        ? '/admin/dashboard/dashboard.html'
        : '/buscador/inicio/inicio.html';
      return;
    }

    const { ok: okAdmin } = await loginAdmin(inputUsuario.value.trim(), inputContrasena.value)
      .catch(() => ({ ok: false }));
    if (okAdmin) { window.location.href = '/admin/dashboard/dashboard.html'; return; }

    if (alertaTexto) alertaTexto.textContent = data.error || 'Usuario o contraseña incorrectos';
    alertaError?.classList.remove('hidden');
    inputUsuario?.classList.add('input--error');
    inputContrasena?.classList.add('input--error');
    shakeError();
  } catch {
    if (alertaTexto) alertaTexto.textContent = 'No se pudo conectar al servidor.';
    alertaError?.classList.remove('hidden');
    shakeError();
  } finally {
    setLoading(false);
  }
}

// ── REGISTRO ──────────────────────────────────────────
const btnRegistro      = document.getElementById('btn-registro');
const inputNombre      = document.getElementById('reg-nombre');
const inputCorreo      = document.getElementById('reg-correo');
const inputRegUsuario  = document.getElementById('reg-usuario');
const inputRegPass     = document.getElementById('reg-contrasena');
const inputRegPass2    = document.getElementById('reg-contrasena2');
const alertaRegError   = document.getElementById('alerta-reg-error');
const alertaRegTexto   = document.getElementById('alerta-reg-texto');
const alertaRegSuccess = document.getElementById('alerta-reg-success');

async function manejarRegistro() {
  alertaRegError?.classList.add('hidden');
  alertaRegSuccess?.classList.add('hidden');

  let ok = true;
  [inputNombre, inputCorreo, inputRegUsuario, inputRegPass, inputRegPass2].forEach(input => {
    if (!input?.value.trim()) { input?.classList.add('input--error'); ok = false; }
    else input?.classList.remove('input--error');
  });

  if (ok && inputRegPass?.value !== inputRegPass2?.value) {
    inputRegPass2?.classList.add('input--error');
    if (alertaRegTexto) alertaRegTexto.textContent = 'Las contraseñas no coinciden';
    alertaRegError?.classList.remove('hidden');
    shakeError(); return;
  }
  if (ok && inputRegPass?.value.length < 8) {
    if (alertaRegTexto) alertaRegTexto.textContent = 'La contraseña debe tener al menos 8 caracteres';
    alertaRegError?.classList.remove('hidden');
    shakeError(); return;
  }
  if (!document.getElementById('acepto-terminos')?.checked) {
    document.getElementById('error-terminos')?.classList.remove('hidden');
    shakeError(); return;
  } else {
    document.getElementById('error-terminos')?.classList.add('hidden');
  }
  if (!ok) {
    if (alertaRegTexto) alertaRegTexto.textContent = 'Completa todos los campos';
    alertaRegError?.classList.remove('hidden');
    shakeError(); return;
  }

  if (btnRegistro) { btnRegistro.disabled = true; btnRegistro.textContent = 'Creando cuenta...'; }

  try {
    const { ok: okReg, data } = await registro({
      nombre_completo: inputNombre.value.trim(),
      correo:          inputCorreo.value.trim(),
      nombre_usuario:  inputRegUsuario.value.trim(),
      contrasena:      inputRegPass.value,
      acepto_terminos: true,
      rol:             'usuario',
      estatus_cuenta:  'activo',
    });

    if (okReg) {
      alertaRegSuccess?.classList.remove('hidden');
      // Auto-login después del registro
      setTimeout(async () => {
        const { ok: okLogin, data: loginData } = await login(inputRegUsuario.value.trim(), inputRegPass.value);
        if (okLogin) {
          localStorage.setItem('token',   loginData.token);
          localStorage.setItem('usuario', JSON.stringify(loginData.usuario));
          window.location.href = '/buscador/inicio/inicio.html';
        } else {
          iniciarSesion();
        }
      }, 1500);
    } else {
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Error al crear la cuenta';
      if (alertaRegTexto) alertaRegTexto.textContent = msg;
      alertaRegError?.classList.remove('hidden');
      shakeError();
    }
  } catch {
    if (alertaRegTexto) alertaRegTexto.textContent = 'No se pudo conectar al servidor.';
    alertaRegError?.classList.remove('hidden');
    shakeError();
  } finally {
    if (btnRegistro) { btnRegistro.disabled = false; btnRegistro.textContent = 'Crear cuenta'; }
  }
}

btnRegistro?.addEventListener('click', manejarRegistro);
