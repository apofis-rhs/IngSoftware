// recomendaciones: inicio - logica especifica
const inputRecomendacion = document.getElementById('input-recomendacion');
const tarjetasProductos = document.querySelectorAll('.recomendacion-card');

if (inputRecomendacion) {
  inputRecomendacion.addEventListener('input', () => {
    const busqueda = inputRecomendacion.value.toLowerCase().trim();

    tarjetasProductos.forEach(card => {
      const nombreProducto = card.dataset.producto.toLowerCase();

      if (nombreProducto.includes(busqueda)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}