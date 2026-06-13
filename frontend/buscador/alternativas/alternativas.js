// buscador: alternativas - logica especifica
import { obtenerArticulo, obtenerAlternativasArticulo } from '../../assets/js/api.js';

// === MOCK PARA PRUEBAS ===
// Descomenta para probar

const MOCK_ALTERNATIVAS = {
  '2': {
    original: { id_articulo: 2, nombre_articulo: "Crema Hidratante Nivea", categoria: "cremas" },
    sugerencias: [
      {
        id_articulo: 10,
        nombre_articulo: "Crema CeraVe Hidratante",
        color_semaforo: "verde",
        score: 92,
        precio_min: 180,
        precio_max: 220,
        razon: "Sin parabenos ni fragancias"
      },
      {
        id_articulo: 11,
        nombre_articulo: "Cetaphil Loción",
        color_semaforo: "verde", 
        score: 88,
        precio_min: 160,
        precio_max: 200,
        razon: "Fórmula hipoalergénica"
      },
      {
        id_articulo: 12,
        nombre_articulo: "La Roche Posay Lipikar",
        color_semaforo: "verde", 
        score: 95,
        precio_min: 200,
        precio_max: 280,
        razon: "Agua termal calmante"
      }
    ]
  }
};



const loader = document.querySelector('#loader');
const grid = document.querySelector('#grid-alternativas');
const acciones = document.querySelector('#acciones-comparar');
const btnComparar = document.querySelector('#btn-ver-comparaciones');
const productoOriginal = document.querySelector('#producto-original');

let idOriginal = null;
let alternativasSeleccionadas = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  idOriginal = params.get('id');
  
  if (!idOriginal) {
    mostrarError('Falta ID del artículo. Usa?id=2');
    return;
  }

  await cargarAlternativas(idOriginal);
  
  document.querySelector('#btn-regresar').addEventListener('click', () => window.history.back());
  btnComparar.addEventListener('click', irAComparacion);
});

async function cargarAlternativas(id) {
  try {
    // === CÓDIGO PARA BACKEND REAL ===
    const [resArticulo, resAlternativas] = await Promise.all([
      obtenerArticulo(id),
      obtenerAlternativasArticulo(id)
    ]);
    
    if (!resArticulo.ok) throw new Error('Artículo original no encontrado');
    
    const original = resArticulo.data;
    productoOriginal.innerHTML = `${resAlternativas.data.length} alternativas para <strong>${original.nombre_articulo}</strong>, ordenadas de menor a mayor precio.`;

    if (original.color_semaforo === 'verde') {
      mostrarMensajeInfo('Tu artículo ya tiene semáforo verde. Es una de las mejores opciones.');
      return;
    }

    if (!resAlternativas.ok ||!resAlternativas.data?.length) {
      mostrarMensajeInfo('No encontramos mejores alternativas por ahora');
      return;
    }
    
    // Ordenar por precio_min ascendente
    const alternativasOrdenadas = resAlternativas.data.sort((a, b) => a.precio_min - b.precio_min);
    pintarAlternativas(alternativasOrdenadas);

    // Descomenta para probar
    
    const mock = MOCK_ALTERNATIVAS[id];
    if (!mock) {
      mostrarMensajeInfo('No hay alternativas para este artículo');
      return;
    }
    
    productoOriginal.innerHTML = `${mock.sugerencias.length} alternativas para <strong>${mock.original.nombre_articulo}</strong>, ordenadas de menor a mayor precio.`;
    pintarAlternativas(mock.sugerencias);
    



  } catch (error) {
    mostrarError(`Error de conexión: ${error.message}`);
    
    // Descomenta para probar
    
    const mock = MOCK_ALTERNATIVAS[id];
    if (mock) {
      console.warn('Backend falló, usando MOCK');
      productoOriginal.innerHTML = `${mock.sugerencias.length} alternativas para <strong>${mock.original.nombre_articulo}</strong>, ordenadas de menor a mayor precio.`;
      pintarAlternativas(mock.sugerencias);
    }
    


  }
}

function pintarAlternativas(lista) {
  grid.innerHTML = lista.map(alt => `
    <div class="card card-alternativa" data-id="${alt.id_articulo}">
      <label style="display:flex; gap:var(--space-4); align-items:center; cursor:pointer">
        <input type="checkbox" class="checkbox-alternativa" value="${alt.id_articulo}" style="width:20px; height:20px; flex-shrink:0">
        <div class="semaforo-dot" style="background:var(--color-semaforo-${alt.color_semaforo}); width:16px; height:16px; border-radius:50%; flex-shrink:0"></div>
        <div style="flex:1">
          <h3 class="text-h3" style="margin-bottom:var(--space-1)">${alt.nombre_articulo}</h3>
          <p class="text-muted">$${alt.precio_min}${alt.precio_max? ` - $${alt.precio_max}` : ''}</p>
        </div>
        <a href="../detalle-producto/detalle-producto.html?id=${alt.id_articulo}" class="btn btn--secondary" onclick="event.stopPropagation()">
          Ver
        </a>
      </label>
    </div>
  `).join('');

  // Listeners para checkboxes
  document.querySelectorAll('.checkbox-alternativa').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.value;
      if (e.target.checked) {
        alternativasSeleccionadas.add(id);
      } else {
        alternativasSeleccionadas.delete(id);
      }
      
      // Máximo 2 alternativas + el original = 3 total para comparar
      const total = alternativasSeleccionadas.size + 1;
      btnComparar.disabled = alternativasSeleccionadas.size === 0;

      if(!btnComparar.disabled){
        btnComparar.style.opacity = '1';
        btnComparar.style.cursor = 'pointer';
      } else{
        btnComparar.style.opacity = '0.5';
        btnComparar.style.cursor = 'not-allowed';
      }

      btnComparar.textContent = `Ver Comparaciones (${total})`;
      
      // Deshabilitar más checkboxes si ya hay 2 seleccionadas
      if (alternativasSeleccionadas.size >= 2) {
        document.querySelectorAll('.checkbox-alternativa:not(:checked)').forEach(box => {
          box.disabled = true;
        });
      } else {
        document.querySelectorAll('.checkbox-alternativa').forEach(box => {
          box.disabled = false;
        });
      }
    });
  });
  
  loader.classList.add('hidden');
  grid.classList.remove('hidden');
  acciones.classList.remove('hidden');
}

function irAComparacion() {
  if (alternativasSeleccionadas.size === 0) return;
  
  // Construir URL:?id=original&id=alt1&id=alt2
  const ids = [idOriginal,...Array.from(alternativasSeleccionadas)];
  const query = ids.map(id => `id=${id}`).join('&');
  window.location.href = `../comparacion/comparacion.html?${query}`;
}

function mostrarError(mensaje) {
  loader.innerHTML = `<div class="alerta alerta--error">${mensaje}</div>`;
}

function mostrarMensajeInfo(mensaje) {
  loader.innerHTML = `<div class="alerta alerta--info">${mensaje}</div>`;
}