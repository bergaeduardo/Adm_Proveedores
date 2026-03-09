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

// --- Sistema de notificaciones moderno (Bootstrap Toasts) ---
function mostrarToast(mensaje, tipo = 'success', duracion = 4500) {
  const container = document.getElementById('toastContainer');
  if (!container) { console.warn(mensaje); return; }
  const id = 'toast_' + Date.now();
  const iconos = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-check-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
    danger:  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
    info:    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-info-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
  };
  const colores = { success: 'text-bg-success', danger: 'text-bg-danger', warning: 'text-bg-warning text-dark', info: 'text-bg-info text-dark' };
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center ${colores[tipo] || 'text-bg-secondary'} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${duracion}">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-start" style="font-size:.95rem">${iconos[tipo] || ''}${mensaje}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    </div>`);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Confirmación de eliminación mediante modal Bootstrap (retorna Promise<boolean>)
function confirmarEliminacion(mensaje) {
  return new Promise(resolve => {
    const modalEl = document.getElementById('deleteConfirmModal');
    document.getElementById('deleteConfirmModalBody').textContent = mensaje;
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const btnConfirm = document.getElementById('btnDeleteConfirm');
    const btnCancel  = document.getElementById('btnDeleteCancel');

    function cleanup(result) {
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      bsModal.hide();
      resolve(result);
    }
    function onConfirm() { cleanup(true); }
    function onCancel()  { cleanup(false); }

    modalEl.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
    btnConfirm.addEventListener('click', onConfirm, { once: true });
    btnCancel.addEventListener('click',  onCancel,  { once: true });
    bsModal.show();
  });
}

(function() {
      // Verificación simple de tokens
      const jwt = sessionStorage.getItem('jwt');
      const refresh = sessionStorage.getItem('refresh_token');
      
      if (!jwt || !refresh) {
        mostrarToast('Debe iniciar sesión para acceder a esta página.', 'warning', 3000);
        setTimeout(() => { window.location.href = '/Proveedores/acceder/'; }, 1500);
        return;
      }

      const form = document.getElementById('comprobanteForm');
      const listaComprobantes = document.getElementById('listaComprobantes');
      const montoTotalInput = document.getElementById('monto_total');
      const selectOC = document.getElementById('Num_Oc');

      // Carga las OC pendientes del proveedor desde SQL Server
      async function cargarOrdenesCompra() {
        try {
          const resp = await AuthManager.authenticatedFetch('/Proveedores/api/ordenes-compra/');
          if (!resp.ok) throw new Error('Respuesta no exitosa: ' + resp.status);
          const data = await resp.json();
          selectOC.innerHTML = '';
          if (data.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.textContent = 'No hay órdenes de compra pendientes';
            selectOC.appendChild(opt);
          } else {
            data.forEach(oc => {
              const opt = document.createElement('option');
              opt.value = oc.nro_orden_co;
              opt.textContent = oc.nro_orden_co;
              selectOC.appendChild(opt);
            });
          }
        } catch (error) {
          selectOC.innerHTML = '<option value="" disabled>Error al cargar órdenes de compra</option>';
          console.error('Error cargando OC:', error);
          const authErrors = ['Token inválido o expirado', 'Autenticación fallida después de refresh', 'No se pudo renovar el token'];
          if (!authErrors.includes(error.message)) {
            mostrarToast('No se pudieron cargar las órdenes de compra. Intente recargar la página.', 'warning');
          }
        }
      }

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
        let feedback = input.nextElementSibling;
        // Si el siguiente elemento es un <small> de ayuda, saltarlo
        if (feedback && feedback.tagName === 'SMALL') {
          feedback = feedback.nextElementSibling;
        }
        if (feedback) {
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

        // Validar que el operador haya seleccionado al menos una Orden de Compra
        const selectedOCs = Array.from(selectOC.selectedOptions).filter(o => o.value);
        if (selectedOCs.length === 0) {
          mostrarError(selectOC, 'Debe seleccionar al menos una Orden de Compra.');
          valido = false;
        }

        return valido;
      }

      async function cargarComprobante(formData) {
        try {
          const resp = await AuthManager.authenticatedFetch('/Proveedores/api/comprobantes/', {
            method: 'POST',
            body: formData
          });
          if (!resp.ok) {
            const errorData = await resp.json();
            const mensajes = Object.values(errorData)
              .map(v => Array.isArray(v) ? v.join(', ') : String(v))
              .join(' | ');
            mostrarToast('Error al cargar comprobante: ' + mensajes, 'danger', 7000);
            return false;
          }
          return true;
        } catch (error) {
          console.error('Error cargando comprobante:', error);
          const authErrors = ['Token inválido o expirado', 'Autenticación fallida después de refresh', 'No se pudo renovar el token'];
          if (!authErrors.includes(error.message)) {
            mostrarToast('Error de red al cargar comprobante. Verifique su conexión.', 'danger');
          }
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

          // Usar fetch simple para carga inicial
          const token = sessionStorage.getItem('jwt');
          let resp = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          
          // Solo renovar si hay error de autenticación
          if (resp.status === 401 || resp.status === 403) {
            console.log('Renovando token para cargar comprobantes...');
            resp = await AuthManager.authenticatedFetch(url);
          }
          
          if (!resp.ok) {
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
                Órdenes de Compra: ${(c.Num_Oc && c.Num_Oc.length > 0) ? (Array.isArray(c.Num_Oc) ? c.Num_Oc.join(', ') : c.Num_Oc) : 'N/A'} <br />
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
          const confirmado = await confirmarEliminacion('¿Está seguro de que desea eliminar este comprobante? Esta acción no se puede deshacer.');
          if (!confirmado) return;

          try {
              const resp = await AuthManager.authenticatedFetch(`/Proveedores/api/comprobantes/${comprobanteId}/`, {
                  method: 'DELETE'
              });

              if (!resp.ok) {
                  const errorText = await resp.text();
                  let errorMessage = 'No se pudo eliminar el comprobante.';
                  try {
                      const errorJson = JSON.parse(errorText);
                      errorMessage = errorJson.detail || 'No se pudo eliminar el comprobante.';
                  } catch (e) {}
                  mostrarToast(errorMessage, 'danger');
                  return false;
              }

              mostrarToast('Comprobante eliminado correctamente.', 'success');
              applyFilters();
              return true;

          } catch (error) {
              console.error('Error deleting comprobante:', error);
              const authErrors = ['Token inválido o expirado', 'Autenticación fallida después de refresh', 'No se pudo renovar el token'];
              if (!authErrors.includes(error.message)) {
                  mostrarToast('Error de red al eliminar comprobante.', 'danger');
              }
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
                  if (typeof viewDocument === 'function') {
                      viewDocument(fileUrl);
                  } else {
                      console.error('viewDocument function not found. Ensure mis_datos.js is loaded.');
                      mostrarToast('Error interno: No se pudo abrir el visor de documentos.', 'danger');
                  }
              } else {
                  mostrarToast('No hay archivo adjunto para este comprobante.', 'info');
              }
          } else if (deleteButton) {
              // Handle delete button click
              const comprobanteId = deleteButton.getAttribute('data-id');
              if (comprobanteId) {
                  eliminarComprobante(comprobanteId);
              } else {
                  console.error('Comprobante ID not found for deletion.');
                  mostrarToast('Error interno: No se pudo obtener el ID del comprobante.', 'danger');
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
        // Recopilar las OC seleccionadas y enviarlas como JSON
        const selectedOCs = Array.from(selectOC.selectedOptions)
          .map(opt => opt.value)
          .filter(v => v);
        formData.append('Num_Oc', JSON.stringify(selectedOCs));

        form.querySelector('button[type="submit"]').disabled = true;
        const exito = await cargarComprobante(formData);
        form.querySelector('button[type="submit"]').disabled = false;

        if (exito) {
          mostrarToast('Comprobante cargado correctamente.', 'success');
          form.reset();
          // Deseleccionar todas las opciones del select múltiple de OC
          Array.from(selectOC.options).forEach(opt => { opt.selected = false; });
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
      cargarOrdenesCompra(); // Cargar OC pendientes al inicio

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
