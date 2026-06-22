// perfil/cambiar-contrasena.js
import { cambiarContrasena, estaLogueado } from '/assets/js/api.js';

document.addEventListener('DOMContentLoaded', () => {

  if (!estaLogueado()) { window.location.href = '/auth/login/login.html'; return; }

  // ── BOTÓN REGRESAR INTELIGENTE ────────────────────────
  const btnAtras = document.querySelector('.btn-back');
  if (btnAtras) {
    // Le quitamos el href por si acaso lo tiene en el HTML
    btnAtras.removeAttribute('href'); 
    btnAtras.addEventListener('click', irAtras);
  }

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

  // ── CIERRE AUTOMÁTICO DEL MENÚ MÓVIL ────────────────────────
  
  // 1. Cierra el menú inmediatamente al hacer clic en cualquier enlace dentro de él
  const enlacesMenu = navDrawer?.querySelectorAll('a');
  enlacesMenu?.forEach(enlace => {
    enlace.addEventListener('click', () => {
      navDrawer?.classList.remove('open');
    });
  });

  // 2. Failsafe: Si el navegador restaura la página desde el caché (bfcache), fuerza el cierre
  window.addEventListener('pageshow', () => {
    navDrawer?.classList.remove('open');
  });

  const card        = document.getElementById('card');
  const formView    = document.getElementById('form-view');
  const succView    = document.getElementById('success-view');
  const btnCambiar  = document.getElementById('btnCambiar');
  const btnTexto    = document.getElementById('btn-texto');
  const btnLoading  = document.getElementById('btn-loading');
  const progress    = document.getElementById('progress');
  const alertaError = document.getElementById('alerta-error');
  const alertaTexto = document.getElementById('alerta-texto');
  let errorTimer;

  // Ocultar alerta al escribir
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => alertaError?.classList.add('hidden'));
  });

  // Ojo contraseña
  document.querySelectorAll('.btn-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const esPass = input.type === 'password';
      input.type = esPass ? 'text' : 'password';
      btn.querySelector('i').className = esPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  });

  // Palomita confirmar contraseña
  const inpNueva     = document.getElementById('nuevaContrasena');
  const inpConfirmar = document.getElementById('confirmarContrasena');
  const checkNueva   = document.getElementById('check-nueva-pass');
  function verificar() {
    if (!inpNueva || !inpConfirmar || !checkNueva) return;
    const ok = inpNueva.value === inpConfirmar.value && inpConfirmar.value.length >= 8;
    checkNueva.classList.toggle('hidden', !ok);
    inpConfirmar.classList.toggle('input--ok', ok);
    inpConfirmar.classList.toggle('input--error', !ok && inpConfirmar.value.length > 0);
  }
  inpNueva?.addEventListener('input', verificar);
  inpConfirmar?.addEventListener('input', verificar);

  // Ripple
  btnCambiar?.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(this.offsetWidth, this.offsetHeight);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.offsetX-size/2}px;top:${e.offsetY-size/2}px`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
    manejarCambio();
  });

  // Partículas decorativas
  const wrapper = document.getElementById('wrapper');
  if (wrapper) {
    const colors = ['#FFD460','#BAC423','#FF8C99','#FFAC00'];
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = Math.random() * 10 + 6;
      p.style.cssText = `width:${size}px;height:${size}px;
        background:${colors[i%colors.length]};
        left:${Math.random()*100}%;top:${Math.random()*100}%;
        animation-duration:${Math.random()*4+3}s;animation-delay:${Math.random()*3}s;`;
      wrapper.appendChild(p);
    }
  }

  function mostrarError(msg) {
    if (alertaTexto) alertaTexto.textContent = msg;
    alertaError?.classList.remove('hidden');
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => alertaError?.classList.add('hidden'), 4000);
  }

  function setLoading(cargando) {
    if (btnCambiar) btnCambiar.disabled = cargando;
    btnTexto?.classList.toggle('hidden', cargando);
    btnLoading?.classList.toggle('hidden', !cargando);
    if (cargando) progress?.classList.add('running');
    else          progress?.classList.remove('running');
  }

  async function manejarCambio() {
    const actual    = document.getElementById('contrasenaActual')?.value;
    const nueva     = document.getElementById('nuevaContrasena')?.value;
    const confirmar = document.getElementById('confirmarContrasena')?.value;

    alertaError?.classList.add('hidden');

    if (!actual || !nueva || !confirmar) { mostrarError('Completa todos los campos.'); return; }
    if (nueva !== confirmar)             { mostrarError('Las contraseñas no coinciden.'); return; }
    if (nueva.length < 8)               { mostrarError('La contraseña debe tener al menos 8 caracteres.'); return; }

    setLoading(true);

    try {
      const { ok, data } = await cambiarContrasena(actual, nueva);

      if (ok) {
        card?.classList.add('flip-out');
        setTimeout(() => {
          if (formView) formView.style.display = 'none';
          if (succView) succView.style.display = 'flex';
          card?.classList.remove('flip-out');
          card?.classList.add('flip-in');
          // Cerrar sesión por seguridad
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }, 350);
      } else {
        mostrarError(data?.error || data?.detail || 'La contraseña actual es incorrecta.');
      }
    } catch { mostrarError('Error de conexión.'); }
    finally  { setLoading(false); }
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