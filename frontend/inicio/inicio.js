// inicio.js — pantalla de inicio LUMIKA

document.addEventListener('DOMContentLoaded', () => {

  // Si ya hay sesión activa, saltar directo al buscador
  if (localStorage.getItem('token')) {
    window.location.href = '../buscador/inicio/inicio.html';
    return;
  }

  // Iniciar sesión → login normal
  document.getElementById('btn-login').addEventListener('click', () => {
    window.location.href = '../auth/login/login.html';
  });

  // Registrarse → login con slider en modo registro
  document.getElementById('btn-registro').addEventListener('click', () => {
    window.location.href = '../auth/login/login.html?modo=registro';
  });

});