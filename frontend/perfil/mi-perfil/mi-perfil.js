// mi-perfil.js

// IMPORTANTE: Comenté la importación de la API para pruebas en Live Server
// import { obtenerPerfil, eliminarCuenta, estaLogueado } from "../../assets/js/api.js";

document.addEventListener('DOMContentLoaded', async () => {

  // ── CARGAR PERFIL (SIMULADO PARA LIVE SERVER) ────────────────────────
  function cargarPerfilSimulado() {
    // Datos falsos para probar la interfaz
    const data = {
      nombre_completo: "Rebeca Hernández",
      nombre_usuario: "rebeca.hs"
    };

    document.getElementById("perfil-nombre").textContent  = data.nombre_completo || data.nombre_usuario;
    document.getElementById("perfil-usuario").textContent = "@" + data.nombre_usuario;

    const iniciales = (data.nombre_completo || data.nombre_usuario || "?")
      .split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
    document.getElementById("avatar-iniciales").textContent = iniciales;
  }

  cargarPerfilSimulado();

  // ── LÓGICA DEL MODAL DE ELIMINAR CUENTA ──────────────────────
  const btnAbrirModal = document.getElementById("btn-eliminar");
  const modalEliminar = document.getElementById("modal-eliminar");
  const btnCancelar = document.getElementById("btn-cancelar-eliminar");
  const btnConfirmar = document.getElementById("btn-confirmar-eliminar");
  const textoEliminar = document.getElementById("texto-eliminar");
  const loadingEliminar = document.getElementById("loading-eliminar");

  // Abrir Modal
  btnAbrirModal.addEventListener("click", (e) => {
    e.preventDefault();
    modalEliminar.classList.add("active");
  });

  // Cerrar Modal al dar clic en Cancelar
  btnCancelar.addEventListener("click", () => {
    modalEliminar.classList.remove("active");
  });

  // Cerrar Modal si dan clic en el fondo oscuro
  modalEliminar.addEventListener("click", (e) => {
    if (e.target === modalEliminar) {
      modalEliminar.classList.remove("active");
    }
  });

  // Acción de Eliminar (Simulada para Live Server)
  btnConfirmar.addEventListener("click", () => {
    
    // Cambiamos el estado del botón a "Cargando..."
    btnConfirmar.disabled = true;
    textoEliminar.classList.add("hidden");
    loadingEliminar.classList.remove("hidden");
    btnCancelar.style.pointerEvents = "none"; // Desactivar cancelar mientras carga

    // Simulamos que el servidor está borrando la cuenta (1.5 segundos)
    setTimeout(() => {
      // Limpiamos los tokens locales (simulación)
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      
      // Redirigimos al Login
      window.location.href = "../../auth/login/login.html";
    }, 1500);

  });

});