// --- START OF FILE mis_datos.js (for Administracion App) ---

let documentosRequeridosFijos = ['cuitFile', 'ingBrutosFile'];
let documentosCondicionalesMap = {
    'certExclGanancias': 'exclGananciasFile',
    'certExclIIBB': 'exclIIBBFile',
    'certNoRetGanancias': 'noRetGananciasFile',
    'certNoRetIIBB': 'noRetIIBBFile'
};

// Mapeo de IDs de input de archivo a nombres de campo en el modelo Django
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

// This list is used for the FINAL validation on save
const camposContactoObligatorios = ["nom_provee", "n_cuit", "telefono_1", "e_mail", "domicilio", "cbu"];

// Nuevos campos de switches para certificaciones
const certificacionSwitches = [
    { id: 'certExclGanancias', name: 'excl_ganancias_file', documentId: 'exclGananciasFile' },
    { id: 'certExclIIBB', name: 'excl_iibb_file', documentId: 'exclIIBBFile' },
    { id: 'certNoRetGanancias', name: 'no_ret_ganancias_file', documentId: 'noRetGananciasFile' },
    { id: 'certNoRetIIBB', name: 'no_ret_iibb_file', documentId: 'noRetIIBBFile' }
];


function getDynamicRequiredDocumentIds() {
    let dynamicRequired = [...documentosRequeridosFijos];
    certificacionSwitches.forEach(s => {
        const switchElement = document.getElementById(s.id);
        if (switchElement && switchElement.checked) {
            dynamicRequired.push(s.documentId);
        }
    });
    return dynamicRequired;
}

// Helper para actualizar UI de tarjeta de documento
function actualizarUICardDocumento(fileInputId, fileName, fileUrl, esRequerido) {
    const input = document.getElementById(fileInputId);
    if (!input) { /* console.warn(`Input ${fileInputId} no encontrado para UI update`);*/ return; }
    const cardBody = input.closest('.document-card-body');
    if (!cardBody) { /* console.warn(`Card body para ${fileInputId} no encontrado`);*/ return; }

    const statusTextElement = cardBody.querySelector('.document-status-text');
    const actionButton = cardBody.querySelector('.action-btn');
    const documentCard = input.closest('.document-card');
    const statusIconArea = cardBody.querySelector('.document-icon-area');
    const requiredAsterisk = documentCard.querySelector('.required-asterisk');

    if(!statusTextElement || !actionButton || !documentCard || !statusIconArea || !requiredAsterisk) {
        // console.warn(`Uno o más elementos UI no encontrados para la tarjeta ${fileInputId}`);
        return;
    }

    // Limpiar clases de estado previas
    documentCard.classList.remove('status-required-missing', 'status-optional-missing', 'status-present', 'border', 'border-danger'); // Also remove validation border
    actionButton.classList.remove('btn-primary', 'btn-outline-primary', 'btn-outline-secondary');

    // Actualizar el data-file-input-id en el botón de acción
    actionButton.setAttribute('data-file-input-id', fileInputId);


    if (esRequerido) {
        requiredAsterisk.classList.remove('d-none');
        if (fileName) {
            // Requerido y cargado
            statusTextElement.textContent = 'Archivo cargado: ' + fileName;
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill me-1" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg> Ver Documento`;
            actionButton.onclick = () => viewDocument(fileUrl, fileInputId);
            actionButton.classList.add('btn-outline-secondary');
            documentCard.classList.add('status-present');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check-circle-fill status-icon" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`;
        } else {
            // Requerido y pendiente
            statusTextElement.textContent = 'Pendiente de carga';
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload me-1" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/></svg> Cargar Archivo`;
            actionButton.onclick = () => triggerUpload(fileInputId);
            actionButton.classList.add('btn-primary');
            documentCard.classList.add('status-required-missing');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill status-icon" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/></svg>`;
        }
    } else {
        // Opcional
        requiredAsterisk.classList.add('d-none');
        if (fileName) {
            // Opcional y cargado
            statusTextElement.textContent = 'Archivo cargado: ' + fileName;
            actionButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill me-1" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg> Ver Documento`;
            actionButton.onclick = () => viewDocument(fileUrl, fileInputId);
            actionButton.classList.add('btn-outline-secondary');
            documentCard.classList.add('status-present');
            statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check-circle-fill status-icon" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`;
        } else {
            // Opcional y no cargado
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
    // Only include data from the main forms, not the contact modal form
    const formsToProcess = ['#proveedorForm', '#configForm'];

    formsToProcess.forEach(formSelector => {
        const formElements = document.querySelectorAll(`${formSelector} input:not([type="file"]), ${formSelector} select, ${formSelector} textarea`);
        formElements.forEach(el => {
            if ((el.name || el.id) && !el.disabled) {
                const key = el.name || el.id;
                // Handle all checkboxes, including new certification switches
                const certSwitch = certificacionSwitches.find(s => s.id === key);
                if (el.type === 'checkbox' && certSwitch) {
                     // For certification switches, use the model field name (s.name) for the form data key
                     formData.append(certSwitch.name, el.checked ? 'S' : 'N');
                } else if (el.type === 'checkbox') {
                    formData.append(key, el.checked ? 'S' : 'N');
                } else if (el.type === 'radio') {
                    if (el.checked) { formData.append(key, el.value.trim()); }
                } else {
                    formData.append(key, el.value.trim());
                }
            }
        });
    });
    // Handle specific fields that might not be directly in a form or have special names
    if (formData.has('provincia_display')) { formData.delete('provincia_display'); } // Remove display field
    const idCpa57Val = document.getElementById('id_cpa57').value;
    const nomProvVal = document.getElementById('nom_prov').value;
    formData.set('id_cpa57', idCpa57Val || '');
    formData.set('nom_prov', nomProvVal || '');

    // Handle select values that map to different model fields
    formData.set('id_categoria_iva_cond_iva', document.getElementById('condicionIva').value || '');
    if (formData.has('condicionIva')) formData.delete('condicionIva'); // Remove the select's name if it conflicts

    formData.set('tipo', document.getElementById('ingresosBrutos').value || '');
    if (formData.has('ingresosBrutos')) formData.delete('ingresosBrutos'); // Remove the select's name if it conflicts


    // Agregar archivos al FormData usando los nombres de campo del modelo
    const fileInputsDocumentos = document.querySelectorAll('#documents-tab-pane .file-input');
    fileInputsDocumentos.forEach(input => {
        const modelFieldName = fileInputIdToModelFieldName[input.id];
        if (modelFieldName && input.files && input.files.length > 0) {
            formData.append(modelFieldName, input.files[0], input.files[0].name);
        }
    });
    return formData;
}

$(document).ready(function() {
  let proveedorId = null;
  let codCpa01Value = null;
  let initialData = {};
  let codPais = null;
  let proveedorFileStates = {}; // Variable para almacenar los estados de los archivos (URLs o null)

  // Initialize the document viewer modal instance
  const documentViewerModal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
  const documentViewerModalBody = document.getElementById('documentViewerModalBody');
  const btnReplaceDocument = document.getElementById('btnReplaceDocument');

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

  // --- Wizard Logic ---
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
      if (index < 0 || index >= steps.length) return;

      // Hide all tab panes
      tabPanes.forEach(pane => pane.classList.remove('show', 'active'));

      // Deactivate all tab buttons
      tabButtons.forEach((button) => {
          button.classList.remove('active');
      });

      // Show the current step's pane and activate its button
      const currentStep = steps[index];
      const currentPane = document.getElementById(currentStep.panelId);
      const currentButton = document.getElementById(currentStep.buttonId);

      if (currentPane && currentButton) {
          currentPane.classList.add('show', 'active');
          currentButton.classList.add('active');

          // Update button visibility
          if (index === steps.length - 1) {
              btnNextStep.style.display = 'none';
              btnSave.style.display = 'block'; // Show Save button on the last step
          } else {
              btnNextStep.style.display = 'block';
              btnSave.style.display = 'none'; // Hide Save button on other steps
          }

          // Specific actions for certain steps
          if (currentStep.id === 'step3') { // Messages tab
              cargarContactos(); // Load contacts when the messages tab is shown
          }
           if (currentStep.id === 'step4') { // Documents tab
               // Re-evaluate document card UI state when entering the documents tab
               const allFileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
               const requiredDocumentIds = getDynamicRequiredDocumentIds();
               allFileInputs.forEach(input => {
                   if (input.id) {
                       const modelFieldName = fileInputIdToModelFieldName[input.id];
                       const fileUrl = proveedorFileStates[modelFieldName];
                       const fileName = fileUrl ? fileUrl.split('/').pop() : (input.files && input.files.length > 0 ? input.files[0].name : null); // Prefer local file name if selected

                       const esRequerido = requiredDocumentIds.includes(input.id);
                       actualizarUICardDocumento(input.id, fileName, fileUrl, esRequerido);
                   }
               });
           }


          currentStepIndex = index;
          monitorChanges(); // Re-evaluate save button state based on new step
      }
  }

  function validateStep(index) {
      const currentStep = steps[index];
      const currentPane = document.getElementById(currentStep.panelId);
      if (!currentPane) return false;

      let isValid = true;
      const requiredInputs = currentPane.querySelectorAll('[required]');
      const formMsgDiv = document.getElementById('formMsg');
      let stepErrorMessages = [];

      // Clear previous validation feedback for this step
      currentPane.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      currentPane.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
      currentPane.querySelectorAll('.document-card').forEach(card => card.classList.remove('border', 'border-danger')); // Clear document card errors

      // Validate required inputs using HTML5 validation API
      requiredInputs.forEach(input => {
          if (!input.checkValidity()) {
              isValid = false;
              input.classList.add('is-invalid');
              const feedbackEl = input.nextElementSibling; // Assuming invalid-feedback is next sibling
              if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                  feedbackEl.textContent = input.validationMessage || 'Este campo es obligatorio.';
              }
              const labelText = input.previousElementSibling?.textContent.replace('*', '').trim() || input.name || input.id;
              stepErrorMessages.push(`"${labelText}" es obligatorio.`);
          } else {
              input.classList.remove('is-invalid');
              const feedbackEl = input.nextElementSibling;
              if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                  feedbackEl.textContent = '';
              }
          }
      });

      // Specific CUIT format validation for step 1
      if (currentStep.id === 'step1') {
          const cuitInput = document.getElementById('n_cuit');
          if (cuitInput && cuitInput.value.trim() !== "") {
              const cuitPattern = /^\d{2}-\d{8}-\d{1}$/;
              const feedbackEl = document.getElementById('n_cuit-invalid');
              if (!cuitPattern.test(cuitInput.value.trim())) {
                  isValid = false;
                  cuitInput.classList.add('is-invalid');
                  if (feedbackEl) feedbackEl.textContent = 'Formato inválido. Ejemplo: 20-31441849-3';
                  stepErrorMessages.push('El CUIT debe tener el formato XX-XXXXXXXX-X.');
              } else {
                  cuitInput.classList.remove('is-invalid');
                  if (feedbackEl) feedbackEl.textContent = "";
              }
          }
      }

      // Validate required documents for the documents step (step 4)
      if (currentStep.id === 'step4') {
          const requiredDocumentIds = getDynamicRequiredDocumentIds();
          requiredDocumentIds.forEach(fileInputId => {
              const fileInput = document.getElementById(fileInputId);
              const modelFieldName = fileInputIdToModelFieldName[fileInputId];
              const documentCard = document.getElementById(`card-${fileInputId}`);
              const documentTitleElement = documentCard ? documentCard.querySelector('.document-title') : null;
              const documentName = documentTitleElement ? documentTitleElement.textContent.replace('*','').trim() : `Documento ${fileInputId}`;

              const nuevoArchivoSeleccionado = fileInput && fileInput.files && fileInput.files.length > 0;
              const yaCargadoPreviamente = proveedorFileStates[modelFieldName];

              if (!nuevoArchivoSeleccionado && !yaCargadoPreviamente) {
                  isValid = false;
                  stepErrorMessages.push(`El documento "${documentName}" es requerido.`);
                  if (documentCard) { documentCard.classList.add('border', 'border-danger'); }
              } else if (documentCard) {
                  documentCard.classList.remove('border', 'border-danger');
              }
          });
      }

      if (!isValid) {
          formMsgDiv.innerHTML = 'Errores en este paso:<br>' + stepErrorMessages.join('<br>');
          formMsgDiv.className = 'alert alert-danger mt-0 mb-3';
          formMsgDiv.classList.remove('d-none');
      } else {
          formMsgDiv.classList.add('d-none');
          formMsgDiv.textContent = '';
      }

      return isValid;
  }

  // Event listener for the Next button
  btnNextStep.addEventListener('click', function() {
      if (validateStep(currentStepIndex)) {
          showStep(currentStepIndex + 1);
      }
  });

  // Event listeners for tab buttons
  tabButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          showStep(index);
      });
  });

  /**
   * Obtiene el ID del proveedor desde localStorage.
   * Este ID es guardado por dashboard.js al seleccionar un proveedor.
   */
  function getProveedorId() {
    const selectedId = localStorage.getItem('selectedProviderId');
    if (selectedId) {
        console.log('Proveedor ID obtenido de localStorage:', selectedId);
        return selectedId;
    }
    console.error('No se pudo encontrar el ID del proveedor en localStorage.');
    // Redirigir si no hay ID, ya que la página no puede funcionar
    alert('No se ha seleccionado un proveedor. Volviendo al listado.');
    window.location.href = '../dashboard/'; // Ajusta esta ruta si es necesario
    return null;
  }

  async function cargarDatos() {
    proveedorId = getProveedorId();
    const msgDivCarga = $('#formMsg');

    if (!proveedorId) {
      return; // La redirección ya se manejó en getProveedorId
    }
    msgDivCarga.addClass('d-none').removeClass('alert-danger alert-info');

    let proveedor = {};
    try {
      // CORRECCIÓN: Usar URL en minúsculas
      const resp = await fetch(`/administracion/api/proveedores/${proveedorId}/`);
      if (!resp.ok) {
        throw new Error(`Error al cargar datos del proveedor (${resp.status})`);
      } 
      
      proveedor = await resp.json();
      codCpa01Value = proveedor.cod_cpa01;
      codPais = proveedor.cod_pais;
      console.log('Datos del proveedor cargados:', proveedor);

      // Actualizar el título de la página con el nombre del proveedor
      const pageTitle = document.querySelector('h2.text-center');
      if (pageTitle && pageTitle.querySelector('span')) {
          pageTitle.querySelector('span').textContent = proveedor.nom_provee || 'N/A';
      }

      // Cargar datos en los formularios principales
      camposPrincipalesEditables.forEach(campo => {
            const inputElement = document.getElementById(campo.key);
            if (inputElement) {
              const value = proveedor[campo.key];
              inputElement.value = (value !== null && value !== undefined) ? value : '';
              if (codCpa01Value && codCpa01Value.trim() !== "" && camposBloquear.includes(campo.key)) {
                  inputElement.disabled = true;
              }
            }
          });
          
      const allFormInputs = document.querySelectorAll('#proveedorForm input, #proveedorForm select, #proveedorForm textarea, #configForm input, #configForm select, #configForm textarea');
      allFormInputs.forEach(input => {
        const key = input.name || input.id;
        const certSwitch = certificacionSwitches.find(s => s.id === key);
        const modelKey = certSwitch ? certSwitch.name : key;

        if (proveedor.hasOwnProperty(modelKey)) {
            const value = proveedor[modelKey];
            if (input.type === 'checkbox' || input.type === 'switch') {
                 input.checked = (value === 'S' || value === true);
            } else {
                 input.value = (value !== null && value !== undefined) ? value : '';
            }
        }
      });


      const provinciaDisplayInput = document.getElementById('provincia');
      const idCpa57Input = document.getElementById('id_cpa57');
      const nomProvInput = document.getElementById('nom_prov');
      provinciaDisplayInput.value = proveedor.nom_prov || '';
      idCpa57Input.value = proveedor.id_cpa57 || '';
      nomProvInput.value = proveedor.nom_prov || '';

      // if (codPais) { await cambiarConexion(codPais); } // COMENTADO: API no existe en Administracion

      await cargarCondicionIva(proveedor.id_categoria_iva_cond_iva);
      await cargarIngresosBrutos(proveedor.tipo);

      // --- Lógica para inicializar estados de archivos y checkboxes ---
      proveedorFileStates = {};
      const allFileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
      allFileInputs.forEach(input => {
          const modelFieldName = fileInputIdToModelFieldName[input.id];
          if (modelFieldName && proveedor.hasOwnProperty(modelFieldName)) {
              proveedorFileStates[modelFieldName] = proveedor[modelFieldName] || null;
          } else {
               proveedorFileStates[modelFieldName] = null;
          }
      });
      console.log('Proveedor file states initialized from API:', proveedorFileStates);
      
      // Re-sync certification switches based on loaded file states
      certificacionSwitches.forEach(s => {
          const switchElement = document.getElementById(s.id);
          const fileFieldName = s.name;
          if (switchElement && proveedorFileStates.hasOwnProperty(fileFieldName)) {
              switchElement.checked = !!proveedorFileStates[fileFieldName];
          }
      });

      // Capturar estado inicial para monitorChanges
      initialData = {};
      const initialFormData = gatherFormDataFromAllTabs();
      for (const [key, value] of initialFormData.entries()) {
          if (!(value instanceof File)) {
              initialData[key] = value;
          }
      }
      Object.keys(proveedorFileStates).forEach(key => {
          initialData[key] = proveedorFileStates[key];
      });

      agregarValidacionCuitFrontend();
      monitorChanges();
      addCertificationSwitchListeners();
      showStep(0);

    } catch (error) {
      console.error('Error al procesar los datos del proveedor:', error);
      msgDivCarga.text('Ocurrió un error al cargar la información. Intente recargar.')
                 .removeClass('d-none').addClass('alert-danger');
    }
  }

  async function cargarCondicionIva(selectedId) {
    const select = document.getElementById('condicionIva');
    select.innerHTML = '<option value="">Seleccione...</option>';
    try {
      // CORRECCIÓN: Usar URL en minúsculas
      const resp = await fetch('/administracion/api/categorias-iva/');
      if (resp.ok) {
        const categorias = await resp.json();
        categorias.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id_categoria_iva;
          option.textContent = cat.desc_categoria_iva;
          select.appendChild(option);
        });
        if (selectedId) select.value = selectedId;
      }
    } catch (error) {
      console.error("Network error cargando Condicion IVA:", error);
    }
  }

  async function cargarIngresosBrutos(selectedTipo) {
    const select = document.getElementById('ingresosBrutos');
    select.innerHTML = '<option value="">Seleccione...</option>';
     try {
      // CORRECCIÓN: Usar URL en minúsculas
      const resp = await fetch('/administracion/api/ingresos-brutos/');
      if (resp.ok) {
        const ingresosBrutos = await resp.json();
        ingresosBrutos.forEach(ib => {
          const option = document.createElement('option');
          option.value = ib.Cod_Ingresos_brutos;
          option.textContent = ib.Desc_Ingresos_brutos;
          select.appendChild(option);
        });
        if (selectedTipo) select.value = selectedTipo;
      }
    } catch (error) {
      console.error("Network error cargando Ingresos Brutos:", error);
    }
  }

  function monitorChanges() {
    const inputs = document.querySelectorAll('#proveedorForm input, #proveedorForm select, #proveedorForm textarea, #configForm input, #configForm select, #configForm textarea, #documents-tab-pane .file-input');
    const saveButton = document.querySelector('.btn-save');
    const checkChanges = () => {
      let hasChanges = false;
      const currentFormData = gatherFormDataFromAllTabs();
      for (const [key, value] of currentFormData.entries()) {
          if (value instanceof File) {
              if (value.size > 0) hasChanges = true;
              break;
          }
          if (initialData[key] !== value) {
              hasChanges = true;
              break;
          }
      }
      if (!hasChanges) {
          const allFileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
          for (const input of allFileInputs) {
              const modelFieldName = fileInputIdToModelFieldName[input.id];
              if (initialData[modelFieldName] !== proveedorFileStates[modelFieldName]) {
                  hasChanges = true;
                  break;
              }
          }
      }

      saveButton.style.display = (currentStepIndex === steps.length - 1 && hasChanges) ? 'block' : 'none';
      btnNextStep.style.display = (currentStepIndex < steps.length - 1) ? 'block' : 'none';
    };

    inputs.forEach(input => {
      input.addEventListener('change', checkChanges);
      if (input.type !== 'file' && input.tagName.toLowerCase() !== 'select' && input.type !== 'checkbox') {
        input.addEventListener('input', checkChanges);
      }
    });
  }

  function addCertificationSwitchListeners() {
      const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
      const confirmationModalBody = document.getElementById('confirmationModalBody');
      const btnConfirmUpload = document.getElementById('btnConfirmUpload');

      certificacionSwitches.forEach(s => {
          const switchElement = document.getElementById(s.id);
          if (switchElement) {
              switchElement.addEventListener('change', function() {
                  const fileInputId = s.documentId;
                  const modelFieldName = fileInputIdToModelFieldName[fileInputId];
                  const fileIsPresent = !!proveedorFileStates[modelFieldName] || document.getElementById(fileInputId).files.length > 0;
                  
                  const esRequeridoAhora = this.checked;
                  const fileUrl = proveedorFileStates[modelFieldName];
                  const fileName = fileUrl ? fileUrl.split('/').pop() : null;
                  actualizarUICardDocumento(fileInputId, fileName, fileUrl, esRequeridoAhora);

                  if (this.checked && !fileIsPresent) {
                      const documentTitle = this.closest('.document-card-body').querySelector('.document-title').textContent.replace('*','').trim();
                      confirmationModalBody.textContent = `Ha activado la certificación "${documentTitle}". ¿Desea cargar el documento ahora?`;
                      let confirmed = false;
                      const handleConfirm = () => { confirmed = true; triggerUpload(fileInputId); confirmationModal.hide(); };
                      btnConfirmUpload.onclick = handleConfirm;
                      const handleHide = () => { 
                          if (!confirmed) { 
                              this.checked = false; 
                              actualizarUICardDocumento(fileInputId, fileName, fileUrl, false); 
                          } 
                          confirmationModal._element.removeEventListener('hidden.bs.modal', handleHide); 
                      };
                      confirmationModal._element.addEventListener('hidden.bs.modal', handleHide, { once: true });
                      confirmationModal.show();
                  }
              });
          }
      });
  }

  document.getElementById('proveedorForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let finalValidationValid = true;
    let firstErrorStepIndex = -1;

    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.document-card').forEach(card => card.classList.remove('border-danger'));
    
    for (let i = 0; i < steps.length; i++) {
        if (!validateStep(i)) {
            finalValidationValid = false;
            if(firstErrorStepIndex === -1) firstErrorStepIndex = i;
        }
    }
    
    const msgDiv = document.getElementById('formMsg');
    if (!finalValidationValid) {
        msgDiv.innerHTML = 'Se encontraron errores. Por favor, revise todos los campos marcados en las pestañas.';
        msgDiv.className = 'alert alert-danger mt-0 mb-3';
        msgDiv.classList.remove('d-none');
        showStep(firstErrorStepIndex);
        return;
    } else {
        msgDiv.classList.add('d-none');
    }
    
    const formDataToSave = gatherFormDataFromAllTabs();
    // CORRECCIÓN: Usar URL en minúsculas
    const url = `/administracion/api/proveedores/${proveedorId}/`;

    msgDiv.textContent = 'Guardando datos...';
    msgDiv.className = 'alert alert-info mt-0 mb-3';
    msgDiv.classList.remove('d-none');
    document.querySelector('.btn-save').disabled = true;

    try {
      const resp = await fetch(url, {
          method: 'PATCH',
          headers: { 'X-CSRFToken': getCookie('csrftoken') },
          body: formDataToSave
      });
      if (!resp.ok) {
          const errorData = await resp.json();
          const errorMessages = Object.entries(errorData).map(([key, value]) => `<li>${key}: ${value}</li>`).join('');
          throw new Error(`<ul>${errorMessages}</ul>` || 'Error al guardar');
      }

      const responseData = await resp.json();
      
      // Actualizar estado inicial con los nuevos datos guardados
      const newInitialFormData = gatherFormDataFromAllTabs();
      initialData = {};
       for (const [key, value] of newInitialFormData.entries()) {
          if (!(value instanceof File)) {
              initialData[key] = value;
          }
      }
      Object.keys(fileInputIdToModelFieldName).forEach(inputId => {
          const modelFieldName = fileInputIdToModelFieldName[inputId];
          proveedorFileStates[modelFieldName] = responseData[modelFieldName] || null;
          initialData[modelFieldName] = proveedorFileStates[modelFieldName];
      });
      
      msgDiv.textContent = 'Datos actualizados correctamente.';
      msgDiv.className = 'alert alert-success mt-0 mb-3';
      monitorChanges();
    } catch (error) {
      msgDiv.innerHTML = `Error al guardar: <br>${error.message}`;
      msgDiv.className = 'alert alert-danger mt-0 mb-3';
    } finally {
      document.querySelector('.btn-save').disabled = false;
    }
  });

  function agregarValidacionCuitFrontend() {
    const cuitInput = document.getElementById('n_cuit');
    if (cuitInput) {
      cuitInput.addEventListener('input', function() {
        const isValid = /^\d{2}-\d{8}-\d{1}$/.test(this.value.trim());
        this.classList.toggle('is-invalid', this.value.trim() !== "" && !isValid);
        const feedbackEl = document.getElementById('n_cuit-invalid');
        if (feedbackEl) feedbackEl.textContent = this.classList.contains('is-invalid') ? 'Formato inválido. Ejemplo: 20-31441849-3' : '';
      });
    }
  }

  function getCookie(name) {
      let cookieValue = null; if (document.cookie && document.cookie !== '') { const cookies = document.cookie.split(';'); for (let i = 0; i < cookies.length; i++) { const cookie = cookies[i].trim(); if (cookie.substring(0, name.length + 1) === (name + '=')) { cookieValue = decodeURIComponent(cookie.substring(name.length + 1)); break; }}} return cookieValue;
  }
  
  document.getElementById('provincia').addEventListener('input', async function() {
    const query = this.value;
    const provinciaListDiv = document.getElementById('provinciaList');
    if (query.length < 2) { provinciaListDiv.innerHTML = ''; return; }
    const paisParaQuery = codPais || 'AR';
    try {
      // CORRECCIÓN: Usar URL en minúsculas
      const resp = await fetch(`/administracion/api/provincias/?q=${encodeURIComponent(query)}&cod_pais=${paisParaQuery}`);
      if (!resp.ok) throw new Error('Error buscando provincias');
      const provincias = await resp.json();
      provinciaListDiv.innerHTML = provincias.map(p => `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}" data-nom="${p.display}">${p.display}</button>`).join('');
    } catch (error) {
      console.error(error);
      provinciaListDiv.innerHTML = '<div class="list-group-item text-danger">Error al buscar</div>';
    }
  });

  document.getElementById('provinciaList').addEventListener('click', function(e) {
    if (e.target && e.target.matches('button.list-group-item')) {
      const provinciaInput = document.getElementById('provincia');
      provinciaInput.value = e.target.textContent;
      document.getElementById('id_cpa57').value = e.target.getAttribute('data-id');
      document.getElementById('nom_prov').value = e.target.getAttribute('data-nom');
      provinciaListDiv.innerHTML = '';
      $(provinciaInput).trigger('change');
    }
  });

  document.querySelectorAll('.file-input').forEach(input => {
    input.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert(`El archivo "${file.name}" es demasiado grande (máx. 5MB).`);
              this.value = '';
          } else {
              const fileInputId = this.id;
              const esRequerido = getDynamicRequiredDocumentIds().includes(fileInputId);
              actualizarUICardDocumento(fileInputId, file.name, null, esRequerido);
          }
      }
    });
  });

  const contactoModal = new bootstrap.Modal(document.getElementById('contactoModal'));
  const contactoForm = document.getElementById('contactoForm');
  const mensajesStatusDiv = document.getElementById('mensajesStatus');
  const contactoFormMsgDiv = document.getElementById('contactoFormMsg');

  $('#btnNuevoContacto').on('click', function() {
    contactoForm.reset();
    $('#contactoId').val('');
    $('#contactoModalLabel').text('Agregar Nuevo Contacto');
    contactoForm.classList.remove('was-validated');
    contactoFormMsgDiv.classList.add('d-none');
    contactoModal.show();
  });

  async function cargarContactos() {
    if (!proveedorId) return;
    const tablaBody = $('#tablaContactosBody');
    tablaBody.html('<tr><td colspan="8" class="text-center">Cargando contactos...</td></tr>');
    try {
      // CORRECCIÓN: Usar URL en minúsculas
      const resp = await fetch(`/administracion/api/contactos/?proveedor_id=${proveedorId}`);
      if (!resp.ok) throw new Error(`Error HTTP ${resp.status}`);
      const contactos = await resp.json();
      renderContactos(contactos);
    } catch (error) {
      tablaBody.html(`<tr><td colspan="8" class="text-center text-danger">Error al cargar contactos</td></tr>`);
    }
  }

  function renderContactos(contactos) {
    const tablaBody = $('#tablaContactosBody');
    tablaBody.empty();
    if (contactos.length === 0) {
      tablaBody.html('<tr><td colspan="8" class="text-center">No hay contactos registrados.</td></tr>');
      return;
    }
    contactos.forEach(contacto => {
      const row = `<tr>
          <td>${escapeHtml(contacto.nombre)}</td> <td>${escapeHtml(contacto.cargo)}</td>
          <td>${escapeHtml(contacto.email)}</td> <td>${escapeHtml(contacto.telefono)}</td>
          <td class="text-center">${contacto.defecto === 'S' ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
          <td class="text-center">${contacto.envia_pdf_oc === 'S' ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
          <td class="text-center">${contacto.envia_pdf_op === 'S' ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary btn-editar-contacto" data-id="${contacto.id}">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-eliminar-contacto" data-id="${contacto.id}">Eliminar</button>
          </td></tr>`;
      tablaBody.append(row);
    });
  }

  $('#tablaContactosBody').on('click', '.btn-editar-contacto', async function() {
      const contactoId = $(this).data('id');
      // CORRECCIÓN: Usar URL en minúsculas
      const resp = await fetch(`/administracion/api/contactos/${contactoId}/`);
      const contacto = await resp.json();
      $('#contactoId').val(contacto.id);
      $('#contactoModalLabel').text('Editar Contacto');
      $('#contactoNombre').val(contacto.nombre);
      $('#contactoCargo').val(contacto.cargo);
      $('#contactoTelefono').val(contacto.telefono);
      $('#contactoMovil').val(contacto.telefono_movil);
      $('#contactoEmail').val(contacto.email);
      $('#contactoObservaciones').val(contacto.observacion);
      $('#contactoDefecto').prop('checked', contacto.defecto === 'S');
      $('#contactoEnviaPdfOc').prop('checked', contacto.envia_pdf_oc === 'S');
      $('#contactoEnviaPdfOp').prop('checked', contacto.envia_pdf_op === 'S');
      contactoModal.show();
  });

  $('#tablaContactosBody').on('click', '.btn-eliminar-contacto', async function() {
      const contactoId = $(this).data('id');
      if (confirm('¿Está seguro de eliminar este contacto?')) {
          // CORRECCIÓN: Usar URL en minúsculas
          await fetch(`/administracion/api/contactos/${contactoId}/`, { method: 'DELETE', headers: { 'X-CSRFToken': getCookie('csrftoken') } });
          cargarContactos();
      }
  });

  contactoForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!contactoForm.checkValidity()) { contactoForm.classList.add('was-validated'); return; }
    
    const contactoId = $('#contactoId').val();
    // CORRECCIÓN: Usar URL en minúsculas
    const url = contactoId ? `/administracion/api/contactos/${contactoId}/` : '/administracion/api/contactos/';
    const method = contactoId ? 'PUT' : 'POST';
    
    const data = {
        proveedor: proveedorId,
        nombre: $('#contactoNombre').val(),
        cargo: $('#contactoCargo').val(),
        telefono: $('#contactoTelefono').val(),
        telefono_movil: $('#contactoMovil').val(),
        email: $('#contactoEmail').val(),
        observacion: $('#contactoObservaciones').val(),
        defecto: $('#contactoDefecto').is(':checked') ? 'S' : 'N',
        envia_pdf_oc: $('#contactoEnviaPdfOc').is(':checked') ? 'S' : 'N',
        envia_pdf_op: $('#contactoEnviaPdfOp').is(':checked') ? 'S' : 'N'
    };
    if (contactoId) data.id = contactoId;

    try {
        const resp = await fetch(url, { 
            method, 
            body: JSON.stringify(data), 
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') } 
        });
        if (!resp.ok) throw new Error('Error al guardar contacto');
        contactoModal.hide();
        cargarContactos();
    } catch(error) {
        contactoFormMsgDiv.textContent = error.message;
        contactoFormMsgDiv.classList.remove('d-none');
    }
  });

  function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "''")
         .replace(/'/g, "'");
  }

  cargarDatos();
});

function triggerUpload(fileInputId) {
    document.getElementById(fileInputId).click();
}

function viewDocument(path, fileInputId) {
  const modal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
  const body = document.getElementById('documentViewerModalBody');
  const replaceBtn = document.getElementById('btnReplaceDocument');
  replaceBtn.setAttribute('data-file-input-id', fileInputId);

  if (path && !path.startsWith('blob:')) {
      body.innerHTML = '';
      const ext = path.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
          body.innerHTML = `<img src="${path}" class="img-fluid" style="max-height: 80vh;">`;
      } else if (ext === 'pdf') {
          body.innerHTML = `<embed src="${path}" type="application/pdf" style="width: 100%; height: 80vh;">`;
      } else {
          body.innerHTML = `<p>No se puede previsualizar este tipo de archivo.</p><a href="${path}" target="_blank" class="btn btn-primary">Descargar o ver documento</a>`;
      }
      modal.show();
  } else {
      alert('El documento aún no ha sido guardado o no es visible.');
  }
}

document.getElementById('btnReplaceDocument').addEventListener('click', function() {
    const fileInputId = this.getAttribute('data-file-input-id');
    if (fileInputId) {
        bootstrap.Modal.getInstance(document.getElementById('documentViewerModal')).hide();
        triggerUpload(fileInputId);
    }
});