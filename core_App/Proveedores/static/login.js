document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      errorDiv.classList.add('d-none'); // Ocultar error previo
      try {
        const resp = await fetch('/Proveedores/api/token/', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username, password})
        });
        if (!resp.ok) {
          const data = await resp.json();
          errorDiv.textContent = data.detail || 'Credenciales inválidas. Por favor, inténtalo de nuevo.';
          errorDiv.classList.remove('d-none');
          return;
        }
        const data = await resp.json();
        sessionStorage.setItem('jwt', data.access);
        window.location.href = '/Proveedores/dashboard/';
      } catch (err) {
        errorDiv.textContent = 'No se pudo conectar con el servidor. Verifica tu conexión o inténtalo más tarde.';
        errorDiv.classList.remove('d-none');
      }
    });
