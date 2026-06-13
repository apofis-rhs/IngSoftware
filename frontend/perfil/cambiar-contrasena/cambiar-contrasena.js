// cambiar-contrasena.js

// IMPORTANTE: Comenté la importación de la API para pruebas en Live Server
// import { cambiarContrasena, estaLogueado } from "../../assets/js/api.js";

document.addEventListener('DOMContentLoaded', () => {

  // if (!estaLogueado()) {
  //   window.location.href = "../../auth/login/login.html";
  //   return;
  // }

  const card        = document.getElementById("card");
  const formView    = document.getElementById("form-view");
  const succView    = document.getElementById("success-view");
  const btnCambiar  = document.getElementById("btnCambiar");
  const btnTexto    = document.getElementById("btn-texto");
  const btnLoading  = document.getElementById("btn-loading");
  const progress    = document.getElementById("progress");
  const alertaError = document.getElementById("alerta-error");
  const alertaTexto = document.getElementById("alerta-texto");

  let errorTimer;

  // Ocultar la alerta automáticamente en cuanto el usuario empiece a escribir
  const inputsFormulario = document.querySelectorAll('.form-input');
  inputsFormulario.forEach(input => {
    input.addEventListener('input', () => {
      if (!alertaError.classList.contains('hidden')) {
        alertaError.classList.add('hidden');
      }
    });
  });

  // ── RIPPLE ──────────────────────────────
  btnCambiar.addEventListener("click", function(e) {
    const r = document.createElement("span");
    r.className = "ripple";
    const size = Math.max(this.offsetWidth, this.offsetHeight);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.offsetX - size/2}px;top:${e.offsetY - size/2}px`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
    manejarCambio();
  });

  // ── PARTÍCULAS ───────────────────────────
  const wrapper = document.getElementById("wrapper");
  const colors  = ["#FFD460", "#BAC423", "#FF8C99", "#FFAC00"];
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = Math.random() * 10 + 6;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      background:${colors[i % colors.length]};
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation-duration:${Math.random() * 4 + 3}s;
      animation-delay:${Math.random() * 3}s;
    `;
    wrapper.appendChild(p);
  }

  function mostrarError(msg) {
    alertaTexto.textContent = msg;
    alertaError.classList.remove("hidden");

    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      alertaError.classList.add("hidden");
    }, 4000); // 4 segundos para que dé tiempo de leer
  }

  function setLoading(cargando) {
    btnCambiar.disabled = cargando;
    btnTexto.classList.toggle("hidden", cargando);
    btnLoading.classList.toggle("hidden", !cargando);
    if (cargando) progress.classList.add("running");
    else progress.classList.remove("running");
  }

  async function manejarCambio() {
    const actual    = document.getElementById("contrasenaActual").value;
    const nueva     = document.getElementById("nuevaContrasena").value;
    const confirmar = document.getElementById("confirmarContrasena").value;

    alertaError.classList.add("hidden");

    if (!actual || !nueva || !confirmar) {
      mostrarError("Completa todos los campos.");
      return;
    }
    if (nueva !== confirmar) {
      mostrarError("Las contraseñas no coinciden.");
      return;
    }
    if (nueva.length < 8) {
      mostrarError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    // ── SIMULACIÓN DE CONEXIÓN A LA API (Para Live Server) ──
    setTimeout(() => {
      
      // Simulamos que el backend dice que la contraseña actual es incorrecta si escribes "error"
      const ok = (actual !== "error"); 

      if (ok) {
        // Flip a pantalla de éxito
        card.classList.add("flip-out");
        setTimeout(() => {
          formView.style.display  = "none";
          succView.style.display  = "flex";
          card.classList.remove("flip-out");
          card.classList.add("flip-in");
        }, 350);
      } else {
        // Muestra error
        mostrarError("La contraseña actual es incorrecta.");
      }
      
      setLoading(false);

    }, 1500); // Simula 1.5 segundos de carga en el servidor
  }

});