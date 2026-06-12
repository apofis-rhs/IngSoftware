import {
    cambiarContrasena,
    estaLogueado
} from "../../assets/js/api.js";

if (!estaLogueado()) {

    window.location.href =
        "../../auth/login/login.html";

}

function mostrarMensaje(texto, tipo) {

    document.getElementById("mensaje")
        .innerHTML = `
        <div class="alerta alerta--${tipo}">
            ${texto}
        </div>
    `;
}

async function actualizarContrasena() {

    const actual =
        document.getElementById(
            "contrasenaActual"
        ).value;

    const nueva =
        document.getElementById(
            "nuevaContrasena"
        ).value;

    const confirmar =
        document.getElementById(
            "confirmarContrasena"
        ).value;

    if (!actual || !nueva || !confirmar) {

        mostrarMensaje(
            "Completa todos los campos.",
            "warning"
        );

        return;
    }

    if (nueva !== confirmar) {

        mostrarMensaje(
            "Las contraseñas no coinciden.",
            "error"
        );

        return;
    }

    try {

        const { ok } =
            await cambiarContrasena(
                actual,
                nueva
            );

        if (ok) {

            mostrarMensaje(
                "Contraseña actualizada correctamente.",
                "success"
            );

            document.getElementById(
                "contrasenaActual"
            ).value = "";

            document.getElementById(
                "nuevaContrasena"
            ).value = "";

            document.getElementById(
                "confirmarContrasena"
            ).value = "";

        } else {

            mostrarMensaje(
                "No fue posible actualizar la contraseña.",
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

document
    .getElementById("btnCambiar")
    .addEventListener(
        "click",
        actualizarContrasena
    );