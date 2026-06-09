// comparacion - logica especifica
import { obtenerProducto } from '../../assets/js/api.js';

// === MOCK PARA PRUEBAS SIN BACKEND ===
// Descomenta este objeto si el backend no responde
/*
const MOCK_COMPARACION = {
  '1': {
    id_producto: 1,
    nombre_producto: "Shampoo Neutro Esi",
    color_semaforo: "verde",
    estado_evaluacion: "aprobado",
    precio_min: 120,
    ingredientes_riesgo: ["Parfum"],
    score: 95
  },
  '2': {
    id_producto: 2,
    nombre_producto: "Crema Hidratante Nivea", 
    color_semaforo: "amarillo",
    estado_evaluacion: "precaucion",
    precio_min: 90,
    ingredientes_riesgo: ["Methylparaben"],
    score: 72
  }
};
*/

const loader = document.querySelector('#loader');
const contenido = document.querySelector('#contenido-comparacion');

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id1 = params.get('id1');
  const id2 = params.get('id2');
  
  if (!id1 ||!id2) {
    mostrarError('Faltan IDs para comparar. Usa?id1=1&id2=2');
    return;
  }

  await cargarComparacion(id1, id2);
  
  document.querySelector('#btn-regresar').addEventListener('click', () => window.history.back());
});

async function cargarComparacion(id1, id2) {
  try {
    // === CÓDIGO PARA BACKEND REAL ===
    const [res1, res2] = await Promise.all([
      obtenerProducto(id1),
      obtenerProducto(id2)
    ]);
    
    if (!res1.ok ||!res2.ok) {
      throw new Error('Uno de los productos no se encontró en el backend');
    }
    
    pintarComparacion(res1.data, res2.data);

    // Descomenta este objeto si el backend no responde
    /*
    console.warn('Backend falló, usando MOCK');
    const p1 = MOCK_COMPARACION[id1];
    const p2 = MOCK_COMPARACION[id2];
    
    if (!p1 ||!p2) {
      throw new Error('Producto no existe en el mock');
    }
    
    pintarComparacion(p1, p2);
    */


  } catch (error) {
    mostrarError(`Error de conexión: ${error.message}`);
    
    // Descomenta este objeto si el backend no responde
    /*
    const p1 = MOCK_COMPARACION[id1];
    const p2 = MOCK_COMPARACION[id2];
    if (p1 && p2) {
      console.warn('Fetch falló, usando MOCK');
      pintarComparacion(p1, p2);
    } else {
      mostrarError(`Error: ${error.message}`);
    }
    */

  }
}

function pintarComparacion(p1, p2) {
  document.querySelector('#nombre-1').textContent = p1.nombre_producto;
  document.querySelector('#semaforo-1').style.background = `var(--color-semaforo-${p1.color_semaforo})`;
  document.querySelector('#estado-1').textContent = formatearEstado(p1.estado_evaluacion);

  document.querySelector('#nombre-2').textContent = p2.nombre_producto;
  document.querySelector('#semaforo-2').style.background = `var(--color-semaforo-${p2.color_semaforo})`;
  document.querySelector('#estado-2').textContent = formatearEstado(p2.estado_evaluacion);

  const tabla = document.querySelector('#tabla-comparacion');
  tabla.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:var(--space-3); font-weight:bold; margin-bottom:var(--space-2)">
      <div>Atributo</div>
      <div class="text-center">${p1.nombre_producto}</div>
      <div class="text-center">${p2.nombre_producto}</div>
    </div>
    ${filaComparacion('Precio', `$${p1.precio_min}`, `$${p2.precio_min}`, p1.precio_min < p2.precio_min)}
    ${filaComparacion('Score LUMIKA', p1.score, p2.score, p1.score > p2.score)}
    ${filaComparacion('Ingredientes de riesgo', p1.ingredientes_riesgo.length, p2.ingredientes_riesgo.length, p1.ingredientes_riesgo.length < p2.ingredientes_riesgo.length)}
  `;

  const ganador = p1.score > p2.score? p1 : p2;
  document.querySelector('#texto-recomendacion').textContent = 
    `${ganador.nombre_producto} tiene mejor evaluación general con score de ${ganador.score}.`;

  loader.classList.add('hidden');
  contenido.classList.remove('hidden');
}

function filaComparacion(label, val1, val2, gano1) {
  return `
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:var(--space-3); padding:var(--space-2) 0; border-bottom:1px solid var(--color-border)">
      <div class="text-muted">${label}</div>
      <div class="text-center ${gano1? 'text-bold' : ''}" style="color:${gano1? 'var(--color-semaforo-verde)' : ''}">${val1}</div>
      <div class="text-center ${!gano1? 'text-bold' : ''}" style="color:${!gano1? 'var(--color-semaforo-verde)' : ''}">${val2}</div>
    </div>
  `;
}

function formatearEstado(estado) {
  const estados = {
    'aprobado': 'Aprobado',
    'precaucion': 'Precaución', 
    'no_recomendado': 'No recomendado',
    'insuficiente': 'Sin datos'
  };
  return estados[estado] || estado;
}

function mostrarError(mensaje) {
  loader.innerHTML = `<div class="alerta alerta--error">${mensaje}</div>`;
}