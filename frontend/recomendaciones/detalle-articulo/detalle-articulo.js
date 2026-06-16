import { obtenerArticulo, obtenerAlternativasArticulo } from '/assets/js/api.js';

// Nav
const hamburger = document.getElementById('hamburger');
const navDrawer  = document.getElementById('nav-drawer');
hamburger?.addEventListener('click', () => navDrawer?.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!hamburger?.contains(e.target) && !navDrawer?.contains(e.target))
    navDrawer?.classList.remove('open');
});
['btn-cerrar-sesion','btn-cerrar-sesion-mobile'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('token'); localStorage.removeItem('usuario');
    window.location.href = '/auth/login/login.html';
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/auth/login/login.html'; return;
  }

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { mostrarError('No se especificó ID del artículo'); return; }

  try {
    // Cargar artículo y sus alternativas en paralelo
    const [resArt, resAlts] = await Promise.all([
      obtenerArticulo(id),
      obtenerAlternativasArticulo(id)
    ]);

    if (!resArt.ok) { mostrarError(resArt.data?.error || 'Artículo no encontrado'); return; }
    const data = resArt.data;

    // Nombre
    const elNombre = document.getElementById('nombre-articulo');
    if (elNombre) elNombre.textContent = data.nombre_articulo;
    document.title = `LUMIKA — ${data.nombre_articulo}`;

    // Impacto ambiental
    const elImpacto = document.getElementById('impacto-ambiental');
    if (elImpacto) elImpacto.textContent = data.impacto_ambiental || 'Sin información disponible.';

    // Alternativas del modelo Alternativa (precio, descripcion)
    const listaAlts = document.getElementById('lista-alternativas');
    if (listaAlts) {
      // resAlts viene de obtenerAlternativasArticulo
      const alts = resArt.data.alternativas || (resAlts.ok ? resAlts.data : []);
      if (alts?.length) {
        listaAlts.innerHTML = alts.map(alt => `
          <div style="display:flex;align-items:center;gap:var(--space-3);
                      padding:var(--space-3) 0;border-bottom:1px solid var(--color-border)">
            <i class="fa-solid fa-leaf" style="color:var(--color-success);flex-shrink:0"></i>
            <div style="flex:1">
              <p style="font-weight:600;margin:0">${alt.nombre}</p>
              ${alt.descripcion ? `<p style="font-size:0.85rem;color:var(--color-text-muted);margin:2px 0 0">${alt.descripcion}</p>` : ''}
            </div>
            ${alt.precio_min != null ? `<span style="font-size:0.85rem;color:var(--color-text-muted)">$${alt.precio_min} – $${alt.precio_max}</span>` : ''}
          </div>`).join('');
      } else {
        document.getElementById('card-alternativas')?.classList.add('hidden');
      }
    }

    // Mostrar contenido
    document.getElementById('loader')?.classList.add('hidden');
    document.getElementById('contenido-articulo')?.classList.remove('hidden');

    // Botones
    document.getElementById('btn-regresar')?.addEventListener('click', () => window.history.back());
    document.getElementById('btn-volver-resultados')?.addEventListener('click', () => window.history.back());
    document.getElementById('btn-ver-alternativas')?.addEventListener('click', () => {
      window.location.href = `/recomendaciones/alternativas/alternativas.html?id=${id}`;
    });

  } catch (err) {
    console.error(err);
    mostrarError(`Error de conexión: ${err.message}`);
  }
});

function mostrarError(msg) {
  const loader = document.getElementById('loader');
  if (loader) loader.innerHTML = `<div class="alerta alerta--error" style="margin:var(--space-4)">${msg}</div>`;
}
