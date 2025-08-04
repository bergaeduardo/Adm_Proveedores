// API interactions for Administración do not require credenciales

// Configuración de documentos y campos reutilizada de Proveedores
let documentosRequeridosFijos = ['cuitFile', 'ingBrutosFile'];
let documentosCondicionalesMap = {
    'certExclGanancias': 'exclGananciasFile',
    'certExclIIBB': 'exclIIBBFile',
    'certNoRetGanancias': 'noRetGananciasFile',
    'certNoRetIIBB': 'noRetIIBBFile'
};

const fileInputIdToModelFieldName = {
    'cuitFile': 'cuit_file',
    'ingBrutosFile': 'ing_brutos_file',
    'exclGananciasFile': 'excl_ganancias_file',
    'cm05File': 'cm05_file',
    'noRetGananciasFile': 'no_ret_ganancias_file',
    'exclIIBBFile': 'excl_iibb_file',
    'noRetIIBBFile': 'no_ret_iibb_file',
    'cbuFile': 'cbu_file',
};

const camposContactoObligatorios = ["nom_provee", "n_cuit", "telefono_1", "e_mail", "domicilio", "cbu"];

const certificacionSwitches = [
    { id: 'certExclGanancias', name: 'excl_ganancias_file', documentId: 'exclGananciasFile' },
    { id: 'certExclIIBB', name: 'excl_iibb_file', documentId: 'exclIIBBFile' },
    { id: 'certNoRetGanancias', name: 'no_ret_ganancias_file', documentId: 'noRetGananciasFile' },
    { id: 'certNoRetIIBB', name: 'no_ret_iibb_file', documentId: 'noRetIIBBFile' }
];

function getDynamicRequiredDocumentIds() {
    let dynamicRequired = [...documentosRequeridosFijos];
    for (const switchId in documentosCondicionalesMap) {
        const switchElement = document.getElementById(switchId);
        if (switchElement && switchElement.checked) {
            dynamicRequired.push(documentosCondicionalesMap[switchId]);
        }
    }
    return dynamicRequired;
}

// Helper para actualizar la UI de cada tarjeta de documento
function actualizarUICardDocumento(fileInputId, fileName, fileUrl, esRequerido) {
    const input = document.getElementById(fileInputId);
    if (!input) { return; }
    const cardBody = input.closest('.document-card-body');
    if (!cardBody) { return; }

    const statusTextElement = cardBody.querySelector('.document-status-text');
    const actionButton = cardBody.querySelector('.action-btn');
    const documentCard = input.closest('.document-card');
    const statusIconArea = cardBody.querySelector('.document-icon-area');
    const requiredAsterisk = documentCard.querySelector('.required-asterisk');

    if(!statusTextElement || !actionButton || !documentCard || !statusIconArea || !requiredAsterisk) { return; }

    documentCard.classList.remove('status-required-missing', 'status-optional-missing', 'status-present', 'border', 'border-danger');
    actionButton.classList.remove('btn-primary', 'btn-outline-primary', 'btn-outline-secondary');

    actionButton.setAttribute('data-file-input-id', fileInputId);

    if (esRequerido) {
        requiredAsterisk.classList.remove('d-none');
        if (fileName) {
            statusTextElement.textContent = 'Archivo cargado: ' + fileName;
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill me-1" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg> Ver Documento`;
            actionButton.onclick = () => viewDocument(fileUrl, fileInputId);
            actionButton.classList.add('btn-outline-secondary');
            documentCard.classList.add('status-present');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check-circle-fill status-icon" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`;
        } else {
            statusTextElement.textContent = 'Pendiente de carga';
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload me-1" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/></svg> Cargar Archivo`;
            actionButton.onclick = () => triggerUpload(fileInputId);
            actionButton.classList.add('btn-primary');
            documentCard.classList.add('status-required-missing');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill status-icon" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/></svg>`;
        }
    } else {
        requiredAsterisk.classList.add('d-none');
        if (fileName) {
            statusTextElement.textContent = 'Archivo cargado: ' + fileName;
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill me-1" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg> Ver Documento`;
            actionButton.onclick = () => viewDocument(fileUrl, fileInputId);
            actionButton.classList.add('btn-outline-secondary');
            documentCard.classList.add('status-present');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check-circle-fill status-icon" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`;
        } else {
            statusTextElement.textContent = 'Opcional, no cargado';
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload me-1" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/></svg> Cargar (Opcional)`;
            actionButton.onclick = () => triggerUpload(fileInputId);
            actionButton.classList.add('btn-outline-primary');
            documentCard.classList.add('status-optional-missing');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle-fill status-icon" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/></svg>`;
        }
    }
}

function gatherFormDataFromAllTabs() {
    const formData = new FormData();
    const formsToProcess = ['#proveedorForm', '#configForm'];
    formsToProcess.forEach(formSelector => {
        const formElements = document.querySelectorAll(`${formSelector} input:not([type="file"]), ${formSelector} select, ${formSelector} textarea`);
        formElements.forEach(el => {
            if ((el.name || el.id) && !el.disabled) {
                const key = el.name || el.id;
                if (el.type === 'checkbox' && (key === 'contactoDefecto' || key === 'contactoEnviaPdfOc' || key === 'contactoEnviaPdfOp' || certificacionSwitches.some(s => s.id === key))) {
                    const formKey = certificacionSwitches.find(s => s.id === key)?.name || key;
                    formData.append(formKey, el.checked ? 'S' : 'N');
                } else if (el.type === 'checkbox') {
                    formData.append(key, el.checked);
                } else if (el.type === 'radio') {
                    if (el.checked) { formData.append(key, el.value.trim() === "" ? '' : el.value.trim()); }
                } else {
                    formData.append(key, el.value.trim() === "" ? '' : el.value.trim());
                }
            }
        });
    });
    if (formData.has('provincia_display')) { formData.delete('provincia_display'); }
    const idCpa57Val = document.getElementById('id_cpa57').value;
    const nomProvVal = document.getElementById('nom_prov').value;
    formData.set('id_cpa57', idCpa57Val || '');
    formData.set('nom_prov', nomProvVal || '');
    formData.set('id_categoria_iva_cond_iva', document.getElementById('condicionIva').value || '');
    if (formData.has('condicionIva')) formData.delete('condicionIva');
    formData.set('tipo', document.getElementById('ingresosBrutos').value || '');
    if (formData.has('ingresosBrutos')) formData.delete('ingresosBrutos');
    const fileInputsDocumentos = document.querySelectorAll('#documents-tab-pane .file-input');
    fileInputsDocumentos.forEach(input => {
        const modelFieldName = fileInputIdToModelFieldName[input.id];
        if (modelFieldName && input.files && input.files.length > 0) {
            formData.append(modelFieldName, input.files[0], input.files[0].name);
        }
    });
    return formData;
}

function triggerUpload(fileInputId) {
    const input = document.getElementById(fileInputId);
    if (input) { input.click(); }
}

let documentViewerModal;
let documentViewerModalBody;
let btnReplaceDocument;
let documentViewerModalLabel;

function viewDocument(fileUrl, fileInputId) {
    const fileName = fileUrl ? fileUrl.split('/').pop() : '';
    const fileExtension = fileName.split('.').pop().toLowerCase();
    documentViewerModalLabel.textContent = `Ver Documento: ${fileName}`;
    documentViewerModalBody.innerHTML = '';
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
    btnReplaceDocument.dataset.fileInputId = fileInputId;
    btnReplaceDocument.style.display = 'inline-block';
    documentViewerModal.show();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

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
    documentViewerModal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
    documentViewerModalBody = document.getElementById('documentViewerModalBody');
    btnReplaceDocument = document.getElementById('btnReplaceDocument');
    documentViewerModalLabel = document.getElementById('documentViewerModalLabel');

    // Get the selected provider ID from localStorage
    const selectedProviderId = localStorage.getItem('selectedProviderId');

    if (!selectedProviderId) {
        alert('No se ha seleccionado un proveedor.');
        window.location.href = '../dashboard/';
        return;
    }

    let proveedorId = selectedProviderId ? parseInt(selectedProviderId) : null;
    let userId = null;
    let codCpa01Value = null;
    let initialData = {};
    let codPais = null;
    let proveedorFileStates = {};

    const camposBloquear = ["nom_provee","nom_fant","n_cuit"];
    const camposPrincipalesEditables = [
        { key: "nom_provee", label: "Razon social" }, { key: "n_cuit", label: "CUIT" },
        { key: "domicilio", label: "Domicilio" }, { key: "localidad", label: "Localidad" },
        { key: "c_postal", label: "Código postal" }, { key: "telefono_1", label: "Teléfono" },
        { key: "telefono_2", label: "Teléfono 2" }, { key: "telefono_movil", label: "Teléfono móvil" },
        { key: "e_mail", label: "Email" }, { key: "web", label: "Pagina Web" },
        { key: "nom_fant", label: "Nombre comercial" }, { key: "domicilio_comercial", label: "Domicilio comercial" },
        { key: "n_iva", label: "Actividad" },
    ];

    const steps = [
        { id: 'step1', name: 'Datos de Empresa y Contacto', panelId: 'home-tab-pane', buttonId: 'home-tab-btn' },
        { id: 'step2', name: 'Configuración y Datos Bancarios', panelId: 'config-tab-pane', buttonId: 'config-tab-btn' },
        { id: 'step3', name: 'Contactos de Mensajería', panelId: 'messages-tab-pane', buttonId: 'messages-tab-btn' },
        { id: 'step4', name: 'Documentos Adjuntos', panelId: 'documents-tab-pane', buttonId: 'documents-tab-btn' }
    ];
    let currentStepIndex = 0;
    const btnNextStep = document.getElementById('btnNextStep');
    const btnSave = document.querySelector('.btn-save');
    const tabButtons = document.querySelectorAll('#myTab .nav-link');
    const tabPanes = document.querySelectorAll('#myTabContent .tab-pane');

    function showStep(index) {
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

        currentStepIndex = index;

        if (currentStepIndex === tabButtons.length - 1) {
            btnNextStep.style.display = 'none';
            btnSave.style.display = 'inline-block';
        } else {
            btnNextStep.style.display = 'inline-block';
            btnSave.style.display = 'none';
        }
    }

    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            showStep(index);
        });
    });

    btnNextStep.addEventListener('click', () => {
        if (currentStepIndex < tabButtons.length - 1) {
            showStep(currentStepIndex + 1);
        }
    });

    showStep(0);

    // --- API Calls ---

    // Helper function for API requests without authentication
    async function makeApiRequest(url, method = 'GET', data = null, isFileUpload = false) {
        const options = { method };

        if (method === 'GET' || method === 'HEAD') {
            const params = new URLSearchParams({ proveedor_id: selectedProviderId });
            if (data) {
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        params.append(key, data[key]);
                    }
                }
            }
            const urlObj = new URL(url, window.location.origin);
            urlObj.search = params.toString();
            url = urlObj.toString();
        } else {
            const body = new FormData();
            body.append('proveedor_id', selectedProviderId);

            if (data) {
                if (isFileUpload) {
                    for (const pair of data.entries()) {
                        body.append(pair[0], pair[1]);
                    }
                } else {
                    for (const key in data) {
                        if (data.hasOwnProperty(key)) {
                            body.append(key, data[key]);
                        }
                    }
                }
            }
            options.body = body;
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', response.status, errorData);
                throw new Error(`API request failed with status ${response.status}`);
            }

            if (response.status === 204) {
                return null;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            }
            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }


    // --- Load Data ---
    async function loadProveedorData() {
        const apiUrl = `/administracion/api/proveedores/${selectedProviderId}/`; // Update API URL

        try {
            const data = await makeApiRequest(apiUrl, 'GET');

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

                 // Store initial values for later comparison/validation
                 initialData = {};
                 for (const key in data) {
                     if (data[key] !== null && data[key] !== undefined) {
                         initialData[key] = data[key];
                     }
                 }
                 Object.keys(fileInputIdToModelFieldName).forEach(inputId => {
                     initialData[inputId] = data[fileInputIdToModelFieldName[inputId]] || '';
                 });
                 certificacionSwitches.forEach(sw => {
                     initialData[sw.name] = data[sw.name] || 'N';
                 });
                 if (data.cod_pais) { codPais = data.cod_pais; }

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
            const ivaData = await makeApiRequest(ivaApiUrl, 'GET');
            condicionIvaSelect.innerHTML = '<option value="">Seleccione...</option>';
            if (ivaData) {
                ivaData.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id_categoria_iva; // Use ID from Administración API
                    option.textContent = item.desc_categoria_iva;
                    condicionIvaSelect.appendChild(option);
                });
                // Set selected value if available in proveedorData
                if (proveedorData && proveedorData.id_categoria_iva_cond_iva) {
                    condicionIvaSelect.value = proveedorData.id_categoria_iva_cond_iva;
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
            const iibbData = await makeApiRequest(iibbApiUrl, 'GET');
            ingresosBrutosSelect.innerHTML = '<option value="">Seleccione...</option>';
            if (iibbData) {
                iibbData.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.Cod_Ingresos_brutos; // Codes from Administración API
                    option.textContent = item.Desc_Ingresos_brutos;
                    ingresosBrutosSelect.appendChild(option);
                });
                // Set selected value if available in proveedorData
                if (proveedorData && proveedorData.tipo) {
                    ingresosBrutosSelect.value = proveedorData.tipo;
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
            const data = await makeApiRequest(apiUrl, 'GET');

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
    proveedorForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        let finalValidationValid = true;
        let finalValidationMessages = [];
        let firstErrorStepIndex = -1;

        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
        document.querySelectorAll('.document-card').forEach(card => card.classList.remove('border', 'border-danger'));

        camposContactoObligatorios.forEach(campoKey => {
            const input = document.getElementById(campoKey);
            if (input && input.value.trim() === "") {
                finalValidationValid = false;
                const labelText = input.previousElementSibling?.textContent.replace('*', '').trim() || campoKey;
                finalValidationMessages.push(`El campo "${labelText}" es obligatorio.`);
                input.classList.add('is-invalid');
                const feedbackEl = document.getElementById(`${campoKey}-invalid`) || input.nextElementSibling;
                if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) feedbackEl.textContent = `Este campo es obligatorio.`;
                const stepIndex = steps.findIndex(step => document.getElementById(step.panelId).contains(input));
                if (firstErrorStepIndex === -1 && stepIndex !== -1) { firstErrorStepIndex = stepIndex; }
            } else if (input) {
                input.classList.remove('is-invalid');
                const feedbackEl = document.getElementById(`${campoKey}-invalid`) || input.nextElementSibling;
                if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) feedbackEl.textContent = "";
            }
        });

        const cuitInputHTML = document.getElementById('n_cuit');
        if (cuitInputHTML && cuitInputHTML.value.trim() !== "") {
            const cuitPattern = /^\d{2}-\d{8}-\d{1}$/;
            const feedbackEl = document.getElementById('n_cuit-invalid');
            if (!cuitPattern.test(cuitInputHTML.value.trim())) {
                finalValidationValid = false;
                finalValidationMessages.push('El CUIT debe tener el formato XX-XXXXXXXX-X.');
                cuitInputHTML.classList.add('is-invalid');
                if (feedbackEl) feedbackEl.textContent = 'Formato inválido. Ejemplo: 20-31441849-3';
                const stepIndex = steps.findIndex(step => document.getElementById(step.panelId).contains(cuitInputHTML));
                if (firstErrorStepIndex === -1 && stepIndex !== -1) { firstErrorStepIndex = stepIndex; }
            } else {
                cuitInputHTML.classList.remove('is-invalid');
                if (feedbackEl) feedbackEl.textContent = "";
            }
        }

        const requiredDocumentIds = getDynamicRequiredDocumentIds();
        requiredDocumentIds.forEach(fileInputId => {
            const fileInput = document.getElementById(fileInputId);
            const documentCard = document.getElementById(`card-${fileInputId}`);
            const documentTitleElement = documentCard ? documentCard.querySelector('.document-title') : null;
            const documentName = documentTitleElement ? documentTitleElement.textContent.replace('*','').trim() : `Documento ${fileInputId}`;

            const nuevoArchivoSeleccionado = fileInput && fileInput.files && fileInput.files.length > 0;
            const yaCargadoPreviamente = initialData[fileInputId] && initialData[fileInputId] !== '';

            if (!nuevoArchivoSeleccionado && !yaCargadoPreviamente) {
                finalValidationValid = false;
                finalValidationMessages.push(`El documento "${documentName}" es requerido.`);
                if (documentCard) { documentCard.classList.add('border', 'border-danger'); }
                const stepIndex = steps.findIndex(step => document.getElementById(step.panelId).contains(documentCard));
                if (firstErrorStepIndex === -1 && stepIndex !== -1) { firstErrorStepIndex = stepIndex; }
            } else if (documentCard) {
                documentCard.classList.remove('border', 'border-danger');
            }
        });

        const msgDiv = document.getElementById('formMsg');
        if (!finalValidationValid) {
            msgDiv.innerHTML = 'Errores encontrados:<br>' + finalValidationMessages.join('<br>');
            msgDiv.className = 'alert alert-danger mt-0 mb-3';
            msgDiv.classList.remove('d-none');
            if (firstErrorStepIndex !== -1) { showStep(firstErrorStepIndex); }
            return;
        } else {
            msgDiv.classList.add('d-none');
            msgDiv.textContent = '';
        }

        const formDataToSave = gatherFormDataFromAllTabs();
        const method = proveedorId ? 'PATCH' : 'POST';
        let url = proveedorId ? `/administracion/api/proveedores/${proveedorId}/` : `/administracion/api/proveedores/`;
        if (method === 'POST') {
            if (userId) formDataToSave.append('user', userId);
            if (codPais) formDataToSave.append('cod_pais', codPais);
        }

        msgDiv.textContent = 'Guardando datos...';
        msgDiv.className = 'alert alert-info mt-0 mb-3';
        msgDiv.classList.remove('d-none');
        document.querySelector('.btn-save').disabled = true;

        try {
            const resp = await fetch(url, {
                method: method,
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                body: formDataToSave
            });

            if (resp.ok) {
                const responseData = await resp.json();
                if (method === 'POST' && responseData.id) {
                    proveedorId = responseData.id;
                    if (responseData.cod_cpa01) { codCpa01Value = responseData.cod_cpa01; camposBloquear.forEach(keyToBlock => { const inputToBlock = document.getElementById(keyToBlock); if (inputToBlock && codCpa01Value && codCpa01Value.trim() !== "") { inputToBlock.disabled = true; }}); }
                    if (responseData.cod_pais) { codPais = responseData.cod_pais; }
                }
                for (const [key, value] of formDataToSave.entries()) {
                    if (value instanceof File) continue;
                    const certSwitchConfig = certificacionSwitches.find(s => s.name === key);
                    if (certSwitchConfig) {
                        initialData[key] = String(value);
                    } else if (key === 'id_categoria_iva_cond_iva') {
                        initialData['condicionIva'] = String(value);
                    } else if (key === 'tipo') {
                        initialData['ingresosBrutos'] = String(value);
                    } else if (key === 'id_cpa57') {
                        initialData['id_cpa57'] = String(value);
                    } else if (key === 'nom_prov') {
                        initialData['nom_prov'] = String(value);
                    } else if (initialData.hasOwnProperty(key)) {
                        initialData[key] = value === null ? '' : String(value);
                    }
                }
                initialData[document.getElementById('provincia').name || document.getElementById('provincia').id] = formDataToSave.get('nom_prov') || '';
                const fileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
                fileInputs.forEach(input => {
                    if (input.id) {
                        const modelFieldName = fileInputIdToModelFieldName[input.id];
                        const docUrlFromServer = responseData[modelFieldName] || null;
                        const docNameFromServer = docUrlFromServer ? docUrlFromServer.split('/').pop() : null;
                        initialData[input.id] = docUrlFromServer || '';
                        actualizarUICardDocumento(input.id, docNameFromServer, docUrlFromServer, getDynamicRequiredDocumentIds().includes(input.id));
                    }
                });
                msgDiv.textContent = 'Datos guardados correctamente.';
                msgDiv.className = 'alert alert-success mt-0 mb-3';
            } else {
                const errorData = await resp.json();
                msgDiv.textContent = 'Error al guardar: ' + (errorData.detail || resp.statusText);
                msgDiv.className = 'alert alert-danger mt-0 mb-3';
            }
        } catch (error) {
            msgDiv.textContent = 'Error de red o problema al procesar la solicitud de guardado.';
            msgDiv.className = 'alert alert-danger mt-0 mb-3';
            msgDiv.classList.remove('d-none');
        } finally {
            document.querySelector('.btn-save').disabled = false;
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
            const data = await makeApiRequest(apiUrl, 'GET');

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
        try {
            const data = await makeApiRequest(apiUrl, method, formData);

            if (data) {
                displayMessage(mensajesStatus, `Contacto ${contactoId ? 'actualizado' : 'agregado'} correctamente.`, 'success');
                contactoModal.hide();
                loadContactos(); // Reload contacts list
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            displayMessage(contactoFormMsg, 'Error al guardar contacto.', 'danger');
        }
    });

    // --- Document Upload/View ---
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
            document.getElementById(fileInputId).click();
        } else if (statusText.includes('Cargado') || button.textContent.includes('Ver')) {
            const fileUrl = initialData[fileInputId] || '';
            if (fileUrl) {
                viewDocument(fileUrl, fileInputId);
            }
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
            const data = await makeApiRequest(apiUrl, 'PATCH', formData, true); // Use PATCH for partial update, indicate file upload

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
