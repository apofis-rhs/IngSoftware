import {
    obtenerPerfil,
    editarPerfil,
    estaLogueado
} from "../../assets/js/api.js";

// Verificar sesión
if (!estaLogueado()) {
    window.location.href =
        "../../auth/login/login.html";
}

// Cargar información actual
async function cargarPerfil() {

    try {

        const { ok, data } = await obtenerPerfil();

        if (!ok) {
            mostrarMensaje(
                "No fue posible cargar el perfil.",
                "error"
            );
            return;
        }

        console.log("Perfil:", data);

        document.getElementById("nombre").value =
            data.nombre || "";

        document.getElementById("usuario").value =
            data.nombre_usuario || "";

        document.getElementById("correo").value =
            data.correo || "";

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "Ocurrió un error al cargar el perfil.",
            "error"
        );
    }
}

// Guardar cambios
async function guardarCambios() {

    const datos = {

        nombre:
            document.getElementById("nombre").value.trim(),

        nombre_usuario:
            document.getElementById("usuario").value.trim(),

        correo:
            document.getElementById("correo").value.trim()

    };

    try {

        const { ok } = await editarPerfil(datos);

        if (ok) {

            mostrarMensaje(
                "Perfil actualizado correctamente.",
                "success"
            );

        } else {

            mostrarMensaje(
                "No fue posible actualizar el perfil.",
                "error"
            );
        }

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "Ocurrió un error inesperado.",
            "error"
        );
    }
}

// Mostrar alertas
function mostrarMensaje(texto, tipo) {

    const mensaje =
        document.getElementById("mensaje");

    mensaje.innerHTML = `
        <div class="alerta alerta--${tipo}">
            ${texto}
        </div>
    `;
}

// Evento botón guardar
document
    .getElementById("btnGuardar")
    .addEventListener("click", guardarCambios);

// Iniciar pantalla
cargarPerfil();
