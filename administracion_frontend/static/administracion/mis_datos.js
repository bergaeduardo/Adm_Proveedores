import { apiCredentials } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const proveedorForm = document.getElementById('proveedorForm');
    const configForm = document.getElementById('configForm');
    const contactoForm = document.getElementById('contactoForm');
    const formMsg = document.getElementById('formMsg');
    const mensajesStatus = document.getElementById('mensajesStatus');
    const tablaContactosBody = document.getElementById('tablaContactosBody');
    const contactoModal = new bootstrap.Modal(document.getElementById('contactoModal'));
    const contactoModalLabel = document.getElementById('contactoModalLabel');
    const btnGuardarContacto = document.getElementById('btnGuardarContacto');
    const contactoFormMsg = document.getElementById('contactoFormMsg');
    const btnNuevoContacto = document.getElementById('btnNuevoContacto');
    const documentUploadStatus = document.getElementById('documentUploadStatus');

    // Get the selected provider ID from localStorage
    const selectedProviderId = localStorage.getItem('selectedProviderId');

    if (!selectedProviderId) {
        // If no provider is selected, redirect back to the dashboard or show an error
        alert('No se ha seleccionado un proveedor.');
        window.location.href = 'dashboard.html';
        return; // Stop execution
    }

    // --- Tab Navigation Logic ---
    const tabButtons = document.querySelectorAll('.card-header-tabs .nav-link');
    const tabPanes = document.querySelectorAll('.tab-content .tab-pane');
    const btnNextStep = document.getElementById('btnNextStep');
    const btnSave = document.querySelector('.btn-save');

    let currentTabIndex = 0;

    function showTab(index) {
        tabButtons.forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            }
        });

        tabPanes.forEach((pane, i) => {
            if (i === index) {
                pane.classList.add('show', 'active');
            } else {
                pane.classList.remove('show', 'active');
            }
        });

        currentTabIndex = index;

        // Manage button visibility
        if (currentTabIndex === tabButtons.length - 1) {
            btnNextStep.style.display = 'none';
            btnSave.style.display = 'inline-block';
        } else {
            btnNextStep.style.display = 'inline-block';
            btnSave.style.display = 'none';
        }
    }

    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            showTab(index);
        });
    });

    btnNextStep.addEventListener('click', () => {
        if (currentTabIndex < tabButtons.length - 1) {
            showTab(currentTabIndex + 1);
        }
    });

    // Initially show the first tab
    showTab(0);

    // --- API Calls ---

    // Helper function to make authenticated API requests
    async function makeAuthenticatedRequest(url, method = 'GET', data = null, isFileUpload = false) {
        const options = {
            method: method,
        };

        // Add credentials and provider_id based on method
        const authParams = new URLSearchParams({
            username: apiCredentials.username,
            password: apiCredentials.password,
            proveedor_id: selectedProviderId // Include provider ID in all requests
        });

        if (method === 'GET' || method === 'HEAD') {
            // For GET/HEAD, add credentials and provider_id as query parameters
            const urlObj = new URL(url, window.location.origin); // Use window.location.origin for base URL
            urlObj.search = authParams.toString();
            url = urlObj.toString();
            // No body for GET/HEAD
        } else {
            // For POST, PUT, PATCH, DELETE, add credentials and provider_id to the body (FormData)
            const body = new FormData();
            body.append('username', apiCredentials.username);
            body.append('password', apiCredentials.password);
            body.append('proveedor_id', selectedProviderId);

            if (data) {
                 if (isFileUpload) {
                     // If it's a file upload, data is expected to be a FormData object
                     // Append its entries to the main body FormData
                     for (const pair of data.entries()) {
                         body.append(pair[0], pair[1]);
                     }
                 } else {
                     // For non-file data (like JSON or form data), append as form fields
                     for (const key in data) {
                         if (data.hasOwnProperty(key)) {
                             body.append(key, data[key]);
                         }
                     }
                 }
            }
            options.body = body;
            // Do NOT set Content-Type header for FormData, the browser sets it correctly
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', response.status, errorData);
                // Handle specific error statuses (e.g., 401, 403, 400)
                if (response.status === 401 || response.status === 403) {
                    displayMessage(formMsg, 'Error de autenticación. Verifique las credenciales.', 'danger');
                } else if (response.status === 400) {
                     // Display validation errors from the backend
                     let errorMsg = 'Error de validación:';
                     for (const field in errorData) {
                         errorMsg += ` ${field}: ${errorData[field].join(', ')}`;
                     }
                     displayMessage(formMsg, errorMsg, 'danger');
                }
                 else {
                    displayMessage(formMsg, `Error en la solicitud: ${response.statusText}`, 'danger');
                }
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Handle 204 No Content for successful deletions (though delete is forbidden)
            if (response.status === 204) {
                 return null; // No content to parse
            }

            // Handle cases where the response might be empty but status is OK (e.g., 200 with no body)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            } else {
                // If not JSON, return response object or null
                return response;
            }


        } catch (error) {
            console.error('Fetch error:', error);
            displayMessage(formMsg, 'Error de conexión con el servidor.', 'danger');
            throw error; // Re-throw to be caught by calling functions
        }
    }


    // --- Load Data ---
    async function loadProveedorData() {
        const apiUrl = `/administracion/api/proveedores/${selectedProviderId}/`; // Update API URL

        try {
            // makeAuthenticatedRequest now sends credentials as query params for GET
            const data = await makeAuthenticatedRequest(apiUrl, 'GET');

            if (data) {
                // Populate form fields with data
                for (const key in data) {
                    const input = document.getElementById(key);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = data[key];
                        } else {
                            input.value = data[key] || ''; // Use empty string for null/undefined
                        }
                    }
                }
                 // Handle specific fields that might need formatting or special handling
                 // e.g., date fields, select dropdowns
                 // For province, set the display value and hidden IDs
                 if (data.nom_prov) {
                     document.getElementById('provincia').value = data.nom_prov;
                     document.getElementById('id_cpa57').value = data.id_cpa57 || '';
                     document.getElementById('nom_prov').value = data.nom_prov;
                 }

                 // Load dropdown options and set selected values
                 await loadDropdowns(data);

                 // Update document cards based on loaded data
                 updateDocumentCards(data);

                displayMessage(formMsg, 'Datos de proveedor cargados.', 'success');
            } else {
                 displayMessage(formMsg, 'No se pudieron cargar los datos del proveedor.', 'warning');
            }
        } catch (error) {
            console.error('Error loading provider data:', error);
            displayMessage(formMsg, 'Error al cargar los datos del proveedor.', 'danger');
        }
    }

    async function loadDropdowns(proveedorData) {
        // Load Condición IVA
        const condicionIvaSelect = document.getElementById('condicionIva');
        const ivaApiUrl = '/administracion/api/categorias-iva/'; // Update API URL
        try {
            // makeAuthenticatedRequest now sends credentials as query params for GET
            const ivaData = await makeAuthenticatedRequest(ivaApiUrl, 'GET');
            condicionIvaSelect.innerHTML = '<option value="">Seleccione...</option>';
            if (ivaData) {
                ivaData.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.Cod_Categoria_IVA; // Assuming this is the value to save
                    option.textContent = item.Desc_Categoria_IVA;
                    condicionIvaSelect.appendChild(option);
                });
                // Set selected value if available in proveedorData
                if (proveedorData && proveedorData.condicionIva) {
                    condicionIvaSelect.value = proveedorData.condicionIva;
                }
            }
        } catch (error) {
            console.error('Error loading IVA categories:', error);
            displayMessage(formMsg, 'Error al cargar categorías de IVA.', 'danger');
        }

        // Load Ingresos Brutos
        const ingresosBrutosSelect = document.getElementById('ingresosBrutos');
        const iibbApiUrl = '/administracion/api/ingresos-brutos/'; // Update API URL
        try {
            // makeAuthenticatedRequest now sends credentials as query params for GET
            const iibbData = await makeAuthenticatedRequest(iibbApiUrl, 'GET');
            ingresosBrutosSelect.innerHTML = '<option value="">Seleccione...</option>';
            if (iibbData) {
                iibbData.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.Cod_Ingresos_brutos; // Assuming this is the value to save
                    option.textContent = item.Desc_Ingresos_brutos;
                    ingresosBrutosSelect.appendChild(option);
                });
                 // Set selected value if available in proveedorData
                 if (proveedorData && proveedorData.ingresosBrutos) {
                     ingresosBrutosSelect.value = proveedorData.ingresosBrutos;
                 }
            }
        } catch (error) {
            console.error('Error loading Ingresos Brutos:', error);
            displayMessage(formMsg, 'Error al cargar regímenes de Ingresos Brutos.', 'danger');
        }
    }


    async function loadContactos() {
        const apiUrl = `/administracion/api/contactos/?proveedor_id=${selectedProviderId}`; // Update API URL and add provider_id query param

        try {
            // makeAuthenticatedRequest now sends credentials as query params for GET
            const data = await makeAuthenticatedRequest(apiUrl, 'GET');

            tablaContactosBody.innerHTML = ''; // Clear existing rows

            if (data && data.results && data.results.length > 0) {
                data.results.forEach(contacto => {
                    const row = `
                        <tr>
                            <td>${contacto.nombre || ''}</td>
                            <td>${contacto.cargo || ''}</td>
                            <td>${contacto.email || ''}</td>
                            <td>${contacto.telefono || ''}</td>
                            <td class="text-center">${contacto.defecto === 'S' ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
                            <td class="text-center">${contacto.envia_pdf_oc === 'S' ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
                            <td class="text-center">${contacto.envia_pdf_op === 'S' ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
                            <td class="text-center">
                                <button type="button" class="btn btn-sm btn-outline-primary btn-edit-contacto me-2" data-id="${contacto.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <!-- Delete button removed as per data preservation requirement -->
                                <!--
                                <button type="button" class="btn btn-sm btn-outline-danger btn-delete-contacto" data-id="${contacto.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                                -->
                            </td>
                        </tr>
                    `;
                    tablaContactosBody.innerHTML += row;
                });

                // Add event listeners to edit buttons
                tablaContactosBody.querySelectorAll('.btn-edit-contacto').forEach(button => {
                    button.addEventListener('click', handleEditContacto);
                });

            } else {
                tablaContactosBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No hay contactos cargados.</td></tr>';
            }
             displayMessage(mensajesStatus, 'Contactos cargados.', 'success');

        } catch (error) {
            console.error('Error loading contactos:', error);
            tablaContactosBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error al cargar contactos.</td></tr>';
            displayMessage(mensajesStatus, 'Error al cargar contactos.', 'danger');
        }
    }

    // --- Save Data ---
    proveedorForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        if (!proveedorForm.checkValidity()) {
            event.stopPropagation();
            proveedorForm.classList.add('was-validated');
            displayMessage(formMsg, 'Por favor, complete los campos obligatorios.', 'warning');
            return;
        }

        const formData = new FormData(proveedorForm);
        // Add data from configForm as well
        const configFormData = new FormData(configForm);
        for (const pair of configFormData.entries()) {
             // Handle checkboxes separately as FormData only includes checked ones
             if (configForm.elements[pair[0]].type === 'checkbox') {
                 formData.append(pair[0], configForm.elements[pair[0]].checked ? 'S' : 'N');
             } else {
                 formData.append(pair[0], pair[1]);
             }
        }

        // Add file inputs to the FormData
        document.querySelectorAll('.file-input').forEach(input => {
            if (input.files.length > 0) {
                formData.append(input.name, input.files[0]);
            }
        });


        const apiUrl = `/administracion/api/proveedores/${selectedProviderId}/`; // Update API URL

        try {
            // makeAuthenticatedRequest handles adding credentials and provider_id to body for PATCH
            const data = await makeAuthenticatedRequest(apiUrl, 'PATCH', formData, true); // Use PATCH for partial update, indicate file upload

            if (data) {
                displayMessage(formMsg, 'Datos de proveedor guardados correctamente.', 'success');
                 // Reload data to update document statuses and potentially other fields
                 loadProveedorData();
            }

        } catch (error) {
            console.error('Error saving provider data:', error);
            // Error message is displayed by makeAuthenticatedRequest
        }
    });

    // --- Contact Management ---
    btnNuevoContacto.addEventListener('click', function() {
        // Reset form for new contact
        contactoForm.reset();
        document.getElementById('contactoId').value = ''; // Clear contact ID
        contactoModalLabel.textContent = 'Agregar Contacto';
        contactoFormMsg.classList.add('d-none');
        contactoForm.classList.remove('was-validated');
        contactoModal.show();
    });

    async function handleEditContacto(event) {
        const contactoId = event.target.closest('button').dataset.id;
        const apiUrl = `/administracion/api/contactos/${contactoId}/?proveedor_id=${selectedProviderId}`; // Update API URL and add provider_id

        try {
            // makeAuthenticatedRequest now sends credentials as query params for GET
            const data = await makeAuthenticatedRequest(apiUrl, 'GET');

            if (data) {
                // Populate contact form
                document.getElementById('contactoId').value = data.id;
                document.getElementById('contactoNombre').value = data.nombre || '';
                document.getElementById('contactoCargo').value = data.cargo || '';
                document.getElementById('contactoTelefono').value = data.telefono || '';
                document.getElementById('contactoMovil').value = data.telefono_movil || '';
                document.getElementById('contactoEmail').value = data.email || '';
                document.getElementById('contactoObservaciones').value = data.observacion || '';
                document.getElementById('contactoDefecto').checked = data.defecto === 'S';
                document.getElementById('contactoEnviaPdfOc').checked = data.envia_pdf_oc === 'S';
                document.getElementById('contactoEnviaPdfOp').checked = data.envia_pdf_op === 'S';

                contactoModalLabel.textContent = 'Editar Contacto';
                contactoFormMsg.classList.add('d-none');
                contactoForm.classList.remove('was-validated');
                contactoModal.show();
            }
        } catch (error) {
            console.error('Error loading contact data:', error);
            displayMessage(mensajesStatus, 'Error al cargar datos del contacto.', 'danger');
        }
    }

    contactoForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        if (!contactoForm.checkValidity()) {
            event.stopPropagation();
            contactoForm.classList.add('was-validated');
            displayMessage(contactoFormMsg, 'Por favor, complete los campos obligatorios.', 'warning');
            return;
        }

        const contactoId = document.getElementById('contactoId').value;
        const method = contactoId ? 'PUT' : 'POST'; // Use PUT for update, POST for create
        const apiUrl = contactoId ? `/administracion/api/contactos/${contactoId}/` : '/administracion/api/contactos/'; // Update API URL

        const formData = new FormData(contactoForm);
        // Handle checkboxes explicitly for 'S'/'N' values
        formData.set('defecto', document.getElementById('contactoDefecto').checked ? 'S' : 'N');
        formData.set('envia_pdf_oc', document.getElementById('contactoEnviaPdfOc').checked ? 'S' : 'N');
        formData.set('envia_pdf_op', document.getElementById('contactoEnviaPdfOp').checked ? 'S' : 'N');

        // makeAuthenticatedRequest handles adding credentials and provider_id to body for POST/PUT
        try {
            const data = await makeAuthenticatedRequest(apiUrl, method, formData);

            if (data) {
                displayMessage(mensajesStatus, `Contacto ${contactoId ? 'actualizado' : 'agregado'} correctamente.`, 'success');
                contactoModal.hide();
                loadContactos(); // Reload contacts list
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            // Error message is displayed by makeAuthenticatedRequest
            displayMessage(contactoFormMsg, 'Error al guardar contacto.', 'danger');
        }
    });

    // --- Document Upload/View ---
    const documentViewerModal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
    const documentViewerModalBody = document.getElementById('documentViewerModalBody');
    const documentViewerModalLabel = document.getElementById('documentViewerModalLabel');
    const btnReplaceDocument = document.getElementById('btnReplaceDocument');
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const confirmationModalBody = document.getElementById('confirmationModalBody');
    const btnConfirmUpload = document.getElementById('btnConfirmUpload');

    let currentFileInputId = null; // To track which file input is active for confirmation

    // Event listeners for document action buttons (Cargar/Ver/Reemplazar)
    document.querySelectorAll('.document-card .action-btn').forEach(button => {
        button.addEventListener('click', handleDocumentAction);
    });

    // Event listener for hidden file inputs
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', handleFileSelect);
    });

    // Event listener for the "Replace Document" button in the viewer modal
    btnReplaceDocument.addEventListener('click', function() {
        const fileInputId = btnReplaceDocument.dataset.fileInputId;
        if (fileInputId) {
            // Trigger the click on the corresponding hidden file input
            document.getElementById(fileInputId).click();
            documentViewerModal.hide(); // Hide the viewer modal
        }
    });

    // Event listener for the confirmation modal's confirm button
    btnConfirmUpload.addEventListener('click', function() {
        if (currentFileInputId) {
            // Find the file input and trigger the upload logic
            const fileInput = document.getElementById(currentFileInputId);
            if (fileInput && fileInput.files.length > 0) {
                uploadDocument(fileInput);
            }
        }
        confirmationModal.hide();
    });


    function handleDocumentAction(event) {
        const button = event.target.closest('button');
        const fileInputId = button.dataset.fileInputId;
        const documentCard = button.closest('.document-card');
        const statusText = documentCard.querySelector('.document-status-text').textContent;

        if (statusText.includes('Pendiente de carga') || button.textContent.includes('Cargar')) {
            // If status is 'Pendiente de carga' or button is 'Cargar', trigger file input click
            document.getElementById(fileInputId).click();
        } else if (statusText.includes('Cargado') || button.textContent.includes('Ver')) {
            // If status is 'Cargado' or button is 'Ver', open viewer modal
            viewDocument(fileInputId);
        }
        // If status is 'Pendiente de validación' or 'Validado', no action on click? Or maybe view?
        // For now, only handle 'Cargar' and 'Ver'.
    }

    function handleFileSelect(event) {
        const fileInput = event.target;
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            const fileSize = fileInput.files[0].size; // in bytes
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (fileSize > maxSize) {
                displayMessage(documentUploadStatus, `El archivo "${fileName}" es demasiado grande (máx. 5MB).`, 'danger');
                fileInput.value = ''; // Clear the selected file
                return;
            }

            // Show confirmation modal before uploading
            currentFileInputId = fileInput.id; // Store the ID for confirmation
            confirmationModalBody.innerHTML = `<p>¿Confirma la carga del archivo "${fileName}"?</p>`;
            confirmationModal.show();

        }
    }

    async function uploadDocument(fileInput) {
        const file = fileInput.files[0];
        const fieldName = fileInput.name; // e.g., 'cuit_file'
        const frontendInputId = fileInput.id; // e.g., 'cuitFile'

        const formData = new FormData();
        formData.append(fieldName, file);

        const apiUrl = `/administracion/api/proveedores/${selectedProviderId}/`; // Update API URL

        displayMessage(documentUploadStatus, `Subiendo "${file.name}"...`, 'info');

        try {
            // makeAuthenticatedRequest handles adding credentials and provider_id to body for PATCH
            const data = await makeAuthenticatedRequest(apiUrl, 'PATCH', formData, true); // Use PATCH for partial update, indicate file upload

            if (data) {
                displayMessage(documentUploadStatus, `Archivo "${file.name}" subido correctamente.`, 'success');
                // Update the corresponding document card status
                updateDocumentCardStatus(frontendInputId, data);
            } else {
                 displayMessage(documentUploadStatus, `Error al subir archivo "${file.name}".`, 'danger');
            }

        } catch (error) {
            console.error('Error uploading document:', error);
            displayMessage(documentUploadStatus, `Error al subir archivo "${file.name}".`, 'danger');
        } finally {
            fileInput.value = ''; // Clear the file input after upload attempt
            currentFileInputId = null; // Reset the tracking variable
        }
    }

    function updateDocumentCards(proveedorData) {
        const fileFieldMap = {
            'cuitFile': 'cuit_file',
            'ingBrutosFile': 'ing_brutos_file',
            'exclGananciasFile': 'excl_ganancias_file',
            'cm05File': 'cm05_file',
            'noRetGananciasFile': 'no_ret_ganancias_file',
            'exclIIBBFile': 'excl_iibb_file',
            'cbuFile': 'cbu_file',
        };

        for (const frontendInputId in fileFieldMap) {
            updateDocumentCardStatus(frontendInputId, proveedorData);
        }
    }

    function updateDocumentCardStatus(frontendInputId, proveedorData) {
        const documentCard = document.getElementById(`card-${frontendInputId}`);
        if (!documentCard) return;

        const modelFieldName = document.getElementById(frontendInputId).name; // Get the name attribute (e.g., 'cuit_file')
        const fileUrl = proveedorData[modelFieldName]; // Get the file URL from the data
        const statusTextElement = documentCard.querySelector('.document-status-text');
        const actionButton = documentCard.querySelector('.action-btn');
        const statusIconArea = documentCard.querySelector('.document-icon-area');
        const requiredAsterisk = documentCard.querySelector('.required-asterisk');

        // Remove previous status classes
        documentCard.classList.remove('status-required-missing', 'status-optional-missing', 'status-uploaded', 'status-validated');
        statusIconArea.innerHTML = ''; // Clear previous icon

        const isRequired = requiredAsterisk && !requiredAsterisk.classList.contains('d-none');

        if (fileUrl) {
            // File is uploaded
            documentCard.classList.add('status-uploaded'); // Or status-validated if you have that info
            statusTextElement.textContent = 'Cargado'; // Or 'Validado'
            actionButton.textContent = 'Ver Documento';
            actionButton.classList.remove('btn-primary', 'btn-outline-primary');
            actionButton.classList.add('btn-secondary'); // Change button style to indicate viewing

            // Add check icon
            statusIconArea.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-check-circle-fill status-icon text-success" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
            `;

        } else {
            // File is missing
            if (isRequired) {
                documentCard.classList.add('status-required-missing');
                statusTextElement.textContent = 'Pendiente de carga';
                actionButton.textContent = 'Cargar Archivo';
                actionButton.classList.remove('btn-outline-primary', 'btn-secondary');
                actionButton.classList.add('btn-primary');

                 // Add warning icon
                 statusIconArea.innerHTML = `
                     <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-triangle-fill status-icon text-warning" viewBox="0 0 16 16">
                       <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                     </svg>
                 `;

            } else {
                documentCard.classList.add('status-optional-missing');
                statusTextElement.textContent = 'Opcional, no cargado';
                actionButton.textContent = 'Cargar (Opcional)';
                actionButton.classList.remove('btn-primary', 'btn-secondary');
                actionButton.classList.add('btn-outline-primary');

                 // Add info icon
                 statusIconArea.innerHTML = `
                     <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-info-circle-fill status-icon text-info" viewBox="0 0 16 16">
                         <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412l-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                     </svg>
                 `;
            }
        }
    }


    function viewDocument(fileInputId) {
        const modelFieldName = document.getElementById(fileInputId).name;
        // Assuming the file URL is available in the loaded proveedorData
        // You would need to store the loaded data globally or fetch it again
        // For simplicity, let's assume we refetch the provider data or have it available.
        // A better approach is to get the URL from the initial loadProveedorData call.

        // For now, let's assume we can get the URL from the data attribute of the card or refetch
        // A more robust solution would involve the backend providing a temporary signed URL.
        // Given the current API structure, the file URL is returned in the GET response for the provider.
        // We need to access that data. Let's refetch for simplicity in this example,
        // but optimize in a real application.

        // Refetch provider data to get the latest file URLs
        makeAuthenticatedRequest(`/administracion/api/proveedores/${selectedProviderId}/`, 'GET')
            .then(proveedorData => {
                if (proveedorData && proveedorData[modelFieldName]) {
                    const fileUrl = proveedorData[modelFieldName];
                    const fileName = fileUrl.split('/').pop(); // Simple way to get filename from URL
                    const fileExtension = fileName.split('.').pop().toLowerCase();

                    documentViewerModalLabel.textContent = `Ver Documento: ${fileName}`;
                    documentViewerModalBody.innerHTML = ''; // Clear previous content

                    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                        // Display image
                        const img = document.createElement('img');
                        img.src = fileUrl;
                        img.classList.add('img-fluid', 'max-height-modal'); // Add a class for max height
                        img.alt = fileName;
                        documentViewerModalBody.appendChild(img);
                    } else if (fileExtension === 'pdf') {
                        // Embed PDF
                        const embed = document.createElement('embed');
                        embed.src = fileUrl;
                        embed.type = 'application/pdf';
                        embed.width = '100%';
                        embed.height = '600px'; // Adjust height as needed
                        documentViewerModalBody.appendChild(embed);
                    } else {
                        // Offer download for other file types
                        const downloadLink = document.createElement('a');
                        downloadLink.href = fileUrl;
                        downloadLink.textContent = `Descargar "${fileName}"`;
                        downloadLink.setAttribute('download', ''); // Suggest download
                        downloadLink.classList.add('btn', 'btn-primary');
                        documentViewerModalBody.appendChild(downloadLink);
                    }

                    // Set the file input ID on the replace button
                    btnReplaceDocument.dataset.fileInputId = fileInputId;
                    btnReplaceDocument.style.display = 'inline-block'; // Show replace button

                    documentViewerModal.show();
                } else {
                    displayMessage(documentUploadStatus, 'No se encontró el documento para visualizar.', 'warning');
                }
            })
            .catch(error => {
                console.error('Error fetching provider data for document view:', error);
                displayMessage(documentUploadStatus, 'Error al obtener la URL del documento.', 'danger');
            });
    }


    // --- Utility Functions ---
    function displayMessage(element, message, type) {
        element.textContent = message;
        element.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning', 'alert-info');
        element.classList.add(`alert-${type}`);
    }

    // Basic logout function (adapt as needed for your auth flow)
    window.logout = function() {
        // Clear any stored authentication data (if applicable)
        localStorage.removeItem('selectedProviderId'); // Clear selected provider on logout
        // Redirect to login page or home
        window.location.href = '/'; // Example: Redirect to root
    };

    // --- Initial Load ---
    loadProveedorData();
    loadContactos(); // Load contacts when the page loads
});
