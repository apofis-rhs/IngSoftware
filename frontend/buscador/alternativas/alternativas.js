import { obtenerAlternativasProducto, obtenerProducto } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idProdOriginal = urlParams.get('id');

    if (!idProdOriginal) {
        window.location.href = '../inicio/inicio.html';
        return;
    }

    // 1. Obtener datos del producto original para el título
    const { ok: okOrig, data: prodOriginal } = await obtenerProducto(idProdOriginal);
    if (okOrig) {
        const el = document.getElementById('producto-original');
        if (el) el.innerHTML = `Para el producto: <strong>${prodOriginal.nombre_producto}</strong>`;
    }

    // 2. Obtener alternativas usando tu API centralizada
    const gridAlternativas = document.getElementById('grid-alternativas');
    const { ok, data: alternativas } = await obtenerAlternativasProducto(idProdOriginal);

    if (ok && alternativas.length > 0) {
        gridAlternativas.classList.remove('hidden');
        document.getElementById('loader').classList.add('hidden');

        alternativas.forEach(alt => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.marginBottom = 'var(--space-3)';
            card.innerHTML = `
                <div>
                    <h4>${alt.nombre_producto}</h4>
                    <p>$${alt.precio_min} - $${alt.precio_max}</p>
                </div>
                <button class="btn btn--secondary btn-seleccionar" data-id="${alt.id_producto}">
                    Seleccionar
                </button>
            `;
            gridAlternativas.appendChild(card);
        });

        // 3. Lógica de selección para comparar
        let idsAComparar = [parseInt(idProdOriginal)];
        
        document.querySelectorAll('.btn-seleccionar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idAlt = parseInt(e.target.getAttribute('data-id'));
                
                if (idsAComparar.includes(idAlt)) {
                    idsAComparar = idsAComparar.filter(id => id !== idAlt);
                    e.target.innerText = "Seleccionar";
                } else if (idsAComparar.length < 3) {
                    idsAComparar.push(idAlt);
                    e.target.innerText = "Seleccionado";
                }

                const btnComparar = document.getElementById('btn-ver-comparaciones');
                if (btnComparar) {
                    btnComparar.disabled = idsAComparar.length < 2;
                    btnComparar.style.opacity = idsAComparar.length < 2 ? "0.5" : "1";
                    btnComparar.onclick = () => {
                        window.location.href = `../comparacion/comparacion.html?ids=${idsAComparar.join(',')}`;
                    };
                }
            });
        });
    } else {
        document.getElementById('loader').innerHTML = "<p>No hay alternativas disponibles.</p>";
    }
});