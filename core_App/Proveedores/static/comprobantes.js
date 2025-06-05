(function() {
      const jwt = sessionStorage.getItem('jwt');
      if (!jwt) {
        alert('Debe iniciar sesión para acceder a esta página.');
        window.location.href = '/Proveedores/acceder/';
        return;
      }

      const form = document.getElementById('comprobanteForm');
      const listaComprobantes = document.getElementById('listaComprobantes');

      function mostrarError(input, mensaje) {
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = mensaje;
      }

      function limpiarErrores() {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      }

      function validarFormulario() {
        limpiarErrores();
        let valido = true;

        const tipo = form.tipo.value;
        if (!tipo) {
          mostrarError(form.tipo, 'Seleccione un tipo válido.');
          valido = false;
        }

        if (!form.numero.value.trim()) {
          mostrarError(form.numero, 'Ingrese el número de comprobante.');
          valido = false;
        }

        if (!form.fecha_emision.value) {
          mostrarError(form.fecha_emision, 'Ingrese la fecha de emisión.');
          valido = false;
        }

        const monto = parseFloat(form.monto_total.value);
        if (isNaN(monto) || monto < 0) {
          mostrarError(form.monto_total, 'Ingrese un monto válido.');
          valido = false;
        }

        const archivo = form.archivo.files[0];
        if (!archivo) {
          mostrarError(form.archivo, 'Seleccione un archivo válido.');
          valido = false;
        } else {
          const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
          if (!validTypes.includes(archivo.type)) {
            mostrarError(form.archivo, 'Formato no permitido. Solo PDF, JPEG y PNG.');
            valido = false;
          }
          if (archivo.size > 10 * 1024 * 1024) {
            mostrarError(form.archivo, 'Archivo demasiado grande. Máximo 10MB.');
            valido = false;
          }
        }

        return valido;
      }

      async function cargarComprobante(formData) {
        try {
          const resp = await fetch('/Proveedores/api/comprobantes/', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + jwt
            },
            body: formData
          });
          if (!resp.ok) {
            const errorData = await resp.json();
            let mensajes = [];
            for (const key in errorData) {
              mensajes.push(`${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key]}`);
            }
            alert('Error al cargar comprobante:\n' + mensajes.join('\n'));
            return false;
          }
          return true;
        } catch (error) {
          alert('Error de red al cargar comprobante.');
          return false;
        }
      }

      async function listarComprobantes() {
        try {
          const resp = await fetch('/Proveedores/api/comprobantes/', {
            headers: {
              'Authorization': 'Bearer ' + jwt
            }
          });
          if (!resp.ok) {
            listaComprobantes.innerHTML = '<div class="text-danger">Error al cargar comprobantes.</div>';
            window.location.href = '/Proveedores/acceder/';
            return;
          }
          const data = await resp.json();
          if (data.length === 0) {
            listaComprobantes.innerHTML = '<div class="text-muted">No hay comprobantes cargados.</div>';
            return;
          }
          listaComprobantes.innerHTML = '';
          data.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center comprobante-item';
            const fecha = new Date(c.fecha_emision).toLocaleDateString('es-AR');
            item.innerHTML = `
              <div>
                <strong>${c.tipo}</strong> - Nº ${c.numero} <br />
                Fecha: ${fecha} - Monto: $${parseFloat(c.monto_total).toFixed(2)} <br />
                Estado: <span class="badge bg-success">${c.estado}</span>
              </div>
              <div>
                <a href="${c.archivo_url}" target="_blank" class="btn btn-sm btn-outline-primary">Ver Archivo</a>
              </div>
            `;
            listaComprobantes.appendChild(item);
          });
        } catch (error) {
          listaComprobantes.innerHTML = '<div class="text-danger">Error de red al cargar comprobantes.</div>';
        }
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        const formData = new FormData();
        formData.append('tipo', form.tipo.value);
        formData.append('numero', form.numero.value.trim());
        formData.append('fecha_emision', form.fecha_emision.value);
        formData.append('monto_total', form.monto_total.value);
        formData.append('archivo', form.archivo.files[0]);

        form.querySelector('button[type="submit"]').disabled = true;
        const exito = await cargarComprobante(formData);
        form.querySelector('button[type="submit"]').disabled = false;

        if (exito) {
          alert('Comprobante cargado correctamente.');
          form.reset();
          listarComprobantes();
        }
      });

      listarComprobantes();
    })();

    // Funcion para volver al inicio
    function goToDashboard() {
      window.location.href = '/Proveedores/dashboard/';
    }
