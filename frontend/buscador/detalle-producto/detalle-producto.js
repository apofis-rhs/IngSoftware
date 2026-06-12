// detalle producto - logica especifica
import { obtenerProducto, logout } from '../../assets/js/api.js';

   /* Usar para provar si en back esta caido
   const MOCK_PRODUCTOS = {
     '1': {
       id_producto: 1,
       nombre_producto: "Shampoo Neutro Esi",
       precio_min: 120,
       precio_max: 180,
       disponibilidad: "En stock",
       color_semaforo: "verde",
       estado_evaluacion: "aprobado",
       explicacion_semaforo: "Este producto no contiene ingredientes con evidencia de riesgo.",
       fecha_evaluacion: "2026-06-08",
       ingredientes: [
         { nombre: "Aqua", nivel_riesgo: "bajo" },
         { nombre: "Sodium Laureth Sulfate", nivel_riesgo: "medio" },
         { nombre: "Cocamidopropyl Betaine", nivel_riesgo: "bajo" },
         { nombre: "Parfum", nivel_riesgo: "alto" }
       ]
     }
   };*/

const loader = document.querySelector('#loader');
const contenido = document.querySelector('#contenido-producto');

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  
  if (!id) {
    mostrarError('No se especificó ID de producto');
    return;
  }

  await cargarProducto(id);
  setupEventos();
});

async function cargarProducto(id) {
  try {
    const { ok, data, error } = await obtenerProducto(id);
    /*Usar para provar si el back esta caido
    const ok = true;
    const data = MOCK_PRODUCTOS[id];*/
    
    if (!ok) {
      mostrarError(error?.mensaje || 'Producto no encontrado');
      return;
    }

    document.querySelector('#nombre-producto').textContent = data.nombre_producto;
    document.querySelector('#precio').textContent = `$${data.precio_min} - $${data.precio_max}`;
    document.querySelector('#disponibilidad').textContent = data.disponibilidad;
    document.querySelector('#fecha-evaluacion').textContent = formatearFecha(data.fecha_evaluacion);
    document.querySelector('#explicacion-semaforo').textContent = data.explicacion_semaforo;
    
    const colorFinal = data.estado_evaluacion === 'insuficiente' ? 'gris' : data.color_semaforo;
    document.querySelector('#semaforo-dot').style.background = `var(--color-semaforo-${colorFinal})`;
    
    const estados = {
      'aprobado': 'Aprobado',
      'precaucion': 'Usar con precaución', 
      'no_recomendado': 'No recomendado',
      'insuficiente': 'Datos insuficientes'
    };
    document.querySelector('#estado-evaluacion').textContent = estados[data.estado_evaluacion] || data.estado_evaluacion;

    const listaIng = document.querySelector('#lista-ingredientes');
    if (data.ingredientes && data.ingredientes.length > 0) {
      listaIng.innerHTML = data.ingredientes.map(ing => {
        const color = ing.nivel_riesgo === 'alto' ? 'rojo' : 
                      ing.nivel_riesgo === 'medio' ? 'amarillo' : 'verde';
        return `
          <div class="list-item">
            <div class="list-item__dot" style="background:var(--color-semaforo-${color})"></div>
            <span class="list-item__text">${ing.nombre}</span>
          </div>
        `;
      }).join('');
    } else {
      listaIng.innerHTML = `<p class="text-muted">No hay ingredientes registrados</p>`;
    }

    loader.classList.add('hidden');
    contenido.classList.remove('hidden');

  } catch (error) {
    mostrarError(`Error de conexión: ${error.message}`);
  }
}

function setupEventos() {
  document.querySelector('#btn-regresar').addEventListener('click', () => {
    window.history.back();
  });

  document.querySelector('#btn-analisis').addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    window.location.href = `../analisis/analisis.html?id=${id}`;
  });

  document.querySelector('#btn-favorito').addEventListener('click', async () => {
    // Aquí luego conectas con tu endpoint de favoritos
    alert('Guardado en favoritos');
  });

  document.querySelector('#btn-cerrar-sesion')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = '../../auth/login/login.html';
  });

  document.querySelector('#btn-cerrar-sesion-mobile')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = '../../auth/login/login.html';
  });
}

function mostrarError(mensaje) {
  loader.innerHTML = `<div class="alerta alerta--error">${mensaje}</div>`;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
}