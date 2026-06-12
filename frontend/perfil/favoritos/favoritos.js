import {
    obtenerHistorial,
    estaLogueado
} from "../../assets/js/api.js";

// Verificar sesión
if (!estaLogueado()) {

    window.location.href =
        "../../auth/login/login.html";

}

// Cargar historial
async function cargarHistorial() {

    const contenedor =
        document.getElementById(
            "historial-container"
        );

    try {

        const { ok, data } =
            await obtenerHistorial();

        if (!ok) {

            contenedor.innerHTML = `
                <div class="alerta alerta--error">
                    No fue posible cargar el historial.
                </div>
            `;

            return;
        }

        if (!data.length) {

            contenedor.innerHTML = `
                <div class="card historial-vacio">
                    No hay consultas registradas.
                </div>
            `;

            return;
        }

        contenedor.innerHTML = "";

        data.forEach(item => {

            contenedor.innerHTML += `

                <div class="list-item-full">

                    <div
                        class="list-item-full__dot"
                        style="background:${obtenerColor(item.color_semaforo)}">
                    </div>

                    <div class="list-item-full__info">

                        <div class="list-item-full__name">
                            ${item.nombre_producto}
                        </div>

                        <div class="list-item-full__sub">
                            ${item.fecha_consulta}
                        </div>

                    </div>

                </div>

            `;
        });

    } catch (error) {

        console.error(error);

        contenedor.innerHTML = `
            <div class="alerta alerta--error">
                Error al cargar historial.
            </div>
        `;
    }
}

// Color del semáforo
function obtenerColor(color) {

    switch (color) {

        case "verde":
            return "#BAC423";

        case "amarillo":
            return "#FFD460";

        case "rojo":
            return "#FF4A58";

        default:
            return "#9E9E9E";
    }
}

// Iniciar pantalla
cargarHistorial();