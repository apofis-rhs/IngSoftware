import {
  obtenerPerfil,
  estaLogueado,
  logout
} from "../../assets/js/api.js";

// Verificar sesión
if (!estaLogueado()) {
  window.location.href = "../../auth/login/login.html";
}

// Cargar información del perfil
async function cargarPerfil() {

  try {

    const { ok, data } = await obtenerPerfil();

    if (!ok) {
      alert("No se pudo obtener la información del perfil");
      return;
    }

    console.log("Perfil:", data);

    // Nombre
    document.getElementById("nombre").textContent =
      data.nombre || data.nombre_completo || "No disponible";

    // Usuario
    document.getElementById("usuario").textContent =
      data.nombre_usuario || "No disponible";

    // Correo
    document.getElementById("correo").textContent =
      data.correo || "No disponible";

    // Rol
    document.getElementById("rol").textContent =
      data.rol || "Usuario";

    // Estado
    document.getElementById("estado").textContent =
      data.estado || data.estatus_cuenta || "Activo";

    // Términos
    document.getElementById("terminos").textContent =
      data.acepto_terminos ? "Sí" : "No";

    // Avatar
    const letra =
      (data.nombre_usuario || data.nombre || "U")
      .charAt(0)
      .toUpperCase();

    document.getElementById("avatar").textContent = letra;

  } catch (error) {

    console.error(error);

    alert("Ocurrió un error al cargar el perfil");
  }
}

// Ejecutar al abrir la página
cargarPerfil();
