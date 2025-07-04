(function() {
      const jwt = sessionStorage.getItem('jwt');
      if (!jwt) {
        alert('Debe iniciar sesión para acceder a esta página.');
        window.location.href = '/Proveedores/acceder/';
        return;
      }

      const form = document.getElementById('comprobanteForm');
      const listaComprobantes = document.getElementById('listaComprobantes');
      const montoTotalInput = document.getElementById('monto_total');

      // Get the modal element and the replace button
      const documentViewerModal = document.getElementById('documentViewerModal');
      const btnReplaceDocument = document.getElementById('btnReplaceDocument');

      // Variable to store the status of the currently viewed comprobante
      let currentComprobanteStatus = null;

      // Initialize IMask for monto_total
      const montoMask = IMask(montoTotalInput, {
        mask: '$num',
        lazy: false,
        blocks: {
          num: {
            mask: Number,
            thousandsSeparator: '.',
            radix: ',',
            mapToRadix: ['.'],
            scale: 2,
            signed: false,
            padFractionalZeros: true,
            normalizeZeros: true,
            min: 0
          }
        }
      });


      function mostrarError(input, mensaje) {
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        // Check if the next sibling is the small text instruction for 'numero'
        if (input.id === 'numero' && feedback && feedback.tagName === 'SMALL') {
             const invalidFeedback = feedback.nextElementSibling;
             if(invalidFeedback) invalidFeedback.textContent = mensaje;
        } else if (feedback) {
            feedback.textContent = mensaje;
        }
      }

      function limpiarErrores() {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = ''); // Clear feedback messages
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

        // Use the unmasked value from IMask
        const monto = parseFloat(montoMask.unmaskedValue);
        if (isNaN(monto) || monto < 0) {
          mostrarError(form.monto_total, 'Ingrese un monto válido.');
          valido = false;
        }

        const archivo = form.archivo.files[0];
        if (!archivo) {
          mostrarError(form.archivo, 'Seleccione un archivo válido.');
          valido = false;
        } else {
          const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']; // Added .jpg
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
             // If unauthorized, redirect to login
            if (resp.status === 401) {
               alert('Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente.');
               window.location.href = '/Proveedores/acceder/';
               return;
            }
            listaComprobantes.innerHTML = '<div class="text-danger">Error al cargar comprobantes.</div>';
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
                Orden de Compra: ${c.Num_Oc || 'N/A'} <br />
                Estado: <span class="badge bg-success">${c.estado}</span>
              </div>
              <div>
                <!-- Modified button to trigger modal -->
                <button type="button" class="btn btn-sm btn-outline-primary btn-view-comprobante" data-url="${c.archivo_url}">Ver Archivo</button>
              </div>
            `;
            listaComprobantes.appendChild(item);
          });

          // Removed the loop for adding listeners here, using delegation below

        } catch (error) {
          listaComprobantes.innerHTML = '<div class="text-danger">Error de red al cargar comprobantes.</div>';
        }
      }

      // Add event listener to the modal shown event to control replace button visibility
      documentViewerModal.addEventListener('shown.bs.modal', function () {
          // Check the stored status and update button visibility
          if (currentComprobanteStatus === 'Recibido') {
              btnReplaceDocument.style.display = ''; // Show the button
          } else {
              btnReplaceDocument.style.display = 'none'; // Hide the button
          }
      });

      // Add event listener to the modal hidden event to reset status
      documentViewerModal.addEventListener('hidden.bs.modal', function () {
          currentComprobanteStatus = null; // Reset status when modal is closed
          // Ensure the button is hidden when modal closes
          btnReplaceDocument.style.display = 'none';
      });


      // Add a single event listener to the parent container using delegation
      listaComprobantes.addEventListener('click', function(event) {
          // Check if the clicked element or its parent is a '.btn-view-comprobante'
          const viewButton = event.target.closest('.btn-view-comprobante');

          if (viewButton) {
              const fileUrl = viewButton.getAttribute('data-url');
              // Find the closest parent item to get the status
              const itemElement = viewButton.closest('.list-group-item'); // Use list-group-item as the item container
              const statusElement = itemElement ? itemElement.querySelector('.badge') : null;
              const status = statusElement ? statusElement.textContent.trim() : null;

              if (fileUrl) {
                  // Store the status before opening the modal
                  currentComprobanteStatus = status;
                  // Call the global viewDocument function from mis_datos.js
                  // This function is expected to open the modal
                  if (typeof viewDocument === 'function') {
                      viewDocument(fileUrl);
                  } else {
                      console.error('viewDocument function not found. Ensure mis_datos.js is loaded.');
                      alert('Error interno: No se pudo abrir el visor de documentos.');
                  }
              } else {
                  alert('No hay archivo adjunto para este comprobante.');
              }
          }
      });


      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        const formData = new FormData();
        formData.append('tipo', form.tipo.value);
        formData.append('numero', form.numero.value.trim());
        formData.append('fecha_emision', form.fecha_emision.value);
        // Append the unmasked value
        formData.append('monto_total', montoMask.unmaskedValue);
        formData.append('archivo', form.archivo.files[0]);
        formData.append('Num_Oc', document.getElementById('Num_Oc').value.trim()); // Trim OC field

        form.querySelector('button[type="submit"]').disabled = true;
        const exito = await cargarComprobante(formData);
        form.querySelector('button[type="submit"]').disabled = false;

        if (exito) {
          alert('Comprobante cargado correctamente.');
          form.reset();
          montoMask.updateValue(''); // Reset the masked input value
          listarComprobantes();
        }
      });

      listarComprobantes(); // Initial load of comprobantes
    })();

    // Funcion para volver al inicio
    function goToDashboard() {
      window.location.href = '/Proveedores/dashboard/';
    }
