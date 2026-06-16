import { compararProductos } from '/assets/js/api.js';
import { getRutaImagen }     from '/assets/js/imagenes.js';

const loader   = document.querySelector('#loader');
const contenido = document.querySelector('#contenido-comparacion');
const gridProductos = document.querySelector('#grid-productos');

['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', e => {
    e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('usuario');
    window.location.href = '/auth/login/login.html';
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  const params = new URLSearchParams(window.location.search);
  const ids = params.getAll('id').map(Number).filter(Boolean);

  if (ids.length < 2) { mostrarError('Necesitas al menos 2 productos. Usa ?id=1&id=2'); return; }
  if (ids.length > 3) { mostrarError('Máximo 3 productos para comparar'); return; }

  await cargarComparacion(ids);
  document.querySelector('#btn-regresar')?.addEventListener('click', () => window.history.back());
});

async function cargarComparacion(ids) {
  try {
    const { ok, data } = await compararProductos(ids);
    if (!ok || !data?.length) throw new Error(data?.error || 'Sin datos');
    pintarComparacion(data);
  } catch (err) {
    mostrarError(`Error: ${err.message}`);
  }
}

function pintarComparacion(productos) {
  if (productos.length < 2) { mostrarError('Se requieren al menos 2 productos válidos'); return; }

  // Cards superiores
  gridProductos.style.gridTemplateColumns = `repeat(${productos.length}, 1fr)`;
  gridProductos.innerHTML = productos.map(p => {
    const color = p.estado_evaluacion === 'insuficiente' ? 'gris' : (p.color_semaforo || 'gris');
    const img   = getRutaImagen(p);
    const precio = p.precio_min != null ? `$${p.precio_min} – $${p.precio_max}` : '—';
    return `
      <div class="card text-center" style="padding:var(--space-4)">
        <img src="${img}" alt="${p.nombre_producto}"
             style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);margin:0 auto var(--space-3)"
             onerror="this.src='../../assets/images/placeholder.svg'">
        <div class="semaforo-dot"
             style="margin:0 auto var(--space-2);width:36px;height:36px;border-radius:50%;background:var(--color-semaforo-${color})"></div>
        <h3 class="text-h3" style="margin-bottom:var(--space-1)">${p.nombre_producto}</h3>
        <p class="text-muted" style="font-size:.85rem">${precio}</p>
        <p class="text-bold" style="margin-top:var(--space-1)">${formatEstado(p.estado_evaluacion)}</p>
      </div>`;
  }).join('');

  // Tabla comparativa
  const tabla = document.querySelector('#tabla-comparacion');
  if (tabla) {
    const cols = productos.length;
    const fila = (label, vals, mayorMejor = false) => {
      const nums = vals.map(v => parseFloat(String(v).replace(/[^0-9.]/g,'')) || 0);
      const mejor = mayorMejor ? Math.max(...nums) : Math.min(...nums);
      const celdas = vals.map((v, i) => {
        const esM = nums[i] === mejor;
        return `<div class="text-center ${esM?'text-bold':''}" style="color:${esM?'var(--color-semaforo-verde)':'inherit'}">${v}</div>`;
      }).join('');
      return `<div style="display:grid;grid-template-columns:140px repeat(${cols},1fr);gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--color-border)">
        <div class="text-muted">${label}</div>${celdas}</div>`;
    };

    const header = `<div style="display:grid;grid-template-columns:140px repeat(${cols},1fr);gap:var(--space-3);font-weight:700;margin-bottom:var(--space-2)">
      <div>Atributo</div>${productos.map(p=>`<div class="text-center">${p.nombre_producto}</div>`).join('')}</div>`;

    tabla.innerHTML = header
      + fila('Precio mín.', productos.map(p => p.precio_min != null ? `$${p.precio_min}` : '—'))
      + fila('Precio máx.', productos.map(p => p.precio_max != null ? `$${p.precio_max}` : '—'))
      + fila('Semáforo', productos.map(p => p.color_semaforo || '—'))
      + fila('Criterios cumplidos',
          productos.map(p => p.criterios?.filter(c=>c.resultado==='cumple').length ?? '—'),
          true);
  }

  // Recomendación: producto con más criterios cumplidos
  const elRec = document.querySelector('#texto-recomendacion');
  if (elRec) {
    const ganador = productos.reduce((m, p) => {
      const pts = (p.criterios?.filter(c=>c.resultado==='cumple').length || 0)
                + (p.criterios?.filter(c=>c.resultado==='parcial').length || 0) * 0.5;
      return pts > (m._pts||0) ? {...p, _pts:pts} : m;
    }, {_pts:-1});
    elRec.textContent = ganador.nombre_producto
      ? `${ganador.nombre_producto} es la opción con mejor evaluación ambiental.`
      : 'Compara los productos para tomar la mejor decisión.';
  }

  loader?.classList.add('hidden');
  contenido?.classList.remove('hidden');
}

function formatEstado(e) {
  return {aprobado:'Aprobado', precaucion:'Precaución',
          no_recomendado:'No recomendado', insuficiente:'Sin datos'}[e] || e || '—';
}

function mostrarError(msg) {
  if (loader) loader.innerHTML = `<div class="alerta alerta--error">${msg}</div>`;
}
