// Verificar autenticación al cargar el dashboard
document.addEventListener('DOMContentLoaded', function() {
    const jwt = sessionStorage.getItem('jwt');
    const refresh = sessionStorage.getItem('refresh_token');
    
    if (!jwt || !refresh) {
        alert('Debe iniciar sesión para acceder a esta página.');
        window.location.href = '/Proveedores/acceder/';
        return;
    }
});

function logout() {
      AuthManager.clearTokens();
      window.location.href = '/Proveedores/acceder/';
    }
