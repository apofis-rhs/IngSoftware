// historial.js

// import { obtenerHistorial, estaLogueado } from "../../assets/js/api.js";

document.addEventListener('DOMContentLoaded', () => {

  const contenedor = document.getElementById("historial-container");

  // DATOS SIMULADOS: Ahora usamos fechas reales (Formato ISO) y la propiedad "modulo"
  const mockHistorial = [
    { 
      id: 1, 
      modulo: "buscador",
      nombre_producto: "Shampoo Sólido Reparador", 
      fecha_consulta: "2026-06-12T21:30:00Z", // Hace un par de horas (suponiendo que hoy es 12 de junio de 2026)
      color_semaforo: "verde", 
      imagen: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 2, 
      modulo: "buscador",
      nombre_producto: "Aerosol Comercial Marca X", 
      fecha_consulta: "2026-06-12T16:30:00Z", // Hoy más temprano
      color_semaforo: "rojo", 
      imagen: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 3, 
      modulo: "recomendaciones",
      nombre_producto: "Alternativas ecológicas para el hogar", 
      fecha_consulta: "2026-06-11T15:00:00Z", // Ayer
      color_semaforo: "verde", 
      imagen: "https://images.unsplash.com/photo-1606132047805-4c0799797df3?auto=format&fit=crop&w=400&q=80" 
    },
    { 
      id: 4, 
      modulo: "recomendaciones",
      nombre_producto: "Crema Hidratante Piel Seca", 
      fecha_consulta: "2026-06-05T12:00:00Z", // Hace varios días
      color_semaforo: "amarillo", 
      imagen: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80" 
    }
  ];

  // FUNCIÓN LOGICA: Calcula el tiempo transcurrido de forma dinámica
  function calcularTiempoRelativo(fechaISO) {
    const fechaEntrada = new Date(fechaISO);
    const ahora = new Date();
    
    // Diferencia en milisegundos
    const diferenciaMs = ahora - fechaEntrada;
    
    // Conversiones de tiempo
    const segundos = Math.floor(diferenciaMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (segundos < 60) return "Hace un momento";
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    if (dias === 1) return "Ayer";
    if (dias < 7) return `Hace ${dias} días`;
    
    // Si es más de una semana, pinta la fecha normal en formato local (DD/MM/AAAA)
    return fechaEntrada.toLocaleDateString('es-MX');
  }

  function cargarHistorial() {
    setTimeout(() => {
      
      if (!mockHistorial.length) {
        contenedor.innerHTML = `
          <div class="historial-vacio">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <h3>No hay consultas registradas</h3>
            <p style="color:#666; margin-top:8px;">Tus búsquedas recientes aparecerán aquí.</p>
          </div>
        `;
        return;
      }

      contenedor.innerHTML = "";

      mockHistorial.forEach((item, index) => {
        
        // 1. Determinar el color del semáforo
        let nodeColor = "";
        let badgeStyle = "";
        switch(item.color_semaforo) {
          case "verde": 
            nodeColor = "var(--color-success, #BAC423)"; 
            badgeStyle = "background: #EAF3DE; color: #BAC423;";
            break;
          case "amarillo": 
            nodeColor = "var(--color-primary-dark, #FFAC00)"; 
            badgeStyle = "background: #FFF8E1; color: #FFAC00;";
            break;
          case "rojo": 
            nodeColor = "var(--color-secondary-dark, #FF4A58)"; 
            badgeStyle = "background: #FCEBEB; color: #FF4A58;";
            break;
          default: 
            nodeColor = "var(--color-text-muted, #9E9E9E)";
            badgeStyle = "background: #F5F5F5; color: #666;";
        }

        // 2. Enrutamiento dinámico basado en el módulo
        let rutaDetalle = "";
        if (item.modulo === "buscador") {
          rutaDetalle = "../../buscador/detalle-producto/detalle-producto.html";
        } else if (item.modulo === "recomendaciones") {
          rutaDetalle = "../../recomendaciones/detalle-articulo/detalle-articulo.html";
        }

        // 3. Calcular el texto de la fecha automáticamente
        const textoFecha = calcularTiempoRelativo(item.fecha_consulta);

        const delay = index * 0.15;

        // Inyección en el DOM
        contenedor.innerHTML += `
          <div class="timeline-item" style="animation-delay: ${delay}s">
            
            <div class="timeline-node" style="background: ${nodeColor};"></div>
            
            <a href="${rutaDetalle}?id=${item.id}" class="timeline-card">
              
              <div class="timeline-img-wrap">
                <img src="${item.imagen}" alt="${item.nombre_producto}">
              </div>
              
              <div class="timeline-info">
                <div class="timeline-date">${textoFecha}</div>
                <div class="timeline-title">${item.nombre_producto}</div>
                <div class="timeline-badge" style="${badgeStyle}">
                  ${item.color_semaforo.charAt(0).toUpperCase() + item.color_semaforo.slice(1)}
                </div>
              </div>

              <i class="fa-solid fa-chevron-right timeline-arrow"></i>

            </a>

          </div>
        `;
      });

    }, 500);
  }

  // ── INYECCIÓN DE PARTÍCULAS SUTILES AL FONDO ─────────────
  const colors = ["#FFD460", "#BAC423", "#FF8C99", "#FFAC00"];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = Math.random() * 12 + 6;
    const isLeaf = Math.random() > 0.5;
    const borderRadius = isLeaf ? "0 50% 50% 50%" : "50%";
    
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${borderRadius};
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 6 + 5}s;
      animation-delay: ${Math.random() * 4}s;
    `;
    document.body.appendChild(p);
  }

  cargarHistorial();
});