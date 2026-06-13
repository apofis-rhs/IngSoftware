// recomendaciones: inicio - logica especifica
import { buscarArticulos } from '../../assets/js/api.js';
import { getRutaImagen }   from '../../assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '../../auth/login/login.html';
    return;
  }

  const inputRecomendacion  = document.getElementById('input-recomendacion');
  const seccionRecomendados = document.getElementById('grid-recomendados');
  const seccionPopulares    = document.getElementById('grid-populares');

  function pintarCard(articulo, contenedor) {
    const color  = articulo.color_semaforo || 'gris';
    const imgSrc = getRutaImagen(articulo, '../../');
    const precio = articulo.precio_min != null
      ? `$${articulo.precio_min} - $${articulo.precio_max}`
      : 'Precio no disponible';

    const card = document.createElement('article');
    card.className = 'product-card-grid recomendacion-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-grid__img">
        <img src="${imgSrc}"
             alt="${articulo.nombre_articulo}"
             style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);"
             onerror="this.src='../../assets/images/placeholder.svg'">
        <span class="product-card-grid__dot semaforo-dot--${color}"></span>
      </div>
      <div class="product-card-grid__info">
        <h3 class="product-card-grid__name">${articulo.nombre_articulo}</h3>
        <p class="product-card-grid__price">${precio}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.href = `../detalle-articulo/detalle-articulo.html?id=${articulo.id_articulo}`;
    });
    contenedor.appendChild(card);
  }

  const TERMINOS = ['rastrillo', 'cepillo', 'esponja', 'bolsa', 'taza'];
  if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Cargando...</p>';
  if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Cargando...</p>';

  try {
    let todos = [];
    for (const termino of TERMINOS) {
      const { ok, data } = await buscarArticulos(termino);
      if (ok && Array.isArray(data)) {
        data.forEach(a => {
          if (!todos.find(x => x.id_articulo === a.id_articulo)) todos.push(a);
        });
        if (todos.length >= 12) break;
      }
    }

    if (seccionRecomendados) {
      seccionRecomendados.innerHTML = '';
      const verdes = todos.filter(a => a.color_semaforo === 'verde').slice(0, 6);
      verdes.length > 0
        ? verdes.forEach(a => pintarCard(a, seccionRecomendados))
        : (seccionRecomendados.innerHTML = '<p class="text-muted">Sin recomendados disponibles.</p>');
    }

    if (seccionPopulares) {
      seccionPopulares.innerHTML = '';
      const otros = todos.filter(a => a.color_semaforo !== 'verde').slice(0, 6);
      if (otros.length > 0) {
        otros.forEach(a => pintarCard(a, seccionPopulares));
      } else if (todos.length > 0) {
        todos.slice(0, 6).forEach(a => pintarCard(a, seccionPopulares));
      } else {
        seccionPopulares.innerHTML = '<p class="text-muted">Sin populares disponibles.</p>';
      }
    }
  } catch (err) {
    console.error('Error cargando artículos:', err);
    if (seccionRecomendados) seccionRecomendados.innerHTML = '<p class="text-muted">Error de conexión.</p>';
    if (seccionPopulares)    seccionPopulares.innerHTML    = '<p class="text-muted">Error de conexión.</p>';
  }

  if (inputRecomendacion) {
    inputRecomendacion.addEventListener('keypress', (e) => {
      if (e.key !== 'Enter') return;
      const texto = inputRecomendacion.value.trim();
      if (!texto) return;
      window.location.href = `../resultados/resultados.html?q=${encodeURIComponent(texto)}`;
    });
  }
});
