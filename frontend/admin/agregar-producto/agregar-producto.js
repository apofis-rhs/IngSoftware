// agregar producto - logica especifica

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const esEdicion = urlParams.get('edit');

    if (esEdicion === 'true') {
        // Transforma la pantalla a modo "Editar" automáticamente
        document.getElementById('form-title').innerText = 'Editar producto';
        document.getElementById('feedback-message').innerText = 'Editado Correctamente';
        
        // Muestra el input de precio mínimo
        const campoPrecio = document.getElementById('precio-field');
        campoPrecio.classList.remove('hidden-field');
        campoPrecio.classList.add('visible-field');

        // Mueve el foco activo del Navbar al módulo de edición
        document.getElementById('nav-add-link').classList.remove('active');
    }
});

function enviarFormulario(event) {
    event.preventDefault();
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('open');

    setTimeout(() => {
        modal.classList.remove('open');
        window.location.href = './gestionar-productos.html';
    }, 2000);
}