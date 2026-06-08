// buscador: inicio - logica especifica
import { buscarProductos } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const inputBusqueda = document.getElementById('input-busqueda');
    const contenedorRecomendados = document.getElementById('recomendados');
    const contenedorPopulares = document.getElementById('populares');
    const loader = document.getElementById('loader');

    function pintarCard(producto, contenedor) {
        const card = document.createElement('div');
        card.className = 'product-card-grid';

        let colorSemaforo = producto.estado_evaluacion === 'insuficiente' 
        ? 'gris' 
        : producto.color_semaforo;

        card.innerHTML = `
            <div class="product-card-grid__img">
                <div class="product-card-grid__dot semaforo-dot--${colorSemaforo}"></div>
            </div>
            <div class="product-card-grid__info">
                <p class="product-card-grid__name">${producto.nombre_producto}</p>
                <p class="product-card-grid__price">$${producto.precio_min} - $${producto.precio_max}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            localStorage.setItem('productoId', producto.id_producto);
            window.location.href = '../detalle-producto/detalle-producto.html';
        });

        contenedor.appendChild(card);
    }
   
    //MOCK TEMPORAL - Remplazar cuando se cree:
    // GET /api/productos/recomendados/ y GET /api/productos/populares/
    loader.style.display = 'block';

    try {
        //Cuando exista: const { data: recomendados } = await obtenerRecomendados();
        const recomendados = [
            { id_producto: 1, nombre_producto: "Producto Recomendado 1" , precio_min: 80, precio_max: 120, color_semaforo: "rojo", estado_evaluacion: "completo"},
            { id_producto: 2, nombre_producto: "Producto Recomendado 2" , precio_min: 110, precio_max: 160, color_semaforo: "verde", estado_evaluacion: "completo"}
        ];

        //Cuando exista: const { data: populares } = await obtenerPopulares();
        const populares = [
            { id_producto: 3, nombre_producto: "Producto Popular 1" , precio_min: 40, precio_max: 60, color_semaforo: "verde", estado_evaluacion: "completo"},
            { id_producto: 4, nombre_producto: "Producto Popular 2" , precio_min: 70, precio_max: 90, color_semaforo: "amarillo", estado_evaluacion: "completo"}
        ];

        recomendados.forEach(p => pintarCard(p, contenedorRecomendados));
        populares.forEach(p => pintarCard(p, contenedorPopulares));
    } catch (error) {
        console.error('Error cargando secciones:', error);
    } finally {
        loader.style.display = 'none';
    }

    inputBusqueda.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const texto = inputBusqueda.value.trim();
            if(texto === '') return;

            loader.style.display = 'block';
            try{
                const{ok, data} = await buscarProductos(texto);
                if(ok){
                    localStorage.setItem('resultadosBusqueda', JSON.stringify(data));
                    localStorage.setItem('textoBuscado', texto);
                    window.location.href = '../resultados/resultados.html';
                }
            } catch(error){
                    console.error('Error en búsqueda:', error);
            } finally {
                    loader.style.display = 'none';
            }
        }
    });
});