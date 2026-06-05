// ============================================================
// login.js — Lógica de inicio de sesión
// ============================================================
// Cuando Django esté listo, descomentar esta línea
// y borrar la función login() de abajo:
//
// import { login } from '../../assets/js/api.js';
// ============================================================

async function login(nombre_usuario, contrasena) {
  const res = await fetch('http://127.0.0.1:8000/api/usuarios/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario, contrasena })
  });
  return res.json();
}

const inputUsuario    = document.getElementById('usuario');
const inputContrasena = document.getElementById('contrasena');
const btnLogin        = document.getElementById('btn-login');
const btnTexto        = document.getElementById('btn-texto');
const btnLoading      = document.getElementById('btn-loading');
const alertaError     = document.getElementById('alerta-error');
const alertaTexto     = document.getElementById('alerta-texto');
const errorUsuario    = document.getElementById('error-usuario');
const errorContrasena = document.getElementById('error-contrasena');

// Limpiar errores al escribir
inputUsuario.addEventListener('input', () => {
  errorUsuario.classList.add('hidden');
  inputUsuario.classList.remove('input--error');
  alertaError.classList.add('hidden');
});
inputContrasena.addEventListener('input', () => {
  errorContrasena.classList.add('hidden');
  inputContrasena.classList.remove('input--error');
  alertaError.classList.add('hidden');
});

// Enter para enviar
[inputUsuario, inputContrasena].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') manejarLogin(); })
);

function validar() {
  let ok = true;
  if (!inputUsuario.value.trim()) {
    errorUsuario.classList.remove('hidden');
    inputUsuario.classList.add('input--error');
    ok = false;
  }
  if (!inputContrasena.value) {
    errorContrasena.classList.remove('hidden');
    inputContrasena.classList.add('input--error');
    ok = false;
  }
  return ok;
}

function setLoading(cargando) {
  btnLogin.disabled = cargando;
  btnTexto.classList.toggle('hidden', cargando);
  btnLoading.classList.toggle('hidden', !cargando);
}

async function manejarLogin() {
  if (!validar()) return;
  setLoading(true);
  alertaError.classList.add('hidden');
  try {
    const res = await login(inputUsuario.value.trim(), inputContrasena.value);
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      window.location.href = res.usuario.rol === 'admin'
        ? '../../admin/dashboard/dashboard.html'
        : '../../inicio/inicio.html';
    } else {
      alertaTexto.textContent = res.error || 'Usuario o contraseña incorrectos';
      alertaError.classList.remove('hidden');
      inputUsuario.classList.add('input--error');
      inputContrasena.classList.add('input--error');
    }
  } catch {
    alertaTexto.textContent = 'No se pudo conectar. Intenta de nuevo.';
    alertaError.classList.remove('hidden');
  } finally {
    setLoading(false);
  }
}

btnLogin.addEventListener('click', manejarLogin);
