// comparacion - logica especifica
import { compararProductos } from '../../assets/js/api.js';

// === MOCK PARA PRUEBAS  ===
// Descomenta para probar

const MOCK_COMPARACION = [
  {
    id_producto: 1,
    nombre_producto: "Shampoo Neutro Esi",
    color_semaforo: "verde",
    estado_evaluacion: "aprobado",
    precio_min: 120,
    ingredientes_riesgo: ["Parfum"],
    score: 95
  },
  {
    id_producto: 2,
    nombre_producto: "Crema Hidratante Nivea", 
    color_semaforo: "amarillo",
    estado_evaluacion: "precaucion",
    precio_min: 90,
    ingredientes_riesgo: ["Methylparaben"],
    score: 72
  },
  {
    id_producto: 3,
    nombre_producto: "Jabón Dove", 
    color_semaforo: "rojo",
    estado_evaluacion: "no_recomendado",
    precio_min: 50,
    ingredientes_riesgo: ["SLS", "Parfum"],
    score: 40
  }
];




const loader = document.querySelector('#loader');
const contenido = document.querySelector('#contenido-comparacion');
const gridProductos = document.querySelector('#grid-productos');

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const ids = params.getAll('id').map(Number);
  
  if (ids.length < 2) {
    mostrarError('Necesitas al menos 2 productos. Usa?id=1&id=2');
    return;
  }
  if (ids.length > 3) {
    mostrarError('Máximo 3 productos para comparar');
    return;
  }

  await cargarComparacion(ids);
  
  document.querySelector('#btn-regresar').addEventListener('click', () => window.history.back());
});

async function cargarComparacion(ids) {
  try {
    const res = await compararProductos(ids);
    
    if (!res.ok) {
      throw new Error(res.error || 'No se pudieron comparar los productos');
    }
    
    pintarComparacion(res.data);

    // Descomenta para probar
    
    console.warn('Backend falló, usando MOCK');
    pintarComparacion(MOCK_COMPARACION.slice(0, ids.length));
    



  } catch (error) {
    mostrarError(`Error de conexión: ${error.message}`);
    
    // Descomenta para probar
    
    console.warn('Fetch falló, usando MOCK');
    pintarComparacion(MOCK_COMPARACION.slice(0, ids.length));
    

    
  }
}

function pintarComparacion(productos) {
  if (productos.length < 2) {
    mostrarError('Se requieren al menos 2 productos válidos');
    return;
  }

  // 1. Pintar cards de productos dinámicamente
  gridProductos.style.gridTemplateColumns = `repeat(${productos.length}, 1fr)`;
  gridProductos.innerHTML = productos.map(p => `
    <div class="card text-center">
      <div class="semaforo-dot" style="margin:0 auto var(--space-3); width:50px; height:50px; border-radius:50%; background:var(--color-semaforo-${p.color_semaforo})"></div>
      <h3 class="text-h3">${p.nombre_producto}</h3>
      <p class="text-bold">${formatearEstado(p.estado_evaluacion)}</p>
    </div>
  `).join('');

  // 2. Tabla de comparación dinámica
  const tabla = document.querySelector('#tabla-comparacion');
  const headers = productos.map(p => `<div class="text-center text-bold">${p.nombre_producto}</div>`).join('');
  
  tabla.innerHTML = `
    <div style="display:grid; grid-template-columns:150px repeat(${productos.length}, 1fr); gap:var(--space-3); font-weight:bold; margin-bottom:var(--space-2)">
      <div>Atributo</div>
      ${headers}
    </div>
    ${filaComparacion('Precio', productos.map(p => `$${p.precio_min}`), 'precio_min')}
    ${filaComparacion('Score LUMIKA', productos.map(p => p.score), 'score', true)}
    ${filaComparacion('Ingredientes de riesgo', productos.map(p => p.ingredientes_riesgo.length), 'ingredientes_riesgo')}
  `;

  // 3. Recomendación: el de mayor score
  const ganador = productos.reduce((max, p) => p.score > max.score? p : max, productos[0]);
  document.querySelector('#texto-recomendacion').textContent = 
    `${ganador.nombre_producto} tiene mejor evaluación general con score de ${ganador.score}.`;

  loader.classList.add('hidden');
  contenido.classList.remove('hidden');
}

function filaComparacion(label, valores, key, mayorEsMejor = false) {
  const numericos = valores.map(v => typeof v === 'string'? parseFloat(v.replace('$', '')) : v);
  const mejorValor = mayorEsMejor? Math.max(...numericos) : Math.min(...numericos);
  
  const celdas = valores.map((val, i) => {
    const esMejor = numericos[i] === mejorValor;
    return `<div class="text-center ${esMejor? 'text-bold' : ''}" style="color:${esMejor? 'var(--color-semaforo-verde)' : ''}">${val}</div>`;
  }).join('');

  return `
    <div style="display:grid; grid-template-columns:150px repeat(${valores.length}, 1fr); gap:var(--space-3); padding:var(--space-2) 0; border-bottom:1px solid var(--color-border)">
      <div class="text-muted">${label}</div>
      ${celdas}
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