// perfil/historial.js
import { obtenerHistorial, estaLogueado } from '/assets/js/api.js';
import { getRutaImagen } from '/assets/js/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {

  if (!estaLogueado()) { window.location.href = '/auth/login/login.html'; return; }

  // ── BOTÓN REGRESAR INTELIGENTE ────────────────────────
  const btnAtrasHeader = document.querySelector('.btn-back');
  if (btnAtrasHeader) {
    btnAtrasHeader.addEventListener('click', irAtras);
  }

  // Nav
  const hamburger = document.getElementById('hamburger');
  const navDrawer = document.getElementById('nav-drawer');
  hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
      navDrawer?.classList.remove('open');
  });
  ['btn-cerrar-sesion', 'btn-cerrar-sesion-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      window.location.href = '/auth/login/login.html';
    });
  });

  // Partículas decorativas
  const colors = ['#FFD460', '#BAC423', '#FF8C99', '#FFAC00'];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 12 + 6;
    p.style.cssText = `width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? '0 50% 50% 50%' : '50%'};
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 6 + 5}s;
      animation-delay:${Math.random() * 4}s;`;
    document.body.appendChild(p);
  }

  const contenedor = document.getElementById('historial-container');

  // ── Carga desde la BD ────────────────────────────────────
  try {
    const { ok, data } = await obtenerHistorial();

    if (!ok || !Array.isArray(data) || data.length === 0) {
      contenedor.innerHTML = `
        <div class="historial-vacio">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <h3>No hay consultas registradas</h3>
          <p style="color:#666;margin-top:8px">Tus búsquedas recientes aparecerán aquí.</p>
        </div>`;
      return;
    }

    contenedor.innerHTML = '';

    const dotColors   = { verde: '#BAC423', amarillo: '#FFAC00', rojo: '#FF4A58' };
    const badgeColors = {
      verde:    'background:#EAF3DE;color:#BAC423',
      amarillo: 'background:#FFF8E1;color:#FFAC00',
      rojo:     'background:#FCEBEB;color:#FF4A58',
    };

    data.forEach((item, index) => {
      const color      = item.color_semaforo || 'gris';
      const nodeColor  = dotColors[color]    || '#9E9E9E';
      const badgeStyle = badgeColors[color]  || 'background:#F5F5F5;color:#666';
      const etiqueta   = color.charAt(0).toUpperCase() + color.slice(1);

      const id     = item.id_producto_id;
      const nombre = item.nombre_producto || 'Producto';
      const ruta   = `../../buscador/detalle-producto/detalle-producto.html`;
      const imgSrc = getRutaImagen(
        { imagen: item.imagen, id_subcategoria: item.id_subcategoria },
        '../../'
      );
      const textoFecha = calcularTiempoRelativo(item.fecha_consulta);

      contenedor.innerHTML += `
        <div class="timeline-item" style="animation-delay:${index * 0.15}s">
          <div class="timeline-node" style="background:${nodeColor}"></div>
          <a href="${ruta}?id=${id}" class="timeline-card">
            <div class="timeline-img-wrap">
              <img src="${imgSrc}" alt="${nombre}"
                   onerror="this.src='../../assets/images/placeholder.svg'">
            </div>
            <div class="timeline-info">
              <div class="timeline-date">${textoFecha}</div>
              <div class="timeline-title">${nombre}</div>
              <div class="timeline-badge" style="${badgeStyle}">${etiqueta}</div>
            </div>
            <i class="fa-solid fa-chevron-right timeline-arrow"></i>
          </a>
        </div>`;
    });

  } catch (err) {
    console.error('Error cargando historial:', err);
    contenedor.innerHTML = `<div class="alerta alerta--error">Error al cargar el historial.</div>`;
  }
});

function calcularTiempoRelativo(fechaISO) {
  if (!fechaISO) return '';
  const diff     = new Date() - new Date(fechaISO);
  const segundos = Math.floor(diff / 1000);
  const minutos  = Math.floor(segundos / 60);
  const horas    = Math.floor(minutos / 60);
  const dias     = Math.floor(horas / 24);
  if (segundos < 60)  return 'Hace un momento';
  if (minutos  < 60)  return `Hace ${minutos} min`;
  if (horas    < 24)  return `Hace ${horas} h`;
  if (dias     === 1) return 'Ayer';
  if (dias     < 7)   return `Hace ${dias} días`;
  return new Date(fechaISO).toLocaleDateString('es-MX');
}

// ── FUNCIÓN MAESTRA PARA REGRESAR ───────────────────────────────
function irAtras(e) {
  if (e) e.preventDefault();
  const prev = document.referrer;
  if (!prev || prev.includes('/auth/')) {
    window.location.href = '/inicio/inicio.html';
  } else {
    window.history.back();
  }
}