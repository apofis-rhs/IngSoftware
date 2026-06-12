import {
    enviarEvaluacion,
    estaLogueado
} from "../../assets/js/api.js";

// Verificar sesión
if (!estaLogueado()) {

    window.location.href =
        "../../auth/login/login.html";

}

let calificacion = 0;

const estrellas =
    document.querySelectorAll(".star");

// Selección de estrellas
estrellas.forEach(star => {

    // Hover
    star.addEventListener("mouseover", () => {

        const valor =
            Number(star.dataset.value);

        pintarEstrellas(valor);

    });

    // Click
    star.addEventListener("click", () => {

        calificacion =
            Number(star.dataset.value);

        pintarEstrellas(calificacion);

    });

});

// Cuando el mouse sale del grupo,
// vuelve a mostrar la selección actual
document.getElementById("estrellas")
    .addEventListener("mouseleave", () => {

        pintarEstrellas(calificacion);

    });

// Función para pintar estrellas
function pintarEstrellas(valorSeleccionado) {

    estrellas.forEach(star => {

        const valor =
            Number(star.dataset.value);

        if (valor <= valorSeleccionado) {

            star.classList.add(
                "star--filled"
            );

        } else {

            star.classList.remove(
                "star--filled"
            );

        }

    });

}

// Mostrar mensajes
function mostrarMensaje(texto, tipo) {

    document.getElementById("mensaje")
        .innerHTML = `
        <div class="alerta alerta--${tipo}">
            ${texto}
        </div>
    `;

}

// Enviar evaluación
document
    .getElementById("btnEnviar")
    .addEventListener("click", async () => {

        if (calificacion === 0) {

            mostrarMensaje(
                "Selecciona una calificación.",
                "warning"
            );

            return;
        }

        const comentario =
            document.getElementById(
                "comentario"
            ).value.trim();

        try {

            // Temporal
            const idProducto = 1;

            const { ok } =
                await enviarEvaluacion(
                    idProducto,
                    calificacion,
                    comentario
                );

            if (ok) {

                mostrarMensaje(
                    "Evaluación enviada correctamente.",
                    "success"
                );

                document.getElementById(
                    "comentario"
                ).value = "";

                calificacion = 0;

                pintarEstrellas(0);

            } else {

                mostrarMensaje(
                    "No fue posible enviar la evaluación.",
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

    });