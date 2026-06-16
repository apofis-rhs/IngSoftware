// perfil/evaluacion.js
import { enviarEvaluacion, estaLogueado } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', () => {

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

  // ID del producto a evaluar (viene por ?id=X en la URL)
  const params     = new URLSearchParams(window.location.search);
  const idProducto = params.get('id');

  const card        = document.getElementById('card');
  const formView    = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const btnEnviar   = document.getElementById('btnEnviar');
  const btnTexto    = document.getElementById('btn-texto');
  const btnLoading  = document.getElementById('btn-loading');
  const alertaError = document.getElementById('alerta-error');
  const alertaTexto = document.getElementById('alerta-texto');
  const emojiDisplay = document.getElementById('reaction-emoji');

  const estrellas = Array.from(document.querySelectorAll('.star'));
  let calificacion = 0;
  let errorTimer;

  const emojis = { 0:'😶', 1:'😞', 2:'😕', 3:'🙂', 4:'😄', 5:'🤩' };

  // ── Lógica estrellas ─────────────────────────────────────
  estrellas.forEach(star => {
    star.addEventListener('mouseover', () => {
      const v = Number(star.dataset.value);
      pintarEstrellas(v); actualizarEmoji(v);
    });
    star.addEventListener('click', () => {
      calificacion = Number(star.dataset.value);
      pintarEstrellas(calificacion); actualizarEmoji(calificacion);
      alertaError?.classList.add('hidden');
    });
  });

  document.getElementById('estrellas')?.addEventListener('mouseleave', () => {
    pintarEstrellas(calificacion); actualizarEmoji(calificacion);
  });

  function pintarEstrellas(val) {
    estrellas.forEach(s => s.classList.toggle('star--filled', Number(s.dataset.value) <= val));
  }

  function actualizarEmoji(val) {
    if (!emojiDisplay || emojiDisplay.textContent === emojis[val]) return;
    emojiDisplay.textContent = emojis[val];
    emojiDisplay.classList.remove('bounce');
    void emojiDisplay.offsetWidth;
    emojiDisplay.classList.add('bounce');
  }

  function mostrarError(msg) {
    if (alertaTexto) alertaTexto.textContent = msg;
    alertaError?.classList.remove('hidden');
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => alertaError?.classList.add('hidden'), 4000);
  }

  function setLoading(cargando) {
    if (btnEnviar) btnEnviar.disabled = cargando;
    btnTexto?.classList.toggle('hidden',  cargando);
    btnLoading?.classList.toggle('hidden', !cargando);
  }

  // Partículas decorativas
  const colors = ['#FFD460','#BAC423','#FF8C99','#FFAC00'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 12 + 6;
    p.style.cssText = `width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'0 50% 50% 50%':'50%'};
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*5+4}s;
      animation-delay:${Math.random()*3}s;`;
    document.body.appendChild(p);
  }

  // ── Envío a la BD ─────────────────────────────────────────
  btnEnviar?.addEventListener('click', async () => {
    if (calificacion === 0) { mostrarError('¡Ups! Por favor selecciona al menos una estrella.'); return; }

    const comentario = document.getElementById('comentario')?.value.trim() || '';
    setLoading(true);

    try {
      // Usa enviarEvaluacion de api.js
      const { ok, data } = await enviarEvaluacion(idProducto, calificacion, comentario);

      if (ok) {
        if (card) card.style.opacity = '0';
        setTimeout(() => {
          if (formView)    formView.style.display    = 'none';
          if (successView) successView.style.display = 'flex';
          if (card)        card.style.opacity        = '1';
        }, 300);
      } else {
        mostrarError(data?.error || data?.detail || 'No se pudo enviar la evaluación.');
      }
    } catch { mostrarError('Error de conexión.'); }
    finally  { setLoading(false); }
  });
});
