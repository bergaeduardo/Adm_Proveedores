function logout() {
      sessionStorage.removeItem('jwt');
      window.location.href = '/Proveedores/acceder/';
    }
