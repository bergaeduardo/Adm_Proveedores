document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      errorDiv.classList.add('d-none'); // Ocultar error previo

      if (!username || !password) {
        errorDiv.textContent = 'Debe ingresar usuario y contraseña.';
        errorDiv.classList.remove('d-none');
        return;
      }

      // Redirigir directamente al dashboard sin autenticación
      window.location.href = '/administracion/dashboard/';
    });
