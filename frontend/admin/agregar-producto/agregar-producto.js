// Variable de control de modo activo: 'manual' o 'ia'
let modoActivo = 'manual';

function cambiarModo(modo) {
    modoActivo = modo;
    
    // Elementos HTML
    const btnManual = document.getElementById('btn-modo-manual');
    const btnIA = document.getElementById('btn-modo-ia');
    const seccionManual = document.getElementById('seccion-manual');
    const seccionIA = document.getElementById('seccion-ia');
    const btnSubmit = document.getElementById('btn-guardar-main');

    if (modo === 'manual') {
        btnManual.classList.add('active');
        btnIA.classList.remove('active');
        seccionManual.classList.replace('hidden-field', 'visible-field');
        seccionIA.classList.replace('visible-field', 'hidden-field');
        btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar producto';
    } else {
        btnIA.classList.add('active');
        btnManual.classList.remove('active');
        seccionIA.classList.replace('hidden-field', 'visible-field');
        seccionManual.classList.replace('visible-field', 'hidden-field');
        btnSubmit.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Clasificar con IA Qwen';
    }
}

// Interceptar el envío de datos
document.getElementById('form-agregar-producto').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const API_BASE = "http://127.0.0.1:8000/api/productos/";
    const modalExito = document.getElementById('successModal');

    // Datos generales obligatorios en ambos flujos
    const payloadGeneral = {
        nombre_producto: document.getElementById('input-nombre').value,
        categoria: document.getElementById('input-categoria').value,
        subcategoria: document.getElementById('input-subcategoria').value
    };

    if (modoActivo === 'manual') {
        // --- FLUJO MODO MANUAL ---
        const payloadManual = {
            ...payloadGeneral,
            ventajas: document.getElementById('input-ventajas').value,
            desventajas: document.getElementById('input-desventajas').value,
            criterios: {
                microplasticos: document.getElementById('check-microplasticos').checked,
                pruebas_animales: document.getElementById('check-animales').checked,
                certificacion: document.getElementById('check-certificacion').checked,
                empaque_sustentable: document.getElementById('check-empaque').checked,
                un_solo_uso: document.getElementById('check-plastico-unico').checked
            }
        };

        fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MQ==' },
            body: JSON.stringify(payloadManual)
        })
        .then(res => handleResponse(res));

    } else {
        // --- FLUJO MODO AUTOMÁTICO IA ---
        // 1. Primero guarda el cascarón del producto
        fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MQ==' },
            body: JSON.stringify(payloadGeneral)
        })
        .then(res => res.json())
        .then(productoCreado => {
            // 2. Con el ID que nos regresa Django, mandamos los textos brutos a evaluar con Qwen
            const payloadIA = {
                ingredientes: document.getElementById('input-ia-ingredientes').value,
                empaque: document.getElementById('input-ia-empaque').value
            };

            return fetch(`${API_BASE}${productoCreado.id_producto}/clasificar/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MQ==' },
                body: JSON.stringify(payloadIA)
            });
        })
        .then(res => handleResponse(res));
    }

    function handleResponse(res) {
        if (res.status === 201 || res.ok) {
            modalExito.style.display = 'flex';
            document.getElementById('form-agregar-producto').reset();
            setTimeout(() => { modalExito.style.display = 'none'; }, 2000);
        } else {
            alert("Error al guardar o procesar en el servidor.");
        }
    }
});

