// historial.js — conectado a la BD
import { obtenerHistorial, estaLogueado } from '../../assets/js/api.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) {
    window.location.href = '../../auth/login/login.html'; return;
  }

  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '../../auth/login/login.html';
    });
  });

  const contenedor = document.getElementById('historial-container');

  // Partículas decorativas (igual que el diseño original)
  inyectarParticulas();

  try {
    const { ok, data } = await obtenerHistorial();

    if (!ok || !data.length) {
      contenedor.innerHTML = `
        <div class="historial-vacio">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <h3>No hay consultas registradas</h3>
          <p style="color:#666;margin-top:8px">Tus búsquedas recientes aparecerán aquí.</p>
        </div>`;
      return;
    }

    contenedor.innerHTML = '';
    data.forEach((item, index) => {
      const color     = item.color_semaforo || 'gris';
      const nodeColor = colorSemaforo(color);
      const badgeStyle = badgeSemaforo(color);
      const textoFecha = tiempoRelativo(item.fecha_consulta);
      const ruta = `../../buscador/detalle-producto/detalle-producto.html?id=${item.id_producto_id || item.id_producto}`;

      contenedor.innerHTML += `
        <div class="timeline-item" style="animation-delay:${index * 0.15}s">
          <div class="timeline-node" style="background:${nodeColor}"></div>
          <a href="${ruta}" class="timeline-card">
            <div class="timeline-info">
              <div class="timeline-date">${textoFecha}</div>
              <div class="timeline-title">${item.nombre_producto}</div>
              <div class="timeline-badge" style="${badgeStyle}">
                ${capitalizar(color)}
              </div>
            </div>
            <i class="fa-solid fa-chevron-right timeline-arrow"></i>
          </a>
        </div>`;
    });

  } catch (err) {
    contenedor.innerHTML = `<p style="text-align:center;color:#999;padding:40px">Error de conexión. ¿Está corriendo el backend?</p>`;
  }
});

function tiempoRelativo(fechaISO) {
  const diff = Date.now() - new Date(fechaISO);
  const seg = Math.floor(diff / 1000), min = Math.floor(seg / 60),
        hor = Math.floor(min / 60),  dias = Math.floor(hor / 24);
  if (seg < 60)  return 'Hace un momento';
  if (min < 60)  return `Hace ${min} min`;
  if (hor < 24)  return `Hace ${hor} h`;
  if (dias === 1) return 'Ayer';
  if (dias < 7)  return `Hace ${dias} días`;
  return new Date(fechaISO).toLocaleDateString('es-MX');
}

function colorSemaforo(c) {
  return { verde:'#BAC423', amarillo:'#FFAC00', rojo:'#FF4A58' }[c] || '#9E9E9E';
}
function badgeSemaforo(c) {
  return { verde:'background:#EAF3DE;color:#BAC423', amarillo:'background:#FFF8E1;color:#FFAC00',
           rojo:'background:#FCEBEB;color:#FF4A58' }[c] || 'background:#F5F5F5;color:#666';
}
function capitalizar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Sin info'; }

function inyectarParticulas() {
  const colors = ['#FFD460','#BAC423','#FF8C99','#FFAC00'];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 12 + 6;
    p.style.cssText = `width:${size}px;height:${size}px;background:${colors[i%4]};
      border-radius:${Math.random()>.5?'0 50% 50% 50%':'50%'};
      left:${Math.random()*100}%;animation-duration:${Math.random()*6+5}s;animation-delay:${Math.random()*4}s`;
    document.body.appendChild(p);
  }
}