// auth/login.js
import { login, registro, loginAdmin } from '/assets/js/api.js';

// ── SLIDER ────────────────────────────────────────────────
const contenedor     = document.querySelector('.contenedor__login-register');
const cajaTrLogin    = document.querySelector('.caja__trasera-login');
const cajaTrRegister = document.querySelector('.caja__trasera-register');

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

function register() {
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

document.getElementById('btn-mostrar-registro')?.addEventListener('click', register);
document.getElementById('btn-mostrar-login')?.addEventListener('click', iniciarSesion);
window.addEventListener('resize', anchoPagina);
anchoPagina();

const params = new URLSearchParams(window.location.search);
if (params.get('modo') === 'registro') register();
contenedor?.classList.add('listo');

// ── Ripple ────────────────────────────────────────────────
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const s = Math.max(btn.offsetWidth, btn.offsetHeight);
    r.style.cssText = `width:${s}px;height:${s}px;left:${e.offsetX - s / 2}px;top:${e.offsetY - s / 2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

function shakeError() {
  contenedor?.classList.add('shake');
  setTimeout(() => contenedor?.classList.remove('shake'), 400);
}

// ── Referencias DOM ───────────────────────────────────────
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

// Admin si: rol='admin', is_staff=true o is_superuser=true
function esAdmin(u) {
  return u.rol === 'admin' || u.is_staff === true || u.is_superuser === true;
}

async function manejarLogin() {
  if (!validarLogin()) { shakeError(); return; }
  setLoading(true);
  alertaError?.classList.add('hidden');

  const nombreUsuario = inputUsuario.value.trim();
  const contrasena    = inputContrasena.value;

  try {
    // ── Intento 1: usuario LUMIKA (/api/usuarios/login/) ──
    const { ok, data } = await login(nombreUsuario, contrasena);

    if (ok) {
      localStorage.setItem('token',   data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // Admin LUMIKA (rol = 'admin') → dashboard
      if (esAdmin(data.usuario)) {
        window.location.href = '/admin/dashboard/dashboard.html';
      } else {
        window.location.href = '/buscador/inicio/inicio.html';
      }
      return;
    }

    // ── Intento 2: Django superuser (/api/usuarios/login-admin/) ──
    // Solo se intenta si el primer login falló con credenciales incorrectas
    // (no si falló por otro motivo como servidor caído)
    const { ok: okAdmin, data: dataAdmin } = await loginAdmin(nombreUsuario, contrasena)
      .catch(() => ({ ok: false, data: {} }));

    if (okAdmin) {
      // loginAdmin ya guarda token y usuario en localStorage
      window.location.href = '/admin/dashboard/dashboard.html';
      return;
    }

    // ── Ambos fallaron: mostrar error ─────────────────────
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

// ── REGISTRO ──────────────────────────────────────────────
const btnRegistro      = document.getElementById('btn-registro');
const inputNombre      = document.getElementById('reg-nombre');
const inputCorreo      = document.getElementById('reg-correo');
const inputRegUsuario  = document.getElementById('reg-usuario');
const inputRegPass     = document.getElementById('reg-contrasena');
const inputRegPass2    = document.getElementById('reg-contrasena2');
const alertaRegError   = document.getElementById('alerta-reg-error');
const alertaRegTexto   = document.getElementById('alerta-reg-texto');
const alertaRegSuccess = document.getElementById('alerta-reg-success');

function validarRegistro() {
  let ok = true;
  [inputNombre, inputCorreo, inputRegUsuario, inputRegPass, inputRegPass2].forEach(input => {
    if (!input?.value.trim()) { input?.classList.add('input--error'); ok = false; }
    else input?.classList.remove('input--error');
  });
  if (ok && inputRegPass?.value !== inputRegPass2?.value) {
    inputRegPass2?.classList.add('input--error');
    if (alertaRegTexto) alertaRegTexto.textContent = 'Las contraseñas no coinciden';
    alertaRegError?.classList.remove('hidden');
    shakeError(); return false;
  }
  return ok;
}

async function manejarRegistro() {
  alertaRegError?.classList.add('hidden');
  alertaRegSuccess?.classList.add('hidden');

  if (!validarRegistro()) {
    if (alertaRegError?.classList.contains('hidden')) {
      if (alertaRegTexto) alertaRegTexto.textContent = 'Completa todos los campos';
      alertaRegError?.classList.remove('hidden');
    }
    shakeError(); return;
  }

  if (btnRegistro) { btnRegistro.disabled = true; btnRegistro.textContent = 'Creando cuenta...'; }

  try {
    const { ok, data } = await registro({
      nombre_completo: inputNombre.value.trim(),
      correo:          inputCorreo.value.trim(),
      nombre_usuario:  inputRegUsuario.value.trim(),
      contrasena:      inputRegPass.value,
      acepto_terminos: true,
      rol:             'usuario',
      estatus_cuenta:  'activo',
    });

    if (ok) {
      alertaRegSuccess?.classList.remove('hidden');
      setTimeout(() => iniciarSesion(), 2000);
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
