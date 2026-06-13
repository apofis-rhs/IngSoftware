document.addEventListener('DOMContentLoaded', () => {

  const contBuscador = document.getElementById("favoritos-buscador");
  const contRecomendaciones = document.getElementById("favoritos-recomendaciones");

  // DATOS SIMULADOS: Agregamos la propiedad "modulo" para separarlos
  let mockFavoritos = [
    { 
      id: 1, modulo: "buscador", nombre: "Shampoo Sólido Reparador", precio: "$120.00", 
      color_semaforo: "verde", imagen: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 2, modulo: "buscador", nombre: "Crema Facial Hidratante", precio: "$250.00", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 3, modulo: "buscador", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 4, modulo: "buscador", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    },

    { 
      id: 5, modulo: "recomendaciones", nombre: "Alternativas ecológicas para el hogar", precio: "Artículo", 
      color_semaforo: "verde", imagen: "https://images.unsplash.com/photo-1606132047805-4c0799797df3?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 6, modulo: "recomendaciones", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    }
    ,
    { 
      id: 7, modulo: "recomendaciones", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    }
    ,
    { 
      id: 8, modulo: "recomendaciones", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    }
    ,
    { 
      id: 9, modulo: "recomendaciones", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    }
    ,
    { 
      id: 10, modulo: "recomendaciones", nombre: "Jabones sin crueldad animal", precio: "Artículo", 
      color_semaforo: "amarillo", imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    }
  ];

  // ── RENDERIZAR LAS TARJETAS ─────────────────────────────────
  function cargarFavoritos() {
    setTimeout(() => {
      renderizarGrid();
    }, 500);
  }

  function renderizarGrid() {
    // Filtramos los datos
    const favsBuscador = mockFavoritos.filter(item => item.modulo === "buscador");
    const favsRecom = mockFavoritos.filter(item => item.modulo === "recomendaciones");

    // Rutas relativas a tus archivos de detalle
    const rutaBuscador = "../../buscador/detalle-producto/detalle-producto.html";
    const rutaRecom = "../../recomendaciones/detalle-articulo/detalle-articulo.html";

    // Llenamos cada contenedor
    inyectarTarjetas(contBuscador, favsBuscador, rutaBuscador);
    inyectarTarjetas(contRecomendaciones, favsRecom, rutaRecom);
  }

  function inyectarTarjetas(contenedor, lista, rutaBase) {
    contenedor.innerHTML = "";

    if (!lista.length) {
      contenedor.innerHTML = `
        <div class="fav-empty" style="padding: 30px;">
          <p style="color:#999; margin:0;">No tienes elementos guardados en esta sección.</p>
        </div>
      `;
      return;
    }

    lista.forEach((item, index) => {
      let dotColor = "";
      switch(item.color_semaforo) {
        case "verde": dotColor = "var(--color-success, #BAC423)"; break;
        case "amarillo": dotColor = "var(--color-primary-dark, #FFAC00)"; break;
        case "rojo": dotColor = "var(--color-secondary-dark, #FF4A58)"; break;
        default: dotColor = "var(--color-text-muted, #9E9E9E)";
      }

      const delay = index * 0.1;

      // El botón eliminar es hermano del enlace <a> para evitar redirecciones al borrar
      contenedor.innerHTML += `
        <div class="fav-card" style="animation-delay: ${delay}s">
          <button class="fav-card__btn-remove" data-id="${item.id}" title="Quitar de favoritos">
            <i class="fa-regular fa-trash-can"></i>
          </button>
          
          <a href="${rutaBase}?id=${item.id}" class="fav-card__link">
            <div class="fav-card__img-wrap">
              <div class="fav-card__dot" style="background: ${dotColor};"></div>
              <img src="${item.imagen}" alt="${item.nombre}">
            </div>
            <div class="fav-card__info">
              <div class="fav-card__title">${item.nombre}</div>
              <div class="fav-card__price">${item.precio}</div>
            </div>
          </a>
        </div>
      `;
    });
  }

  // ── LÓGICA PARA ELIMINAR ─────────────────
  // Escuchamos clics en la página completa
  document.addEventListener("click", (e) => {
    const btnEliminar = e.target.closest(".fav-card__btn-remove");
    if (!btnEliminar) return;

    // Prevenimos que el clic se filtre al enlace de abajo
    e.preventDefault();
    e.stopPropagation();

    const id = parseInt(btnEliminar.getAttribute("data-id"));
    const cardVisual = btnEliminar.closest(".fav-card");

    cardVisual.classList.add("removing");

    setTimeout(() => {
      cardVisual.remove(); 
      mockFavoritos = mockFavoritos.filter(fav => fav.id !== id);
      renderizarGrid(); // Recargar para mostrar mensajes de "vacío" si aplica
    }, 300);

    mostrarToast("Eliminado de favoritos");
  });

  // ── FUNCIÓN PARA NOTIFICACIÓN FLOTANTE (TOAST) ──────────────
  function mostrarToast(mensaje) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-check"></i> ${mensaje}`;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  // ── INYECCIÓN DE PARTÍCULAS ─────────────
  const colors = ["#FFD460", "#BAC423", "#FF8C99", "#FFAC00"];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = Math.random() * 15 + 8;
    const isLeaf = Math.random() > 0.5;
    const borderRadius = isLeaf ? "0 50% 50% 50%" : "50%";
    
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${borderRadius};
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 6 + 4}s;
      animation-delay: ${Math.random() * 5}s;
    `;
    document.body.appendChild(p);
  }

  // Iniciar pantalla
  cargarFavoritos();
});

// Elementos del selector y las secciones completas
  const filtroModulo = document.getElementById("filtro-modulo");
  const seccionBuscador = document.getElementById("seccion-buscador");
  const seccionRecom = document.getElementById("seccion-recom");

  // Escuchar cuando el usuario cambia la opción del Select
  filtroModulo.addEventListener("change", (e) => {
    const valor = e.target.value;

    if (valor === "todos") {
      seccionBuscador.style.display = "block";
      seccionRecom.style.display = "block";
    } else if (valor === "buscador") {
      seccionBuscador.style.display = "block";
      seccionRecom.style.display = "none";
    } else if (valor === "recomendaciones") {
      seccionBuscador.style.display = "none";
      seccionRecom.style.display = "block";
    }
  });