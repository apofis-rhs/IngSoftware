// buscador: alternativas - logica especifica
import { obtenerArticulo, obtenerAlternativasArticulo } from '../../assets/js/api.js';

const loader = document.querySelector('#loader');
const grid = document.querySelector('#grid-alternativas');
const acciones = document.querySelector('#acciones-comparar');
const btnComparar = document.querySelector('#btn-ver-comparaciones');
const productoOriginal = document.querySelector('#producto-original');

let idOriginal = null;
let alternativasSeleccionadas = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  // Redirige si no hay token
  if (!localStorage.getItem('token')) {
    window.location.href = '../../auth/login/login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  idOriginal = params.get('id');

  if (!idOriginal) {
    mostrarError('Falta el ID del artículo. Usa ?id=2');
    return;
  }

  await cargarAlternativas(idOriginal);

  document.querySelector('#btn-regresar')?.addEventListener('click', () => window.history.back());
  btnComparar?.addEventListener('click', irAComparacion);
});

async function cargarAlternativas(id) {
  try {
    const [resArticulo, resAlternativas] = await Promise.all([
      obtenerArticulo(id),
      obtenerAlternativasArticulo(id)
    ]);

    if (!resArticulo.ok) {
      mostrarError('Artículo original no encontrado');
      return;
    }

    const original = resArticulo.data;

    // Si ya es verde, no necesita alternativas
    if (original.color_semaforo === 'verde') {
      if (productoOriginal) {
        productoOriginal.innerHTML = `<strong>${original.nombre_articulo}</strong> ya tiene semáforo verde. ¡Es una de las mejores opciones!`;
      }
      loader?.classList.add('hidden');
      grid.innerHTML = `<div class="alerta alerta--info">Este artículo ya es la mejor opción disponible.</div>`;
      grid?.classList.remove('hidden');
      return;
    }

    if (!resAlternativas.ok || !resAlternativas.data?.length) {
      if (productoOriginal) {
        productoOriginal.innerHTML = `No encontramos alternativas para <strong>${original.nombre_articulo}</strong> por ahora.`;
      }
      loader?.classList.add('hidden');
      grid.innerHTML = `<div class="alerta alerta--warning">No hay alternativas disponibles en este momento.</div>`;
      grid?.classList.remove('hidden');
      return;
    }

    // Ordenar por precio_min ascendente
    const alternativasOrdenadas = [...resAlternativas.data].sort((a, b) => (a.precio_min || 0) - (b.precio_min || 0));

    if (productoOriginal) {
      productoOriginal.innerHTML = `${alternativasOrdenadas.length} alternativas para <strong>${original.nombre_articulo}</strong>, ordenadas de menor a mayor precio.`;
    }

    pintarAlternativas(alternativasOrdenadas);

  } catch (error) {
    console.error('Error cargando alternativas:', error);
    mostrarError(`Error de conexión: ${error.message}`);
  }
}

function pintarAlternativas(lista) {
  grid.innerHTML = lista.map(alt => {
    const color = alt.color_semaforo || 'gris';
    const precio = alt.precio_min != null
      ? `$${alt.precio_min}${alt.precio_max ? ` - $${alt.precio_max}` : ''}`
      : 'Precio no disponible';
    return `
      <div class="card card-alternativa" data-id="${alt.id_articulo}">
        <label style="display:flex; gap:var(--space-4); align-items:center; cursor:pointer">
          <input type="checkbox" class="checkbox-alternativa" value="${alt.id_articulo}" style="width:20px; height:20px; flex-shrink:0">
          <div class="semaforo-dot" style="background:var(--color-semaforo-${color}); width:16px; height:16px; border-radius:50%; flex-shrink:0"></div>
          <div style="flex:1">
            <h3 class="text-h3" style="margin-bottom:var(--space-1)">${alt.nombre_articulo}</h3>
            <p class="text-muted">${precio}</p>
          </div>
          <a href="../detalle-producto/detalle-producto.html?id=${alt.id_articulo}"
             class="btn btn--secondary"
             onclick="event.stopPropagation()">
            Ver
          </a>
        </label>
      </div>
    `;
  }).join('');

  // Listeners checkboxes
  document.querySelectorAll('.checkbox-alternativa').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.value;
      if (e.target.checked) {
        alternativasSeleccionadas.add(id);
      } else {
        alternativasSeleccionadas.delete(id);
      }

      const haySeleccion = alternativasSeleccionadas.size > 0;
      btnComparar.disabled = !haySeleccion;
      btnComparar.style.opacity = haySeleccion ? '1' : '0.5';
      btnComparar.style.cursor = haySeleccion ? 'pointer' : 'not-allowed';
      btnComparar.textContent = `Ver Comparaciones (${alternativasSeleccionadas.size + 1})`;

      // Máximo 2 alternativas (+ el original = 3 total)
      if (alternativasSeleccionadas.size >= 2) {
        document.querySelectorAll('.checkbox-alternativa:not(:checked)').forEach(box => { box.disabled = true; });
      } else {
        document.querySelectorAll('.checkbox-alternativa').forEach(box => { box.disabled = false; });
      }
    });
  });

  loader?.classList.add('hidden');
  grid?.classList.remove('hidden');
  acciones?.classList.remove('hidden');
}

function irAComparacion() {
  if (alternativasSeleccionadas.size === 0) return;
  const ids = [idOriginal, ...Array.from(alternativasSeleccionadas)];
  const query = ids.map(id => `id=${id}`).join('&');
  window.location.href = `../comparacion/comparacion.html?${query}`;
}

function mostrarError(mensaje) {
  loader.innerHTML = `<div class="alerta alerta--error">${mensaje}</div>`;
}
