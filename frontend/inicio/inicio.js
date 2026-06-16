document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('btn-login')?.addEventListener('click', () => {
    window.location.href = '/auth/login/login.html';
  });

  document.getElementById('btn-registro')?.addEventListener('click', () => {
    window.location.href = '/auth/login/login.html?modo=registro';
  });

});