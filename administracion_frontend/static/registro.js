// Tu script de validación y registro (sin cambios en la lógica)
    function limpiarErrores() {
      document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      const formMessages = document.getElementById('form-messages');
      if (formMessages) {
        formMessages.textContent = '';
        formMessages.className = 'text-center mt-3'; // Reset class
      }
    }

    function validarFormatoCuit(cuit) {
      const cuitPattern = /^\d{2}-\d{8}-\d{1}$/;
      return cuitPattern.test(cuit);
    }

    async function cuitYaExiste(cuit) {
      try {
        // Mostrar algún feedback visual de carga aquí si se desea
        const loadingMessageCuit = document.getElementById('error-n_cuit');
        if(loadingMessageCuit) loadingMessageCuit.textContent = 'Verificando CUIT...';

        const resp = await fetch(`/Proveedores/api/validar-cuit/?n_cuit=${encodeURIComponent(cuit)}`);
        if (!resp.ok) {
            if(loadingMessageCuit) loadingMessageCuit.textContent = ''; // Limpiar mensaje si hay error de red
            return false; // Asumir que no existe si hay error de red, o manejarlo diferente
        }
        const data = await resp.json();
        if(loadingMessageCuit) loadingMessageCuit.textContent = ''; // Limpiar mensaje después de verificar
        return data.exists === true;
      } catch (e) {
        const loadingMessageCuit = document.getElementById('error-n_cuit');
        if(loadingMessageCuit) loadingMessageCuit.textContent = 'Error al verificar CUIT.';
        return false; // O manejar como error
      }
    }

    document.getElementById('registroForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      limpiarErrores();

      const data = {
        usuario: document.getElementById('usuario').value.trim(),
        contrasena: document.getElementById('contrasena').value,
        nom_provee: document.getElementById('nombreComercial').value.trim(),
        n_cuit: document.getElementById('cuilCuit').value.trim(),
        e_mail: document.getElementById('email').value.trim(),
        nom_fant: document.getElementById('nombreFantasia').value.trim() || null, // Enviar null si está vacío
        cod_pais: document.getElementById('pais').value,
        nom_pais: document.getElementById('pais').options[document.getElementById('pais').selectedIndex].text
      };

      let hayError = false;
      if (!data.usuario) {
        document.getElementById('error-usuario').textContent = 'El usuario es obligatorio.';
        hayError = true;
      }
      if (!data.contrasena || data.contrasena.length < 6) {
        document.getElementById('error-contrasena').textContent = 'La contraseña debe tener al menos 6 caracteres.';
        hayError = true;
      }
      if (!data.nom_provee) {
        document.getElementById('error-nom_provee').textContent = 'El nombre comercial es obligatorio.';
        hayError = true;
      }
      if (!data.n_cuit) {
        document.getElementById('error-n_cuit').textContent = 'El CUIL/CUIT es obligatorio.';
        hayError = true;
      } else if (!validarFormatoCuit(data.n_cuit)) {
        document.getElementById('error-n_cuit').textContent = 'Formato: XX-XXXXXXXX-X (ej: 20-31441849-3).';
        hayError = true;
      }
      // La validación de CUIT existente se hará después de las validaciones locales para no hacer fetch innecesario
      if (!data.e_mail) { // Simple validación de email no vacío
        document.getElementById('error-e_mail').textContent = 'El email es obligatorio.';
        hayError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.e_mail)) { // Formato básico de email
        document.getElementById('error-e_mail').textContent = 'Ingresa un email válido.';
        hayError = true;
      }

      if (!data.cod_pais) {
        document.getElementById('error-pais').textContent = 'Debes seleccionar un país.';
        hayError = true;
      }

      if (hayError) return; // Si hay errores locales, no continuar

      // Ahora, si el formato CUIT es válido, verificar si existe (solo si no hay otros errores)
      if (validarFormatoCuit(data.n_cuit)) {
          const existe = await cuitYaExiste(data.n_cuit);
          if (existe) {
            document.getElementById('error-n_cuit').textContent = 'El CUIL/CUIT ya está registrado.';
            hayError = true;
          }
      }

      if (hayError) return;


      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';


      try {
        const response = await fetch('/Proveedores/api/registro/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          $('#successModal').modal('show');
          document.getElementById('registroForm').reset();
        } else {
          const formMessagesDiv = document.getElementById('form-messages');
          formMessagesDiv.textContent = result.detail || 'Por favor, corrige los errores e intenta nuevamente.';
          formMessagesDiv.className = 'error-message text-center mt-3';

          if (result && typeof result === 'object' && !result.detail) {
            for (const campo in result) {
              if (result.hasOwnProperty(campo)) {
                const errorDivId = 'error-' + campo.replace('_', '-'); // Ajustar si los IDs no coinciden exactamente
                const errorDiv = document.getElementById(errorDivId);
                if (errorDiv) {
                  errorDiv.textContent = Array.isArray(result[campo]) ? result[campo].join(' ') : result[campo];
                } else {
                    // Si hay un error de un campo no mapeado, mostrarlo en form-messages
                    formMessagesDiv.textContent += ` ${campo}: ${Array.isArray(result[campo]) ? result[campo].join(' ') : result[campo]}`;
                }
              }
            }
          }
        }
      } catch (error) {
        const formMessagesDiv = document.getElementById('form-messages');
        formMessagesDiv.textContent = 'Error de conexión. Inténtalo más tarde.';
        formMessagesDiv.className = 'error-message text-center mt-3';
      } finally {
          submitButton.disabled = false;
          submitButton.innerHTML = 'Crear Cuenta';
      }
    });

    document.getElementById('closeModalBtn').addEventListener('click', function() {
      $('#successModal').modal('hide');
    });

    // Para una mejor UX, redirigir después de que el modal se oculte completamente
    $('#successModal').on('hidden.bs.modal', function (e) {
      window.location.href = "../acceder/";
    });
