import { loadCredentials, getCredentials, getApiBaseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    await loadCredentials();
    const comprobanteForm = document.getElementById('comprobanteForm');
    const listaComprobantes = document.getElementById('listaComprobantes');
    const filterFechaDesde = document.getElementById('filterFechaDesde');
    const filterFechaHasta = document.getElementById('filterFechaHasta');
    const filterEstado = document.getElementById('filterEstado');
    const filterTipo = document.getElementById('filterTipo');
    const filterSearch = document.getElementById('filterSearch');
    const btnApplyFilters = document.getElementById('btnApplyFilters');

    // Get the selected provider ID from localStorage
    const selectedProviderId = localStorage.getItem('selectedProviderId');

    if (!selectedProviderId) {
        // If no provider is selected, redirect back to the dashboard or show an error
        alert('No se ha seleccionado un proveedor.');
        window.location.href = '../dashboard.html';
        return; // Stop execution
    }

    // Helper function to make authenticated API requests
    async function makeAuthenticatedRequest(url, method = 'GET', data = null, isFileUpload = false) {
        const headers = {};
        const body = new FormData(); // Use FormData for files and other data

        // Add credentials to the body for authentication
        const creds = getCredentials();
        body.append('username', creds.username);
        body.append('password', creds.password);
        body.append('proveedor_id', selectedProviderId); // Include provider ID in all requests

        if (data) {
             if (isFileUpload) {
                 // If it's a file upload, data is expected to be a FormData object
                 // Append its entries to the main body FormData
                 for (const pair of data.entries()) {
                     body.append(pair[0], pair[1]);
                 }
             } else {
                 // For non-file data (like JSON), append as form fields
                 for (const key in data) {
                     if (data.hasOwnProperty(key)) {
                         body.append(key, data[key]);
                     }
                 }
             }
        }

        const options = {
            method: method,
            body: body, // Use FormData as the body
            // Do NOT set Content-Type header for FormData, the browser sets it correctly
        };

        // For GET requests, append data as query parameters instead of body
        if (method === 'GET' && data) {
             const queryParams = new URLSearchParams();
             for (const key in data) {
                 if (data.hasOwnProperty(key)) {
                     queryParams.append(key, data[key]);
                 }
             }
             url = `${url}?${queryParams.toString()}`;
             delete options.body; // Remove body for GET
        }


        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', response.status, errorData);
                // Handle specific error statuses (e.g., 401, 403, 400)
                if (response.status === 401 || response.status === 403) {
                    alert('Error de autenticación. Verifique las credenciales.'); // Use alert for simplicity here
                } else if (response.status === 400) {
                     let errorMsg = 'Error de validación:';
                     for (const field in errorData) {
                         errorMsg += ` ${field}: ${errorData[field].join(', ')}`;
                     }
                     alert(errorMsg);
                }
                 else {
                    alert(`Error en la solicitud: ${response.statusText}`);
                }
                throw new Error(`API request failed with status ${response.status}`);
            }

            if (response.status === 204) {
                 return null; // No content to parse
            }

            return await response.json();

        } catch (error) {
            console.error('Fetch error:', error);
            alert('Error de conexión con el servidor.');
            throw error; // Re-throw to be caught by calling functions
        }
    }


    // --- Form Submission ---
    comprobanteForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        if (!comprobanteForm.checkValidity()) {
            event.stopPropagation();
            comprobanteForm.classList.add('was-validated');
            alert('Por favor, complete los campos obligatorios.');
            return;
        }

        const formData = new FormData(comprobanteForm);

        const apiUrl = `${getApiBaseUrl()}/administracion/api/comprobantes/`;

        try {
            // makeAuthenticatedRequest handles adding credentials and provider_id
            const data = await makeAuthenticatedRequest(apiUrl, 'POST', formData, true); // Indicate file upload

            if (data) {
                alert('Comprobante cargado correctamente.');
                comprobanteForm.reset();
                comprobanteForm.classList.remove('was-validated');
                loadComprobantes(); // Reload the list after successful upload
            }

        } catch (error) {
            console.error('Error uploading comprobante:', error);
            // Error message is displayed by makeAuthenticatedRequest
        }
    });

    // --- Load Comprobantes List ---
    async function loadComprobantes(filters = {}) {
        const apiUrl = `${getApiBaseUrl()}/administracion/api/comprobantes/`;

        // Add provider_id and filter parameters to the request data
        const requestData = {
             proveedor_id: selectedProviderId,
             ...filters // Include filter parameters
        };

        try {
            // makeAuthenticatedRequest handles adding credentials and provider_id/filters for GET
            const data = await makeAuthenticatedRequest(apiUrl, 'GET', requestData);

            listaComprobantes.innerHTML = ''; // Clear existing list

            if (data && data.results && data.results.length > 0) {
                data.results.forEach(comprobante => {
                    const item = `
                        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                            <div>
                                <h5>${comprobante.tipo} - ${comprobante.numero}</h5>
                                <p class="mb-1">Fecha: ${comprobante.fecha_emision}</p>
                                <p class="mb-1">Monto: $${comprobante.monto_total}</p>
                                ${comprobante.Num_Oc ? `<p class="mb-1">OC: ${comprobante.Num_Oc}</p>` : ''}
                                <p class="mb-0">Estado: ${comprobante.estado}</p>
                            </div>
                            <div>
                                ${comprobante.archivo ? `
                                    <button type="button" class="btn btn-sm btn-outline-secondary btn-view-document" data-file-url="${comprobante.archivo}">
                                        Ver Archivo
                                    </button>
                                ` : ''}
                                <!-- Edit/Delete buttons removed as per requirements -->
                            </div>
                        </div>
                    `;
                    listaComprobantes.innerHTML += item;
                });

                // Add event listeners to view document buttons
                listaComprobantes.querySelectorAll('.btn-view-document').forEach(button => {
                    button.addEventListener('click', handleViewDocument);
                });

            } else {
                listaComprobantes.innerHTML = '<div class="list-group-item text-center">No hay comprobantes cargados con los filtros aplicados.</div>';
            }

        } catch (error) {
            console.error('Error loading comprobantes:', error);
            listaComprobantes.innerHTML = '<div class="list-group-item text-center text-danger">Error al cargar comprobantes.</div>';
        }
    }

    // --- Filtering ---
    btnApplyFilters.addEventListener('click', function() {
        const filters = {
            fecha_desde: filterFechaDesde.value,
            fecha_hasta: filterFechaHasta.value,
            estado: filterEstado.value,
            tipo: filterTipo.value,
            search: filterSearch.value,
        };
        loadComprobantes(filters);
    });

    // Populate filter dropdowns (assuming you have APIs for states and types if needed)
    function populateFilterDropdowns() {
        // Example: Populate Estado dropdown (replace with API call if states are dynamic)
        const estados = ["Pendiente", "Validado", "Rechazado"]; // Example states
        filterEstado.innerHTML = '<option value="">Todos</option>';
        estados.forEach(estado => {
            filterEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
        });

        // Example: Populate Tipo dropdown (replace with API call if types are dynamic)
        const tipos = ["Factura A", "Factura B", "Factura C", "Nota de Crédito", "Nota de Débito"]; // Example types
        filterTipo.innerHTML = '<option value="">Todos</option>';
        tipos.forEach(tipo => {
            filterTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
        });
    }

    // --- Document Viewing (Copied from mis_datos.js, adapted) ---
    const documentViewerModal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
    const documentViewerModalBody = document.getElementById('documentViewerModalBody');
    const documentViewerModalLabel = document.getElementById('documentViewerModalLabel');
    const documentViewerModalFooter = document.getElementById('documentViewerModalFooter'); // Get the footer
    const btnReplaceDocument = document.getElementById('btnReplaceDocument'); // Get the replace button

    function handleViewDocument(event) {
        const fileUrl = event.target.dataset.fileUrl;
        if (!fileUrl) return;

        const fileName = fileUrl.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();

        documentViewerModalLabel.textContent = `Ver Documento: ${fileName}`;
        documentViewerModalBody.innerHTML = ''; // Clear previous content

        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.classList.add('img-fluid', 'max-height-modal');
            img.alt = fileName;
            documentViewerModalBody.appendChild(img);
        } else if (fileExtension === 'pdf') {
            const embed = document.createElement('embed');
            embed.src = fileUrl;
            embed.type = 'application/pdf';
            embed.width = '100%';
            embed.height = '600px';
            documentViewerModalBody.appendChild(embed);
        } else {
            const downloadLink = document.createElement('a');
            downloadLink.href = fileUrl;
            downloadLink.textContent = `Descargar "${fileName}"`;
            downloadLink.setAttribute('download', '');
            downloadLink.classList.add('btn', 'btn-primary');
            documentViewerModalBody.appendChild(downloadLink);
        }

        // Hide the "Replace Document" button in the comprobantes view
        btnReplaceDocument.style.display = 'none';
        // Ensure the footer is visible if needed (it might be hidden by mis_datos logic)
        documentViewerModalFooter.style.display = 'flex';


        documentViewerModal.show();
    }

    // --- Utility Functions ---
    // Basic logout function (adapt as needed for your auth flow)
    window.logout = function() {
        // Clear any stored authentication data (if applicable)
        localStorage.removeItem('selectedProviderId'); // Clear selected provider on logout
        // Redirect to login page or home
        window.location.href = '/'; // Example: Redirect to root
    };

    window.goToDashboard = function() {
         window.location.href = '../dashboard.html';
    };


    // --- Initial Load ---
    populateFilterDropdowns(); // Populate filter options
    loadComprobantes(); // Load initial list of comprobantes
});
