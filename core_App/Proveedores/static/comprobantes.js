// Función para sanitizar nombres de archivo
function sanitizeFilename(filename) {
    if (!filename) return filename;
    
    // Obtener la extensión del archivo
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
    // Reemplazar caracteres especiales y acentos en el nombre
    let sanitizedName = name
        .normalize('NFD') // Descomponer caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
        .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Solo permitir letras, números, guiones, guiones bajos y espacios
        .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
        .replace(/_{2,}/g, '_') // Eliminar múltiples guiones bajos consecutivos
        .trim();
    
    // Asegurar que no esté vacío
    if (!sanitizedName) {
        sanitizedName = 'comprobante';
    }
    
    return sanitizedName + extension;
}

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

      // Get filter elements
      const filterFechaDesdeInput = document.getElementById('filterFechaDesde');
      const filterFechaHastaInput = document.getElementById('filterFechaHasta');
      const filterEstadoSelect = document.getElementById('filterEstado');
      const filterTipoSelect = document.getElementById('filterTipo');
      const filterSearchInput = document.getElementById('filterSearch');
      const btnApplyFilters = document.getElementById('btnApplyFilters'); // Reference to the button

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

      // Populate filter dropdowns
      function populateFilterDropdowns() {
          // Populate Tipo dropdown from the form's select options
          const formTipoSelect = form.tipo;
          const filterTipoSelect = document.getElementById('filterTipo');
          // Clear existing options except "Todos"
          filterTipoSelect.innerHTML = '<option value="">Todos</option>';
          for (let i = 0; i < formTipoSelect.options.length; i++) {
              const option = formTipoSelect.options[i];
              if (option.value) { // Avoid adding the disabled "Seleccione..." option
                  const newOption = document.createElement('option');
                  newOption.value = option.value;
                  newOption.textContent = option.textContent;
                  filterTipoSelect.appendChild(newOption);
              }
          }

          // Populate Estado dropdown (hardcoded for now based on requirements)
          const estados = ["Recibido", "Aceptado", "Rechazado"]; // Add more states here if needed
          const filterEstadoSelect = document.getElementById('filterEstado');
           // Clear existing options except "Todos"
          filterEstadoSelect.innerHTML = '<option value="">Todos</option>';
          estados.forEach(estado => {
              const option = document.createElement('option');
              option.value = estado;
              option.textContent = estado;
              filterEstadoSelect.appendChild(option);
          });
      }


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

      // Function to get the appropriate badge class based on status
      function getStatusBadgeClass(status) {
          switch (status) {
              case 'Recibido':
                  return 'badge-recibido';
              case 'Aceptado':
                  return 'badge-aceptado';
              case 'Rechazado':
                  return 'badge-rechazado';
              // Add more cases for other statuses here
              default:
                  return 'bg-secondary'; // Default Bootstrap gray badge
          }
      }

      async function listarComprobantes(filters = {}) {
        listaComprobantes.innerHTML = '<div class="text-muted">Cargando comprobantes...</div>'; // Loading indicator
        try {
          const queryParams = new URLSearchParams(filters).toString();
          const url = `/Proveedores/api/comprobantes/${queryParams ? '?' + queryParams : ''}`;

          const resp = await fetch(url, {
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
            listaComprobantes.innerHTML = '<div class="text-muted">No hay comprobantes cargados que coincidan con los filtros.</div>';
            return;
          }
          listaComprobantes.innerHTML = '';
          data.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center comprobante-item';
            const fecha = new Date(c.fecha_emision).toLocaleDateString('es-AR');

            // Determine the badge class based on status
            const statusClass = getStatusBadgeClass(c.estado);

            // Conditionally add the Delete button HTML
            const deleteButtonHTML = (c.estado === 'Recibido' || c.estado === 'Rechazado') ?
                `<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-comprobante me-2" data-id="${c.id}">Eliminar</button>` :
                ''; // Empty string if button should not be shown


            item.innerHTML = `
              <div>
                <strong>${c.tipo}</strong> - Nº ${c.numero} <br />
                Fecha: ${fecha} - Monto: $${parseFloat(c.monto_total).toFixed(2)} <br />
                Orden de Compra: ${c.Num_Oc || 'N/A'} <br />
                Estado: <span class="badge ${statusClass}">${c.estado}</span>
              </div>
              <div>
                ${deleteButtonHTML} <!-- Add delete button here -->
                <button type="button" class="btn btn-sm btn-outline-primary btn-view-comprobante" data-url="${c.archivo_url}">Ver Archivo</button>
              </div>
            `;
            listaComprobantes.appendChild(item);
          });

          // Removed the loop for adding listeners here, using delegation below

        } catch (error) {
          listaComprobantes.innerHTML = '<div class="text-danger">Error de red al cargar comprobantes.</div>';
        } finally {
            // Update button state after loading data
            updateFilterButtonState();
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

      // Function to handle comprobante deletion
      async function eliminarComprobante(comprobanteId) {
          if (!confirm('¿Está seguro de que desea eliminar este comprobante? Esta acción no se puede deshacer.')) {
              return; // User cancelled
          }

          try {
              const resp = await fetch(`/Proveedores/api/comprobantes/${comprobanteId}/`, {
                  method: 'DELETE',
                  headers: {
                      'Authorization': 'Bearer ' + jwt
                  }
              });

              if (!resp.ok) {
                  // Handle specific error statuses if needed
                  if (resp.status === 401) {
                      alert('Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente.');
                      window.location.href = '/Proveedores/acceder/';
                      return;
                  }
                  // Attempt to read error message from response body
                  const errorText = await resp.text(); // Read as text first
                  let errorMessage = 'Error al eliminar comprobante.';
                  try {
                      const errorJson = JSON.parse(errorText);
                      errorMessage = errorJson.detail || JSON.stringify(errorJson); // Use detail or stringify
                  } catch (e) {
                      // If parsing fails, use the raw text
                      errorMessage = `Error al eliminar comprobante: ${errorText}`;
                  }
                  alert(errorMessage);
                  return false;
              }

              // If successful (status 204 No Content is common for DELETE)
              alert('Comprobante eliminado correctamente.');
              // After deletion, apply current filters to refresh the list
              applyFilters(); // Refresh the list with current filters
              return true;

          } catch (error) {
              console.error('Error deleting comprobante:', error);
              alert('Error de red al eliminar comprobante.');
              return false;
          }
      }


      // Add a single event listener to the parent container using delegation
      listaComprobantes.addEventListener('click', function(event) {
          // Check if the clicked element or its parent is a '.btn-view-comprobante'
          const viewButton = event.target.closest('.btn-view-comprobante');
          const deleteButton = event.target.closest('.btn-eliminar-comprobante'); // Check for delete button

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
          } else if (deleteButton) {
              // Handle delete button click
              const comprobanteId = deleteButton.getAttribute('data-id');
              if (comprobanteId) {
                  eliminarComprobante(comprobanteId);
              } else {
                  console.error('Comprobante ID not found for deletion.');
                  alert('Error interno: No se pudo obtener el ID del comprobante para eliminar.');
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
        // Sanitizar el nombre del archivo antes de enviarlo
        const originalFile = form.archivo.files[0];
        const sanitizedFilename = sanitizeFilename(originalFile.name);
        formData.append('archivo', originalFile, sanitizedFilename);
        formData.append('Num_Oc', document.getElementById('Num_Oc').value.trim()); // Trim OC field

        form.querySelector('button[type="submit"]').disabled = true;
        const exito = await cargarComprobante(formData);
        form.querySelector('button[type="submit"]').disabled = false;

        if (exito) {
          alert('Comprobante cargado correctamente.');
          form.reset();
          montoMask.updateValue(''); // Reset the masked input value
          // After successful upload, switch to the "Ver Comprobantes" tab and apply filters
          const verTab = document.getElementById('ver-tab');
          const tab = new bootstrap.Tab(verTab);
          tab.show();
          // applyFilters() is called automatically by the 'shown.bs.tab' listener
        }
      });

      // Function to collect filter values and call listarComprobantes
      function applyFilters() {
          const filters = {};
          if (filterFechaDesdeInput.value) {
              filters.fecha_desde = filterFechaDesdeInput.value;
          }
          if (filterFechaHastaInput.value) {
              filters.fecha_hasta = filterFechaHastaInput.value;
          }
          if (filterEstadoSelect.value) {
              filters.estado = filterEstadoSelect.value;
          }
          if (filterTipoSelect.value) {
              filters.tipo = filterTipoSelect.value;
          }
          if (filterSearchInput.value.trim()) {
              filters.search = filterSearchInput.value.trim();
          }
          listarComprobantes(filters);
      }

      // Function to clear all filter inputs
      function clearFilters() {
          filterFechaDesdeInput.value = '';
          filterFechaHastaInput.value = '';
          filterEstadoSelect.value = '';
          filterTipoSelect.value = '';
          filterSearchInput.value = '';
      }

      // Function to update the state of the filter button (text and class)
      function updateFilterButtonState() {
          const filtersActive =
              filterFechaDesdeInput.value ||
              filterFechaHastaInput.value ||
              filterEstadoSelect.value ||
              filterTipoSelect.value ||
              filterSearchInput.value.trim();

          if (filtersActive) {
              btnApplyFilters.textContent = 'Quitar Filtros';
              btnApplyFilters.classList.remove('btn-primary');
              btnApplyFilters.classList.add('btn-danger');
          } else {
              btnApplyFilters.textContent = 'Aplicar Filtros';
              btnApplyFilters.classList.remove('btn-danger');
              btnApplyFilters.classList.add('btn-primary');
          }
      }


      // Add event listener to the Apply/Clear Filters button
      btnApplyFilters.addEventListener('click', function() {
          if (btnApplyFilters.classList.contains('btn-danger')) { // If currently "Quitar Filtros"
              clearFilters();
              // applyFilters() will be called below, which will then update the button state
          }
          // Always apply filters after a click (either with new values or cleared values)
          applyFilters();
          // updateFilterButtonState() is called inside listarComprobantes's finally block
      });

      // Initial actions when the page loads
      populateFilterDropdowns();

      // Load comprobantes when the "Ver Comprobantes" tab is shown for the first time
      const verTabElement = document.getElementById('ver-tab');
      verTabElement.addEventListener('shown.bs.tab', event => {
          // Load comprobantes only when the tab is shown
          applyFilters(); // This will load data and then update button state
      });

      // If the "Ver Comprobantes" tab is the default active one, call applyFilters() here:
      // applyFilters(); // Uncomment this line if 'ver' tab is active by default in HTML


    })();

    // Funcion para volver al inicio
    function goToDashboard() {
      window.location.href = '/Proveedores/dashboard/';
    }
