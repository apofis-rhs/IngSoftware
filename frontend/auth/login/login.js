// ============================================================
// login.js — Autenticación LUMIKA con animaciones
// ============================================================

// ── 1. VARIABLES DEL DOM ───────────────────────────────────
const contenedor_login_register = document.querySelector(".contenedor__login-register");
const caja_trasera_login        = document.querySelector(".caja__trasera-login");
const caja_trasera_register     = document.querySelector(".caja__trasera-register");
const btn_mostrar_login         = document.getElementById("btn-mostrar-login");
const btn_mostrar_registro      = document.getElementById("btn-mostrar-registro");

// ── 2. ANIMACIONES DEL SLIDER ─────────────────────────────
function anchoPagina() {
  if (window.innerWidth > 850) {
    caja_trasera_register.style.display = "block";
    caja_trasera_login.style.display = "block";
  } else {
    caja_trasera_register.style.display = "block";
    caja_trasera_register.style.opacity = "1";
    caja_trasera_login.style.display = "none";
  }
}

function register() {
  contenedor_login_register.classList.add("is-register");
  if (window.innerWidth > 850) {
    contenedor_login_register.style.left = "440px";
    caja_trasera_register.style.opacity = "0";
    caja_trasera_login.style.opacity = "1";
  } else {
    caja_trasera_register.style.display = "none";
    caja_trasera_login.style.display = "block";
    caja_trasera_login.style.opacity = "1";
  }
}

function iniciarSesion() {
  contenedor_login_register.classList.remove("is-register");
  if (window.innerWidth > 850) {
    contenedor_login_register.style.left = "10px";
    caja_trasera_register.style.opacity = "1";
    caja_trasera_login.style.opacity = "0";
  } else {
    caja_trasera_register.style.display = "block";
    caja_trasera_login.style.display = "none";
  }
}

if (btn_mostrar_registro) btn_mostrar_registro.addEventListener("click", register);
if (btn_mostrar_login)    btn_mostrar_login.addEventListener("click", iniciarSesion);
window.addEventListener("resize", anchoPagina);

anchoPagina();

// ── 3. DETECTAR ?modo=registro DESDE inicio.html ──────────
const params = new URLSearchParams(window.location.search);
if (params.get('modo') === 'registro') {
  register();
}
contenedor_login_register.classList.add('listo');

// ── 4. RIPPLE en botones ───────────────────────────────────
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(btn.offsetWidth, btn.offsetHeight);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.offsetX - size/2}px;top:${e.offsetY - size/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

// ── 5. SHAKE en error ──────────────────────────────────────
function shakeError() {
  contenedor_login_register.classList.add('shake');
  setTimeout(() => contenedor_login_register.classList.remove('shake'), 400);
}

// ── 6. LOGIN — backend real ────────────────────────────────
const inputUsuario    = document.getElementById('usuario');
const inputContrasena = document.getElementById('contrasena');
const btnLogin        = document.getElementById('btn-login');
const btnTexto        = document.getElementById('btn-texto');
const btnLoading      = document.getElementById('btn-loading');
const alertaError     = document.getElementById('alerta-error');
const alertaTexto     = document.getElementById('alerta-texto');
const errorUsuario    = document.getElementById('error-usuario');
const errorContrasena = document.getElementById('error-contrasena');

if (inputUsuario && inputContrasena && btnLogin) {
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
  [inputUsuario, inputContrasena].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') manejarLogin(); });
  });
  btnLogin.addEventListener('click', manejarLogin);
}

function validarLogin() {
  let valido = true;
  if (!inputUsuario.value.trim()) {
    errorUsuario.classList.remove('hidden');
    inputUsuario.classList.add('input--error');
    valido = false;
  }
  if (!inputContrasena.value) {
    errorContrasena.classList.remove('hidden');
    inputContrasena.classList.add('input--error');
    valido = false;
  }
  return valido;
}

function setLoading(cargando) {
  btnLogin.disabled = cargando;
  btnTexto.classList.toggle('hidden', cargando);
  btnLoading.classList.toggle('hidden', !cargando);
}

async function manejarLogin() {
  if (!validarLogin()) { shakeError(); return; }
  setLoading(true);
  alertaError.classList.add('hidden');

  try {
    const res = await fetch('http://localhost:8000/api/usuarios/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_usuario: inputUsuario.value.trim(),
        contrasena: inputContrasena.value
      })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      if (data.usuario.rol === 'admin') {
        window.location.href = '../../admin/dashboard/dashboard.html';
      } else {
        window.location.href = '../../buscador/inicio/inicio.html';
      }
    } else {
      alertaTexto.textContent = data.error || 'Usuario o contraseña incorrectos';
      alertaError.classList.remove('hidden');
      inputUsuario.classList.add('input--error');
      inputContrasena.classList.add('input--error');
      shakeError();
    }
  } catch {
    alertaTexto.textContent = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
    alertaError.classList.remove('hidden');
    shakeError();
  } finally {
    setLoading(false);
  }
}

// ── 7. REGISTRO — backend real ─────────────────────────────
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
  let valido = true;
  [inputNombre, inputCorreo, inputRegUsuario, inputRegPass, inputRegPass2].forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('input--error');
      valido = false;
    } else {
      input.classList.remove('input--error');
    }
  });
  if (valido && inputRegPass.value !== inputRegPass2.value) {
    inputRegPass2.classList.add('input--error');
    alertaRegTexto.textContent = 'Las contraseñas no coinciden';
    alertaRegError.classList.remove('hidden');
    shakeError();
    return false;
  }
  return valido;
}

async function manejarRegistro() {
  alertaRegError.classList.add('hidden');
  alertaRegSuccess.classList.add('hidden');

  if (!validarRegistro()) {
    if (alertaRegError.classList.contains('hidden')) {
      alertaRegTexto.textContent = 'Completa todos los campos';
      alertaRegError.classList.remove('hidden');
    }
    shakeError();
    return;
  }

  btnRegistro.disabled = true;
  btnRegistro.textContent = 'Creando cuenta...';

  try {
    const res = await fetch('http://localhost:8000/api/usuarios/registro/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_completo: inputNombre.value.trim(),
        correo:          inputCorreo.value.trim(),
        nombre_usuario:  inputRegUsuario.value.trim(),
        contrasena:      inputRegPass.value,
        acepto_terminos: true,
        rol:             'usuario',
        estatus_cuenta:  'activo'
      })
    });
    const data = await res.json();

    if (res.ok) {
      alertaRegSuccess.classList.remove('hidden');
      setTimeout(() => iniciarSesion(), 2000);
    } else {
      const msg = Object.values(data).flat().join(' ');
      alertaRegTexto.textContent = msg || 'Error al crear la cuenta';
      alertaRegError.classList.remove('hidden');
      shakeError();
    }
  } catch {
    alertaRegTexto.textContent = 'No se pudo conectar al servidor.';
    alertaRegError.classList.remove('hidden');
    shakeError();
  } finally {
    btnRegistro.disabled = false;
    btnRegistro.textContent = 'Crear cuenta';
  }
}

if (btnRegistro) btnRegistro.addEventListener('click', manejarRegistro);