let selectId = null;

function abrirModalEliminar(id) {
    selectId = id;
    document.getElementById('delete-modal').classList.add('open');
}

document.getElementById('cancel-delete-btn').addEventListener('click', () => {
    document.getElementById('delete-modal').classList.remove('open');
});

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    if (selectId) {
        document.querySelector(`.product-item[data-id="${selectId}"]`).remove();
        document.getElementById('delete-modal').classList.remove('open');
    }
});

function redirigirEditar(id) {
    window.location.href = `./agregar-producto.html?edit=true&id=${id}`;
}