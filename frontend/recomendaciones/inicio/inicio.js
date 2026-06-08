const inputRecomendacion = document.getElementById('input-recomendacion');
const tarjetasProductos = document.querySelectorAll('.recomendacion-card');

if (inputRecomendacion) {
  inputRecomendacion.addEventListener('input', () => {
    const busqueda = inputRecomendacion.value.toLowerCase().trim();

    tarjetasProductos.forEach(card => {
      const nombreProducto = card.dataset.producto.toLowerCase();

      card.style.display = nombreProducto.includes(busqueda) ? '' : 'none';
    });
  });
}