// buscador: inicio - logica especifica
import { buscarProductos } from '../../assets/js/api.js';
import { getRutaImagen }   from '../../assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  const inputBusqueda          = document.getElementById('input-busqueda');
  const contenedorRecomendados = document.getElementById('recomendados');
  const contenedorPopulares    = document.getElementById('populares');
  const loader                 = document.getElementById('loader');

  if (!localStorage.getItem('token')) {
    window.location.href = '../../auth/login/login.html';
    return;
  }

  function pintarCard(producto, contenedor) {
    const colorFinal = producto.estado_evaluacion === 'insuficiente'
      ? 'gris' : (producto.color_semaforo || 'gris');

    const imgSrc = getRutaImagen(producto, '../../');
    const precio = producto.precio_min != null
      ? `$${producto.precio_min} - $${producto.precio_max}`
      : 'Precio no disponible';

    const card = document.createElement('div');
    card.className = 'product-card-grid';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-grid__img">
        <img src="${imgSrc}"
             alt="${producto.nombre_producto}"
             style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);"
             onerror="this.src='../../assets/images/placeholder.svg'">
        <div class="product-card-grid__dot semaforo-dot--${colorFinal}"></div>
      </div>
      <div class="product-card-grid__info">
        <p class="product-card-grid__name">${producto.nombre_producto}</p>
        <p class="product-card-grid__price">${precio}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.href = `../detalle-producto/detalle-producto.html?id=${producto.id_producto}`;
    });
    contenedor.appendChild(card);
  }

  const TERMINOS = ['shampoo', 'crema', 'jabon', 'locion', 'gel'];
  loader.style.display = 'block';

  try {
    let todos = [];
    for (const termino of TERMINOS) {
      const { ok, data } = await buscarProductos(termino);
      if (ok && Array.isArray(data)) {
        data.forEach(p => {
          if (!todos.find(x => x.id_producto === p.id_producto)) todos.push(p);
        });
        if (todos.length >= 12) break;
      }
    }

    const verdes = todos.filter(p => p.color_semaforo === 'verde' && p.estado_evaluacion !== 'insuficiente').slice(0, 6);
    const resto  = todos.filter(p => p.color_semaforo !== 'verde').slice(0, 6);

    if (verdes.length > 0) {
      verdes.forEach(p => pintarCard(p, contenedorRecomendados));
    } else {
      contenedorRecomendados.innerHTML = '<p class="text-muted">Sin recomendados disponibles.</p>';
    }

    if (resto.length > 0) {
      resto.forEach(p => pintarCard(p, contenedorPopulares));
    } else {
      todos.slice(0, 6).forEach(p => pintarCard(p, contenedorPopulares));
    }
  } catch (err) {
    console.error('Error cargando secciones:', err);
    contenedorRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    contenedorPopulares.innerHTML    = '<p class="text-muted">Error de conexión.</p>';
  } finally {
    loader.style.display = 'none';
  }

  inputBusqueda.addEventListener('keypress', (e) => {
    if (e.key !== 'Enter') return;
    const texto = inputBusqueda.value.trim();
    if (!texto) return;
    window.location.href = `../resultados/resultados.html?q=${encodeURIComponent(texto)}`;
  });
});
