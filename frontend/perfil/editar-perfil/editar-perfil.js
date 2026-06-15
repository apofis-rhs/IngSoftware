// editar-perfil.js

// IMPORTANTE: Comenté la importación de la API para que no de errores mientras pruebas en Live Server
// import { obtenerPerfil, editarPerfil, estaLogueado } from "../../assets/js/api.js";

document.addEventListener('DOMContentLoaded', async () => {

  const formView = document.getElementById("form-view");
  const successView = document.getElementById("success-view");
  const btnGuardar = document.getElementById("btnGuardar");
  const divMensaje = document.getElementById("mensaje");

  const inputNombre = document.getElementById("nombre");
  const inputUsuario = document.getElementById("usuario");
  const inputCorreo = document.getElementById("correo");

  /* // ── 1. CARGAR DATOS AL INICIAR (Comentado para pruebas sin servidor) ──
  try {
    const { ok, data } = await obtenerPerfil();
    if (ok) {
      inputNombre.value = data.nombre_completo || data.nombre || "";
      inputUsuario.value = data.nombre_usuario || "";
      inputCorreo.value = data.correo || "";
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    mostrarError("No se pudo cargar la información del perfil.");
  }
  */

  // ── 2. GUARDAR CAMBIOS (Simulado para Live Server) ───────────────────
  btnGuardar.addEventListener("click", (e) => {
    e.preventDefault();

    // Limpiar alertas previas
    divMensaje.innerHTML = "";

    // Validar campos vacíos
    if (!inputNombre.value.trim() || !inputUsuario.value.trim() || !inputCorreo.value.trim()) {
      mostrarError("Por favor, completa todos los campos.");
      return;
    }

    // Cambiar estado visual del botón (Cargando...)
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    btnGuardar.disabled = true;

    // SIMULACIÓN: Esperamos 1 segundo para fingir que el servidor procesó los datos
    setTimeout(() => {
      
      // Ocultar formulario y mostrar la tarjeta de éxito
      formView.style.display = "none";
      successView.style.display = "flex";

      // Si necesitas que el botón vuelva a la normalidad en caso de que alguien lo regrese a display block:
      // btnGuardar.innerHTML = textoOriginal;
      // btnGuardar.disabled = false;

    }, 1000); // 1000 milisegundos = 1 segundo de espera
  });

  // Función auxiliar para imprimir errores en pantalla
  function mostrarError(texto) {
    divMensaje.innerHTML = `<div class="alerta alerta--error" style="margin-top:16px;">${texto}</div>`;
    
    // Ocultar alerta después de 3 segundos
    setTimeout(() => {
      divMensaje.innerHTML = "";
    }, 3000);
  }

});