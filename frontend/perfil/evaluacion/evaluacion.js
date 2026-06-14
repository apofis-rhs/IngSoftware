// evaluacion.js — conectado a la BD
import { enviarEvaluacion, estaLogueado } from '../../assets/js/api.js';

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

  let calificacion = 0;
  const estrellas  = document.querySelectorAll('.star');
  const textoRating = document.getElementById('rating-texto');
  const btnEnviar   = document.getElementById('btn-enviar');
  const comentario  = document.getElementById('comentario');
  const formView    = document.getElementById('form-view');
  const successView = document.getElementById('success-view');

  const textosPorCalificacion = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];

  // Interacción de estrellas
  estrellas.forEach((estrella, i) => {
    estrella.addEventListener('click', () => {
      calificacion = i + 1;
      actualizarEstrellas(i);
      if (textoRating) textoRating.textContent = textosPorCalificacion[calificacion];
    });
    estrella.addEventListener('mouseover', () => {
      estrellas.forEach((e, j) => e.classList.toggle('hovered', j <= i));
    });
    estrella.addEventListener('mouseout', () => {
      estrellas.forEach(e => e.classList.remove('hovered'));
    });
  });

  function actualizarEstrellas(idx) {
    estrellas.forEach((e, j) => {
      e.classList.toggle('selected', j <= idx);
    });
  }

  // Enviar evaluación real a la BD
  btnEnviar?.addEventListener('click', async () => {
    if (!calificacion) {
      mostrarToast('Selecciona una calificación antes de enviar.', 'warning'); return;
    }

    const textoOrig = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    const { ok } = await enviarEvaluacion(null, calificacion, comentario?.value.trim() || '');

    if (ok) {
      if (formView)    formView.style.display    = 'none';
      if (successView) successView.style.display = 'flex';
    } else {
      mostrarToast('No se pudo enviar la evaluación. Intenta de nuevo.', 'error');
      btnEnviar.disabled = false;
      btnEnviar.innerHTML = textoOrig;
    }
  });

  function mostrarToast(msg, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${msg}`;
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:0.9rem';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});