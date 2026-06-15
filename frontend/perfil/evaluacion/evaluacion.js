// evaluacion.js

// import { enviarEvaluacion, estaLogueado } from "../../assets/js/api.js";

document.addEventListener('DOMContentLoaded', () => {

  const card = document.getElementById("card");
  const formView = document.getElementById("form-view");
  const successView = document.getElementById("success-view");
  const btnEnviar = document.getElementById("btnEnviar");
  const btnTexto = document.getElementById("btn-texto");
  const btnLoading = document.getElementById("btn-loading");
  const alertaError = document.getElementById("alerta-error");
  const alertaTexto = document.getElementById("alerta-texto");
  const emojiDisplay = document.getElementById("reaction-emoji");
  
  // OJO: Como invertimos el orden de las estrellas en CSS (row-reverse), 
  // las seleccionamos como Array y las invertimos en JS para que coincidan del 1 al 5 lógicamente.
  // Buscamos las estrellas y las dejamos en su orden natural (1, 2, 3, 4, 5)
  const estrellasNodes = document.querySelectorAll(".star");
  const estrellas = Array.from(estrellasNodes);

  let calificacion = 0;
  let errorTimer;

  // Emojis según la calificación
  const emojis = {
    0: "😶", // Neutral inicial
    1: "😞", // Muy malo
    2: "😕", // Malo
    3: "🙂", // Regular / Bueno
    4: "😄", // Muy bueno
    5: "🤩"  // Excelente
  };

  // ── LÓGICA DE LAS ESTRELLAS ──────────────────────────────────
  estrellas.forEach((star) => {
    
    star.addEventListener("mouseover", () => {
      const valor = Number(star.dataset.value);
      pintarEstrellas(valor);
      actualizarEmoji(valor);
    });

    star.addEventListener("click", () => {
      calificacion = Number(star.dataset.value);
      pintarEstrellas(calificacion);
      actualizarEmoji(calificacion);
      // Ocultar alerta si el usuario por fin seleccionó una estrella
      if(!alertaError.classList.contains("hidden")) {
        alertaError.classList.add("hidden");
      }
    });
  });

  // Cuando el mouse sale, vuelve a pintar lo que estaba guardado
  document.getElementById("estrellas").addEventListener("mouseleave", () => {
    pintarEstrellas(calificacion);
    actualizarEmoji(calificacion);
  });

  function pintarEstrellas(valorAColor) {
    estrellas.forEach(star => {
      const valor = Number(star.dataset.value);
      if (valor <= valorAColor) {
        star.classList.add("star--filled");
      } else {
        star.classList.remove("star--filled");
      }
    });
  }

  function actualizarEmoji(valor) {
    if (emojiDisplay.textContent !== emojis[valor]) {
      emojiDisplay.textContent = emojis[valor];
      
      // Reiniciamos la animación css para que "salte"
      emojiDisplay.classList.remove("bounce");
      void emojiDisplay.offsetWidth; // Trigger reflow
      emojiDisplay.classList.add("bounce");
    }
  }

  // ── MANEJO DE ERRORES ────────────────────────────────────────
  function mostrarError(msg) {
    alertaTexto.textContent = msg;
    alertaError.classList.remove("hidden");
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      alertaError.classList.add("hidden");
    }, 4000);
  }

  function setLoading(cargando) {
    btnEnviar.disabled = cargando;
    btnTexto.classList.toggle("hidden", cargando);
    btnLoading.classList.toggle("hidden", !cargando);
  }

  // ── ENVÍO DEL FORMULARIO (SIMULADO) ──────────────────────────
  btnEnviar.addEventListener("click", () => {
    
    if (calificacion === 0) {
      mostrarError("¡Ups! Por favor selecciona al menos una estrella.");
      return;
    }

    const comentario = document.getElementById("comentario").value.trim();
    
    setLoading(true);

    // Simulamos la carga con el servidor por 1 segundo
    setTimeout(() => {
      setLoading(false);
      
      // Animación suave de transición
      card.style.opacity = "0";
      
      setTimeout(() => {
        formView.style.display = "none";
        successView.style.display = "flex";
        card.style.opacity = "1";
      }, 300);

    }, 1000);
  });

  // ── INYECCIÓN DE PARTÍCULAS SUTILES AL FONDO ─────────────────
  const colors = ["#FFD460", "#BAC423", "#FF8C99", "#FFAC00"];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = Math.random() * 12 + 6;
    const isLeaf = Math.random() > 0.5;
    const borderRadius = isLeaf ? "0 50% 50% 50%" : "50%";
    
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${borderRadius};
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 5 + 4}s;
      animation-delay: ${Math.random() * 3}s;
    `;
    document.body.appendChild(p);
  }

});