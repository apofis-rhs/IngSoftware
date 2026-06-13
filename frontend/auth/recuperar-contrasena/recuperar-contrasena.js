
// recuperar-contrasena.js — LUMIKA

// ── PARTÍCULAS ─────────────────────────────────────────────
const wrapper = document.getElementById('wrapper');
const colors  = ['#FFD460', '#BAC423', '#FF8C99', '#FFAC00'];

for (let i = 0; i < 12; i++) {
  const p    = document.createElement('span');
  p.className = 'particle';
  const size = Math.random() * 10 + 6;
  p.style.cssText = `
    width:${size}px;height:${size}px;
    background:${colors[i % colors.length]};
    left:${Math.random() * 100}%;
    top:${Math.random() * 80 + 10}%;
    opacity:${Math.random() * 0.5 + 0.3};
    animation-duration:${Math.random() * 4 + 3}s;
    animation-delay:${Math.random() * 3}s;
  `;
  wrapper.appendChild(p);
}

// ── DOM ────────────────────────────────────────────────────
const card        = document.getElementById('card');
const formView    = document.getElementById('form-view');
const successView = document.getElementById('success-view');
const inputCorreo = document.getElementById('input-correo');
const btnEnviar   = document.getElementById('btn-enviar');
const btnTexto    = document.getElementById('btn-texto');
const btnLoading  = document.getElementById('btn-loading');
const progress    = document.getElementById('progress');
const errorCorreo = document.getElementById('error-correo');
const alertaError = document.getElementById('alerta-error');
const alertaTexto = document.getElementById('alerta-texto');

// ── RIPPLE ─────────────────────────────────────────────────
btnEnviar.addEventListener('click', function(e) {
  const r    = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(this.offsetWidth, this.offsetHeight);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.offsetX - size/2}px;top:${e.offsetY - size/2}px`;
  this.appendChild(r);
  setTimeout(() => r.remove(), 600);
  manejarEnvio();
});

// Enter para enviar
inputCorreo.addEventListener('keydown', e => {
  if (e.key === 'Enter') manejarEnvio();
});

// Limpiar error al escribir
inputCorreo.addEventListener('input', () => {
  errorCorreo.classList.add('hidden');
  inputCorreo.classList.remove('input--error');
  alertaError.classList.add('hidden');
});

// ── VALIDAR ────────────────────────────────────────────────
function validar() {
  if (!inputCorreo.value.trim()) {
    errorCorreo.classList.remove('hidden');
    inputCorreo.classList.add('input--error');
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(inputCorreo.value.trim())) {
    errorCorreo.textContent = 'Ingresa un correo válido';
    errorCorreo.classList.remove('hidden');
    inputCorreo.classList.add('input--error');
    return false;
  }
  return true;
}

// ── LÓGICA PRINCIPAL ───────────────────────────────────────
async function manejarEnvio() {
  if (!validar()) return;

  // Estado de carga
  btnEnviar.disabled = true;
  btnTexto.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  progress.classList.add('running');
  alertaError.classList.add('hidden');

  try {
    // ⚠️ Cuando Isaí tenga el endpoint listo, reemplazar esta línea:
    // const res = await fetch('http://localhost:8000/api/usuarios/recuperar-contrasena/', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ correo: inputCorreo.value.trim() })
    // });
    // const data = await res.json();
    // if (!res.ok) throw new Error(data.error || 'Error al enviar');

    // Simulación mientras el endpoint no existe
    await new Promise(r => setTimeout(r, 1900));

    // ÉXITO — flip de la card
    card.classList.add('flip-out');
    setTimeout(() => {
      formView.style.display    = 'none';
      successView.style.display = 'flex';
      card.classList.remove('flip-out');
      card.classList.add('flip-in');
    }, 350);

  } catch (err) {
    alertaTexto.textContent = err.message || 'No se pudo conectar al servidor. Intenta de nuevo.';
    alertaError.classList.remove('hidden');
    btnEnviar.disabled = false;
    btnTexto.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    progress.classList.remove('running');
    progress.style.width = '0';
  }
}

