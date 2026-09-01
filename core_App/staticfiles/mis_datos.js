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
    { id: 'certExclGanancias', name: 'excl_ganancias_file', documentId: 'exclGananciasFile' }, // Mapeo a nombre de campo de archivo
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
        sanitizedName = 'documento';
    }
    
    return sanitizedName + extension;
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
                if (el.type === 'checkbox' && (key === 'contactoDefecto' || key === 'contactoEnviaPdfOc' || key === 'contactoEnviaPdfOp' || certificacionSwitches.some(s => s.id === key))) { // Use s.id for checkbox ID
                     // For certification switches, use the model field name (s.name) for the form data key
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
            const originalFilename = input.files[0].name;
            const sanitizedFilename = sanitizeFilename(originalFilename);
            formData.append(modelFieldName, input.files[0], sanitizedFilename);
        }
    });
    return formData;
}

$(document).ready(function() {
  let proveedorId = null;
  let userId = null;
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

      // Deactivate all tab buttons and disable future ones
      tabButtons.forEach((button, btnIndex) => {
          button.classList.remove('active');
          // Disable buttons for steps ahead of the current one, unless we are in the last step
          if (btnIndex > index && currentStepIndex < steps.length - 1) {
              button.classList.add('disabled');
          } else {
              button.classList.remove('disabled');
          }
      });

      // Show the current step's pane and activate its button
      const currentStep = steps[index];
      const currentPane = document.getElementById(currentStep.panelId);
      const currentButton = document.getElementById(currentStep.buttonId);

      if (currentPane && currentButton) {
          currentPane.classList.add('show', 'active');
          currentButton.classList.add('active');
          currentButton.classList.remove('disabled'); // Ensure current button is never disabled

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
              const documentCard = document.getElementById(`card-${fileInputId}`);
              const documentTitleElement = documentCard ? documentCard.querySelector('.document-title') : null;
              const documentName = documentTitleElement ? documentTitleElement.textContent.replace('*','').trim() : `Documento ${fileInputId}`;

              // Check if there is a locally selected file OR if a file was already loaded initially
              const nuevoArchivoSeleccionado = fileInput && fileInput.files && fileInput.files.length > 0;
              const yaCargadoPreviamente = initialData[fileInputId] && initialData[fileInputId] !== ''; // initialData[fileInputId] stores the name of the initially loaded file

              if (!nuevoArchivoSeleccionado && !yaCargadoPreviamente) {
                  isValid = false;
                  stepErrorMessages.push(`El documento "${documentName}" es requerido.`);
                  if (documentCard) { documentCard.classList.add('border', 'border-danger'); }
              } else if (documentCard) {
                  documentCard.classList.remove('border', 'border-danger');
              }
          });
      }


      // Display step-specific error messages
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

  // Event listeners for tab buttons (allow navigation only to current or previous steps)
  tabButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          // Allow navigation to any step if we are on the last step (summary mode)
          // Or allow navigation only to the current step or previous steps if not on the last step
          if (currentStepIndex === steps.length - 1 || index <= currentStepIndex) {
               // If navigating to a previous step from the last step, clear validation messages
               if (currentStepIndex === steps.length - 1 && index < currentStepIndex) {
                   document.getElementById('formMsg').classList.add('d-none');
                   document.getElementById('formMsg').textContent = '';
                   // Also clear validation classes from inputs and document cards
                   document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                   document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
                   document.querySelectorAll('.document-card').forEach(card => card.classList.remove('border', 'border-danger'));
               }
              showStep(index);
          }
      });
  });


  async function obtenerUserId() {
    // Para la carga inicial, usar fetch simple con token existente
    const token = sessionStorage.getItem('jwt');
    if (!token) {
      console.error('No hay token disponible');
      return null;
    }
    
    try {
      const resp = await fetch('/Proveedores/api/userid/', { 
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      // Solo si falla por token, intentar con renovación
      if (resp.status === 401 || resp.status === 403) {
        console.log('Token inválido, intentando con renovación...');
        const respWithRefresh = await AuthManager.authenticatedFetch('/Proveedores/api/userid/');
        if (!respWithRefresh.ok) {
          console.error(`Error al obtener User ID después de renovación. Estado: ${respWithRefresh.status}`);
          return null;
        }
        const data = await respWithRefresh.json();
        return data?.user_id || null;
      }
      
      if (!resp.ok) {
        console.error(`Error al obtener User ID. Estado: ${resp.status}, Texto: ${resp.statusText}`);
        return null;
      }
      
      const data = await resp.json();
      if (!data || data.user_id === undefined) {
          console.error('User ID no encontrado en la respuesta de /api/userid/. Respuesta:', data);
          return null;
      }
      console.log('User ID obtenido:', data.user_id);
      return data.user_id;
    } catch (error) {
      console.error('Error durante la obtención de User ID:', error);
      return null;
    }
  }

  async function cargarDatos() {
    userId = await obtenerUserId();
    const msgDivCarga = $('#formMsg');

    if (!userId) {
      msgDivCarga.text('No se pudo verificar el usuario. Redirigiendo a la página de acceso...')
                 .removeClass('d-none alert-success alert-info')
                 .addClass('alert-danger');
      if (!window.location.href.endsWith('/Proveedores/acceder/')) {
          setTimeout(() => {
              if (!sessionStorage.getItem('jwt')) {
                   window.location.href = '/Proveedores/acceder/';
              } else {
                  console.error("UserID es null, pero el token JWT aún existe. Podría ser un error temporal del API /api/userid/.");
                  msgDivCarga.text('Hubo un problema al obtener los datos del usuario. Por favor, intente recargar la página o contacte a soporte si el problema persiste.');
              }
          }, 2500);
      }
      return;
    }
    msgDivCarga.addClass('d-none').removeClass('alert-danger alert-info');

    let proveedor = {};
    try {
      // Usar fetch simple para carga inicial
      const token = sessionStorage.getItem('jwt');
      let resp = await fetch('/Proveedores/api/proveedores/' + userId + '/', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      // Solo renovar si hay error de autenticación
      if (resp.status === 401 || resp.status === 403) {
        console.log('Renovando token para cargar datos del proveedor...');
        resp = await AuthManager.authenticatedFetch('/Proveedores/api/proveedores/' + userId + '/');
      }
      
      if (!resp.ok) {
        if (resp.status === 404) {
          console.warn('No se encontraron datos de proveedor para el usuario. Se puede completar el formulario.');
        } else {
          console.error('Error al cargar datos del proveedor: ' + resp.statusText, resp.status);
          msgDivCarga.text(`Error al cargar datos del proveedor (${resp.status}). Por favor, intente más tarde.`)
                    .removeClass('d-none').addClass('alert-danger');
        }
      } else {
          proveedor = await resp.json();
          proveedorId = proveedor.id;
          codCpa01Value = proveedor.cod_cpa01;
          codPais = proveedor.cod_pais;
          console.log('Datos del proveedor cargados:', proveedor);
      }

      // Cargar datos en los formularios principales
      camposPrincipalesEditables.forEach(campo => {
            const inputElement = document.getElementById(campo.key);
            if (inputElement) {
              const value = proveedor[campo.key]; inputElement.value = (value !== null && value !== undefined) ? value : '';
              initialData[campo.key] = inputElement.value;
              if (codCpa01Value && codCpa01Value.trim() !== "" && camposBloquear.includes(campo.key)) { inputElement.disabled = true; }
            }
          });
          
      const allFormInputs = document.querySelectorAll('#proveedorForm input, #proveedorForm select, #proveedorForm textarea, #configForm input, #configForm select, #configForm textarea');
      allFormInputs.forEach(input => {
        const key = input.name || input.id;
        if (proveedor.hasOwnProperty(key)) {
            const value = proveedor[key];
            if (input.type === 'checkbox') {
                 // For checkboxes, especially certification switches, check if the value is 'S'
                 input.checked = (value === 'S' || value === true); // Handle both 'S'/'N' and boolean
            } else {
                 input.value = (value !== null && value !== undefined) ? value : '';
            }
        }
        // Store initial data for change monitoring
        const dataKey = (input.id === 'provincia' && initialData.hasOwnProperty('provincia')) ? 'provincia' : key;
        if (input.type === 'checkbox') {
             // Store initial state for checkboxes as 'S' or 'N' for comparison
             initialData[dataKey] = input.checked ? 'S' : 'N';
        } else {
             initialData[dataKey] = input.value;
        }
      });


      const provinciaDisplayInput = document.getElementById('provincia');
      const idCpa57Input = document.getElementById('id_cpa57');
      const nomProvInput = document.getElementById('nom_prov');
      provinciaDisplayInput.value = proveedor.nom_prov || '';
      idCpa57Input.value = proveedor.id_cpa57 || '';
      nomProvInput.value = proveedor.nom_prov || '';
      initialData[provinciaDisplayInput.name || provinciaDisplayInput.id] = provinciaDisplayInput.value;
      initialData[idCpa57Input.name || idCpa57Input.id] = idCpa57Input.value;
      initialData[nomProvInput.name || nomProvInput.id] = nomProvInput.value;


      if (codPais) { await cambiarConexion(codPais); }

      await cargarCondicionIva(proveedor.id_categoria_iva_cond_iva);
      initialData['condicionIva'] = document.getElementById('condicionIva').value;

      await cargarIngresosBrutos(proveedor.tipo);
      initialData['ingresosBrutos'] = document.getElementById('ingresosBrutos').value;

      // --- Lógica para inicializar estados de archivos y checkboxes de certificación con JavaScript (desde API) ---
      proveedorFileStates = {}; // Reset states
      const allFileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
      allFileInputs.forEach(input => {
          const modelFieldName = fileInputIdToModelFieldName[input.id];
          if (modelFieldName && proveedor.hasOwnProperty(modelFieldName)) {
              // Store the file URL if it exists, otherwise null
              proveedorFileStates[modelFieldName] = proveedor[modelFieldName] || null;
          } else {
               proveedorFileStates[modelFieldName] = null;
          }
          // Store initial file name (or lack thereof) for change monitoring
          initialData[input.id] = proveedorFileStates[modelFieldName] ? proveedorFileStates[modelFieldName].split('/').pop() : '';
      });
      console.log('Proveedor file states initialized from API:', proveedorFileStates);

      // Re-sync certification switches based on loaded file states
      certificacionSwitches.forEach(s => {
          const switchElement = document.getElementById(s.id);
          const fileFieldName = s.name; // Nombre del campo en el modelo (ej: 'excl_ganancias_file')
          if (switchElement && proveedorFileStates.hasOwnProperty(fileFieldName)) {
              // Marcar el checkbox si el archivo correspondiente existe (URL no es null)
              switchElement.checked = !!proveedorFileStates[fileFieldName];
              // Actualizar initialData para el estado del switch ('S'/'N')
              initialData[fileFieldName] = switchElement.checked ? 'S' : 'N';
          }
      });
      // --- Fin de la lógica para inicializar checkboxes ---


      // Actualizar UI de documentos basado en el estado inicial y los switches
      // This will be handled by showStep(0) which is called after data load

      agregarValidacionCuitFrontend();
      monitorChanges(); // Iniciar monitoreo de cambios después de cargar y establecer estados iniciales
      addCertificationSwitchListeners(); // Añadir listeners para los switches de certificación

      // --- Start the wizard ---
      showStep(0);

    } catch (error) {
      console.error('Error al procesar los datos del proveedor o al cargar componentes:', error);
      msgDivCarga.text('Ocurrió un error al cargar la información de la página. Intente recargar.')
                 .removeClass('d-none').addClass('alert-danger');
      monitorChanges();
      agregarValidacionCuitFrontend();
      // Still show the first step even if data load failed, but forms will be empty/disabled
      showStep(0);
    }
  }

  async function cargarCondicionIva(selectedId) {
    const select = document.getElementById('condicionIva');
    select.innerHTML = '<option value="">Seleccione...</option>';
    try {
      const resp = await AuthManager.authenticatedFetch('/Proveedores/api/categoria-iva/');
      if (resp.ok) {
        const categorias = await resp.json();
        categorias.forEach(cat => {
          const option = document.createElement('option'); option.value = cat.id_categoria_iva;
          option.textContent = cat.desc_categoria_iva; option.setAttribute('data-cod', cat.cod_categoria_iva);
          select.appendChild(option);
        });
        console.log('Condiciones de IVA cargadas.');
      } else {
        console.error("Error cargando Condicion IVA:", resp.statusText, resp.status);
      }
      let valorASeleccionar = "";
      if (selectedId !== null && selectedId !== undefined && String(selectedId).trim() !== "") {
          if (Array.from(select.options).some(opt => opt.value == String(selectedId))) {
              valorASeleccionar = String(selectedId);
          } else {
              console.warn(`Opción con valor "${selectedId}" no encontrada en Condicion IVA. Se usará el valor por defecto.`);
          }
      }
      select.value = valorASeleccionar;
    } catch (error) {
      console.error("Network error cargando Condicion IVA:", error);
      select.value = "";
    }
  }

  async function cargarIngresosBrutos(selectedTipo) {
    const select = document.getElementById('ingresosBrutos');
    select.innerHTML = '<option value="">Seleccione...</option>';
     try {
      const resp = await AuthManager.authenticatedFetch('/Proveedores/api/ingresos-brutos/');
      if (resp.ok) {
        const ingresosBrutos = await resp.json();
        ingresosBrutos.forEach(ib => {
          const option = document.createElement('option'); option.value = ib.Cod_Ingresos_brutos;
          option.textContent = ib.Desc_Ingresos_brutos; select.appendChild(option);
        });
        console.log('Regímenes de Ingresos Brutos cargados.');
      } else {
        console.error("Error cargando Ingresos Brutos:", resp.statusText, resp.status);
      }
      let valorASeleccionar = "";
      if (selectedTipo !== null && selectedTipo !== undefined && String(selectedTipo).trim() !== "") {
          if (Array.from(select.options).some(opt => opt.value == String(selectedTipo))) {
              valorASeleccionar = String(selectedTipo);
          } else {
              console.warn(`Opción con valor "${selectedTipo}" no encontrada en Ingresos Brutos. Se usará el valor por defecto.`);
          }
      }
      select.value = valorASeleccionar;
    } catch (error) {
      console.error("Network error cargando Ingresos Brutos:", error);
      select.value = "";
    }
  }

  async function cambiarConexion(pais) {
      if (!pais) return;
      try {
          const resp = await AuthManager.authenticatedFetch('/Proveedores/api/cambiar-conexion/', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cod_pais: pais })
          });
          if (!resp.ok) {
              console.error('Error al cambiar la conexión de país:', await resp.text());
          } else {
              console.log('Conexión de país cambiada a:', pais);
          }
      } catch (error) {
          console.error('Network error al cambiar la conexión de país:', error);
      }
  }

  function monitorChanges() {
    const inputs = document.querySelectorAll(
      '#proveedorForm input, #proveedorForm select, #proveedorForm textarea, ' +
      '#configForm input, #configForm select, #configForm textarea, ' +
      '#documents-tab-pane .file-input' // Incluir file inputs para detectar cambios locales
    );
    const saveButton = document.querySelector('.btn-save');
    const checkChanges = () => {
      let hasChanges = false;
      inputs.forEach(input => {
        const key = input.name || input.id;
        const dataKey = (input.id === 'provincia' && initialData.hasOwnProperty('provincia')) ? 'provincia' : key;

        if (input.type === 'file') {
          // For file inputs, compare if a new file has been selected
          // with the name of the file that was initially loaded (if any).
          const currentFile = input.files && input.files.length > 0 ? input.files[0] : null;
          const initialFileName = initialData[key] || ''; // initialData[key] stores the name of the initially loaded file

          // Check if a new file is selected OR if an existing file was removed (though removal isn't directly supported by input type="file")
          // The primary check here is if a NEW file is selected when there wasn't one, or if the selected file is different from the initial one.
          // A simpler check for wizard context: if a file is selected in the input, it's a change to be saved.
          if (currentFile) {
             hasChanges = true;
          }
          // Note: Detecting removal of an existing file would require more complex state management beyond the input value itself.
          // We rely on the backend to handle cases where a file might be removed via a separate mechanism if needed.
          // For this wizard, selecting a file is the primary "change" for file inputs.

        } else if (input.type === 'checkbox') {
            // For checkboxes, compare the current state ('S'/'N' or true/false) with the initial state
            // Use the model field name for certification switches
            const isCertSwitch = certificacionSwitches.some(s => s.id === key);
            const initialValue = initialData[isCertSwitch ? input.name : dataKey] !== undefined ? String(initialData[isCertSwitch ? input.name : dataKey]) : (isCertSwitch ? 'N' : ''); // Default 'N' for switches, '' for others
            const currentValue = isCertSwitch ? (input.checked ? 'S' : 'N') : (input.checked.toString());

            if (currentValue !== initialValue) {
                hasChanges = true;
            }
        } else if (input.type === 'radio') {
             // For radios, compare the selected value with the initial
             const initialValue = initialData[dataKey] !== undefined ? String(initialData[dataKey]) : '';
             const currentValue = input.checked ? (input.value.trim() === "" ? '' : input.value.trim()) : initialValue; // If not checked, keep initial value to avoid detecting change if not touched
             if (input.checked && String(currentValue) !== initialValue) {
                 hasChanges = true;
             }
        }
        else {
            // For other input types (text, select, textarea, etc.)
            const currentValue = input.value;
            const initialValue = initialData[dataKey] !== undefined ? String(initialData[dataKey]) : ''; // Default to empty string
            if (String(currentValue) !== initialValue) {
                hasChanges = true;
            }
        }
        if (hasChanges) {
            // console.log(`Change detected in ${key}: Initial='${initialData[dataKey]}', Current='${input.value}'`);
        }
      });
      // Only show the save button if we are on the last step AND there are changes
      saveButton.style.display = (currentStepIndex === steps.length - 1 && hasChanges) ? 'block' : 'none';
      btnNextStep.style.display = (currentStepIndex < steps.length - 1) ? 'block' : 'none'; // Ensure Next button is visible if not on last step
    };

    // Add listeners to all relevant inputs
    inputs.forEach(input => {
      if (input.type === 'file' || input.tagName.toLowerCase() === 'select' || input.type === 'checkbox' || input.type === 'radio') {
          input.addEventListener('change', checkChanges);
      } else {
          input.addEventListener('input', checkChanges);
          input.addEventListener('change', checkChanges); // Add change listener for text inputs too (e.g., for paste)
      }
    });

    // Add event listeners for the new certification switches to update document card UI
    // NOTE: The pop-up logic is added in addCertificationSwitchListeners()
    certificacionSwitches.forEach(s => {
        const switchElement = document.getElementById(s.id);
        if (switchElement) {
            // Keep the UI update logic here, separate from the pop-up logic
            // This listener updates the UI card immediately when the switch state changes
            switchElement.addEventListener('change', () => {
                const fileInput = document.getElementById(s.documentId);
                const modelFieldName = fileInputIdToModelFieldName[s.documentId];

                // Determine file name: local file if selected, otherwise initial loaded name from initialData
                const fileName = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0].name : (initialData[s.documentId] || null);
                // Determine file URL: Use backend URL from proveedorFileStates
                const fileUrl = proveedorFileStates[modelFieldName] || null;

                const esRequerido = switchElement.checked; // Required if switch is checked
                actualizarUICardDocumento(s.documentId, fileName, fileUrl, esRequerido);
                // monitorChanges() is called by the general input change listener
            });
        }
    });
  }

  // --- Nueva función para añadir listeners a los switches de certificación ---
  function addCertificationSwitchListeners() {
      const confirmationModalEl = document.getElementById('confirmationModal');
      const confirmationModal = bootstrap.Modal.getOrCreateInstance(confirmationModalEl);
      const confirmationModalBody = document.getElementById('confirmationModalBody');
      const btnConfirmUpload = document.getElementById('btnConfirmUpload');

      certificacionSwitches.forEach(s => {
          const switchElement = document.getElementById(s.id);
          if (switchElement) {
              switchElement.addEventListener('change', function(event) {
                  const fileInputId = s.documentId;
                  // Check if a file is currently loaded (either initially or a new one selected)
                  const fileIsPresent = (initialData[fileInputId] && initialData[fileInputId] !== '') || (document.getElementById(fileInputId).files && document.getElementById(fileInputId).files.length > 0);


                  if (this.checked && !fileIsPresent) {
                      const documentTitleElement = document.getElementById(`card-${fileInputId}`).querySelector('.document-title');
                      const documentTitle = documentTitleElement ? documentTitleElement.textContent.replace('*', '').trim() : "este documento";

                      // --- New logic using Bootstrap Modal ---
                      confirmationModalBody.textContent = `Ha activado la certificación "${documentTitle}". ¿Desea cargar el documento ahora?`;

                      let confirmed = false;

                      const handleConfirm = () => {
                        confirmed = true;
                        triggerUpload(fileInputId);
                        confirmationModal.hide();
                      };

                      // Use .onclick to easily replace the handler for each switch
                      btnConfirmUpload.onclick = handleConfirm;

                      const handleHide = () => {
                        if (!confirmed) {
                            // User cancelled (closed modal without confirming)
                            this.checked = false;
                            // Manually trigger change event to update UI and monitorChanges
                            const changeEvent = new Event('change', { bubbles: true });
                            this.dispatchEvent(changeEvent);
                        }
                         // Clean up the event listener to avoid multiple fires
                        confirmationModalEl.removeEventListener('hidden.bs.modal', handleHide);
                      };

                      confirmationModalEl.addEventListener('hidden.bs.modal', handleHide, { once: true });

                      confirmationModal.show();
                  }
              });
          }
      });
  }
  // --- Fin Nueva función ---


  document.getElementById('proveedorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // --- Final Validation before saving ---
    let finalValidationValid = true;
    let finalValidationMessages = [];
    let firstErrorStepIndex = -1;

    // Clear all previous validation feedback across all steps
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    document.querySelectorAll('.document-card').forEach(card => card.classList.remove('border', 'border-danger'));

    // Validate all required fields from camposContactoObligatorios
    camposContactoObligatorios.forEach(campoKey => {
        const input = document.getElementById(campoKey);
        if (input && input.value.trim() === "") {
            finalValidationValid = false;
            const labelText = input.previousElementSibling?.textContent.replace('*', '').trim() || campoKey;
            finalValidationMessages.push(`El campo "${labelText}" es obligatorio.`);
            input.classList.add('is-invalid');
            const feedbackEl = document.getElementById(`${campoKey}-invalid`) || input.nextElementSibling;
            if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) feedbackEl.textContent = `Este campo es obligatorio.`;

            // Find the step index for this field
            const stepIndex = steps.findIndex(step => document.getElementById(step.panelId).contains(input));
            if (firstErrorStepIndex === -1 && stepIndex !== -1) {
                firstErrorStepIndex = stepIndex;
            }
        } else if (input) {
             input.classList.remove('is-invalid');
             const feedbackEl = document.getElementById(`${campoKey}-invalid`) || input.nextElementSibling;
             if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) feedbackEl.textContent = "";
        }
    });

    // Validate CUIT format if present
    const cuitInputHTML = document.getElementById('n_cuit');
    if (cuitInputHTML && cuitInputHTML.value.trim() !== "") {
        const cuitPattern = /^\d{2}-\d{8}-\d{1}$/;
        const feedbackEl = document.getElementById('n_cuit-invalid');
        if (!cuitPattern.test(cuitInputHTML.value.trim())) {
            finalValidationValid = false;
            finalValidationMessages.push('El CUIT debe tener el formato XX-XXXXXXXX-X.');
            cuitInputHTML.classList.add('is-invalid');
            const feedbackEl = document.getElementById('n_cuit-invalid');
            if (feedbackEl) feedbackEl.textContent = 'Formato inválido. Ejemplo: 20-31441849-3';
             const stepIndex = steps.findIndex(step => document.getElementById(step.panelId).contains(cuitInputHTML));
             if (firstErrorStepIndex === -1 && stepIndex !== -1) {
                 firstErrorStepIndex = stepIndex;
             }
        } else {
             cuitInputHTML.classList.remove('is-invalid');
             const feedbackEl = document.getElementById('n_cuit-invalid');
             if (feedbackEl) feedbackEl.textContent = "";
        }
    }


    // Validate all dynamically required documents
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
             if (firstErrorStepIndex === -1 && stepIndex !== -1) {
                 firstErrorStepIndex = stepIndex;
             }
        } else if (documentCard) {
            documentCard.classList.remove('border', 'border-danger');
        }
    });


    const msgDiv = document.getElementById('formMsg');
    if (!finalValidationValid) {
        msgDiv.innerHTML = 'Errores encontrados:<br>' + finalValidationMessages.join('<br>');
        msgDiv.className = 'alert alert-danger mt-0 mb-3';
        msgDiv.classList.remove('d-none');

        // Navigate to the first step with an error
        if (firstErrorStepIndex !== -1) {
            showStep(firstErrorStepIndex);
        }
        return; // Stop the submission
    } else {
        msgDiv.classList.add('d-none');
        msgDiv.textContent = '';
    }
    // --- End Final Validation ---


    const formDataToSave = gatherFormDataFromAllTabs();
    const method = proveedorId ? 'PATCH' : 'POST';
    let url = proveedorId ? `/Proveedores/api/proveedores/${proveedorId}/` : `/Proveedores/api/proveedores/`;

    // Add user and country code only on POST (creation)
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
          headers: {
              'Authorization': 'Bearer ' + sessionStorage.getItem('jwt'),
              'X-CSRFToken': getCookie('csrftoken')
          },
          body: formDataToSave
      });

      if (resp.ok) {
        const responseData = await resp.json();
        if (method === 'POST' && responseData.id) {
          proveedorId = responseData.id;
          if (responseData.cod_cpa01) { codCpa01Value = responseData.cod_cpa01; camposBloquear.forEach(keyToBlock => { const inputToBlock = document.getElementById(keyToBlock); if (inputToBlock && codCpa01Value && codCpa01Value.trim() !== "") { inputToBlock.disabled = true; }});}
          if (responseData.cod_pais) { codPais = responseData.cod_pais; }
        }
        // Actualizar initialData con los valores guardados (excluyendo archivos por ahora)
        // Iterate over formDataToSave to update initialData for non-file fields
        for (const [key, value] of formDataToSave.entries()) {
          if (value instanceof File) continue; // Skip files here

          // Handle specific fields and certification switches
          const certSwitchConfig = certificacionSwitches.find(s => s.name === key);
          if (certSwitchConfig) {
              initialData[key] = String(value); // Store 'S' or 'N' for the model field name
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
        // Ensure province display name is also updated in initialData
        initialData[document.getElementById('provincia').name || document.getElementById('provincia').id] = formDataToSave.get('nom_prov') || '';


        // Actualizar initialData and UI for files based on server response
        const fileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
        fileInputs.forEach(input => {
          if (input.id) {
              const modelFieldName = fileInputIdToModelFieldName[input.id];
              const docUrlFromServer = responseData[modelFieldName] || null; // Get the URL of the saved file from the response
              const docNameFromServer = docUrlFromServer ? docUrlFromServer.split('/').pop() : null;

              // Update proveedorFileStates with the URL of the saved file
              proveedorFileStates[modelFieldName] = docUrlFromServer;

              // Update initialData for the file input with the name of the saved file
              initialData[input.id] = docNameFromServer || '';

              // Re-evaluate if the document is required based on current switch states
              const esRequerido = getDynamicRequiredDocumentIds().includes(input.id);

              // Update the UI card for the document
              actualizarUICardDocumento(input.id, docNameFromServer, docUrlFromServer, esRequerido);

              // Clear the file input value after successful upload
              input.value = '';
          }
        });

        // Re-evaluate the state of certification switches after updating file states
         certificacionSwitches.forEach(s => {
            const switchElement = document.getElementById(s.id);
            const fileFieldName = s.name;
             if (switchElement && proveedorFileStates.hasOwnProperty(fileFieldName)) {
                // Sync the switch state with whether a file is loaded
                switchElement.checked = !!proveedorFileStates[fileFieldName];
                // Sync initialData with the final switch state
                initialData[fileFieldName] = switchElement.checked ? 'S' : 'N';
             }
         });


        msgDiv.textContent = 'Datos actualizados correctamente.';
        msgDiv.className = 'alert alert-success mt-0 mb-3';
        msgDiv.classList.remove('d-none');

        // After successful save, re-check changes to potentially hide the save button
        monitorChanges();

      } else {
        const errText = await resp.text();
        let err;
        try { err = JSON.parse(errText); } catch (e) { err = errText; }
        let errorMessages = 'Error al guardar los datos.';
        if (typeof err === 'object' && err !== null) {
            errorMessages = Object.entries(err).map(([key, value]) => {
                // Try to find a label for the field, fallback to key
                const fieldLabel = document.querySelector(`label[for="${key}"]`)?.textContent.replace('*', '').trim() || key;
                return `${fieldLabel}: ${Array.isArray(value) ? value.join(', ') : value}`;
            }).join('<br>');
        } else if (typeof err === 'string') {
            errorMessages = err;
        }
        msgDiv.innerHTML = errorMessages;
        msgDiv.className = 'alert alert-danger mt-0 mb-3';
        msgDiv.classList.remove('d-none');

        // Optional: Try to navigate to the first step that contains an input mentioned in the error response
        if (typeof err === 'object' && err !== null) {
            const errorFieldKeys = Object.keys(err);
            for (const key of errorFieldKeys) {
                const inputWithError = document.getElementById(key);
                if (inputWithError) {
                    const stepIndex = steps.findIndex(step => document.getElementById(step.panelId).contains(inputWithError));
                    if (stepIndex !== -1) {
                        showStep(stepIndex);
                        // Highlight the specific input with the error class
                        inputWithError.classList.add('is-invalid');
                        const feedbackEl = document.getElementById(`${key}-invalid`) || inputWithError.nextElementSibling;
                        if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                             feedbackEl.textContent = Array.isArray(err[key]) ? err[key].join(', ') : err[key];
                        }
                        break; // Go to the first step with an error and stop
                    }
                }
            }
        }
      }
    } catch (error) {
      console.error("Error durante el guardado:", error);
      msgDiv.textContent = 'Error de red o problema al procesar la solicitud de guardado.';
      msgDiv.className = 'alert alert-danger mt-0 mb-3';
      msgDiv.classList.remove('d-none');
    } finally {
        document.querySelector('.btn-save').disabled = false;
    }
});


  function agregarValidacionCuitFrontend() {
    const cuitInput = document.getElementById('n_cuit');
    if (cuitInput) {
      cuitInput.addEventListener('input', function() {
        const cuitPattern = /^\d{2}-\d{8}-\d{1}$/; const feedbackEl = document.getElementById('n_cuit-invalid');
        if (cuitInput.value.trim() !== "" && !cuitPattern.test(cuitInput.value.trim())) { cuitInput.classList.add('is-invalid'); if (feedbackEl) feedbackEl.textContent = 'Formato inválido. Ejemplo: 20-31441849-3';
        } else { cuitInput.classList.remove('is-invalid'); if (feedbackEl) feedbackEl.textContent = ""; }
      });
    }
  }

  function getCookie(name) {
      let cookieValue = null; if (document.cookie && document.cookie !== '') { const cookies = document.cookie.split(';'); for (let i = 0; i < cookies.length; i++) { const cookie = cookies[i].trim(); if (cookie.substring(0, name.length + 1) === (name + '=')) { cookieValue = decodeURIComponent(cookie.substring(name.length + 1)); break; }}} return cookieValue;
  }

  document.getElementById('provincia').addEventListener('input', async function() {
    const query = this.value; const provinciaListDiv = document.getElementById('provinciaList');
    if (query.length < 2) { provinciaListDiv.innerHTML = ''; return; }
    if (!codPais && proveedorId) {
      console.warn("Código de país (codPais) no establecido globalmente. Intentando usar el del proveedor o AR por defecto para búsqueda de provincia.");
    }
    const paisParaQuery = codPais || 'AR';
    try {
      const resp = await fetch(`/Proveedores/api/provincias/?q=${encodeURIComponent(query)}&cod_pais=${paisParaQuery}`, { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('jwt') }});
      if (resp.ok) { const provincias = await resp.json(); const list = provincias.map(p => `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}" data-nom="${p.display}">${p.display}</button>`).join(''); provinciaListDiv.innerHTML = list;
      } else { console.error("Error buscando provincias:", resp.statusText); provinciaListDiv.innerHTML = '<div class="list-group-item text-danger">Error al buscar</div>'; }
    } catch (error) { console.error("Network error buscando provincias:", error); provinciaListDiv.innerHTML = '<div class="list-group-item text-danger">Error de red</div>';}
  });

  document.getElementById('provinciaList').addEventListener('click', function(e) {
    if (e.target && e.target.matches('button.list-group-item')) {
      const selectedText = e.target.textContent; const selectedId = e.target.getAttribute('data-id'); const selectedNom = e.target.getAttribute('data-nom');
      const provinciaInput = document.getElementById('provincia'); provinciaInput.value = selectedText;
      document.getElementById('id_cpa57').value = selectedId; document.getElementById('nom_prov').value = selectedNom;
      document.getElementById('provinciaList').innerHTML = '';
      $(provinciaInput).trigger('input').trigger('change'); $(document.getElementById('id_cpa57')).trigger('input').trigger('change'); $(document.getElementById('nom_prov')).trigger('input').trigger('change');
    }
  });

  // Verificar autenticación de forma más permisiva
  const jwt = sessionStorage.getItem('jwt');
  const refresh = sessionStorage.getItem('refresh_token');
  
  if (!jwt || !refresh) {
    console.log('No se encontraron tokens, redirigiendo al login');
    alert('Debe iniciar sesión para acceder a esta página.');
    window.location.href = '/Proveedores/acceder/';
  } else {
    console.log('Tokens encontrados, cargando datos...');
    cargarDatos(); // Iniciar la carga de datos al cargar la página
  }

  // Listener for file inputs
  document.querySelectorAll('.file-input').forEach(input => {
    input.addEventListener('change', function() {
      const fileInputId = this.id;
      const file = this.files[0];
      const fileName = file ? file.name : null;
      const esRequerido = getDynamicRequiredDocumentIds().includes(fileInputId); // Use the dynamic function

      // Update UI immediately with local file info (no URL yet)
      // The URL will be obtained and updated in proveedorFileStates after a successful save
      actualizarUICardDocumento(fileInputId, fileName, null, esRequerido);

      if (file) {
          const maxFileSize = 5 * 1024 * 1024; // 5MB
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          if (file.size > maxFileSize) {
              alert(`El archivo "${fileName}" es demasiado grande (máx. 5MB). No se subirá.`); this.value = '';
              actualizarUICardDocumento(fileInputId, null, null, esRequerido); // Reset UI on error
              return;
          }
          if (!allowedTypes.includes(file.type)) {
              alert(`Tipo de archivo no permitido para "${fileName}". Permitidos: PDF, JPG, PNG, DOC, DOCX.`); this.value = '';
              actualizarUICardDocumento(fileInputId, null, null, esRequerido); // Reset UI on error
              return;
          }
      }
    });
  });

  const contactoModal = new bootstrap.Modal(document.getElementById('contactoModal'));
  const contactoForm = document.getElementById('contactoForm');
  const mensajesStatusDiv = document.getElementById('mensajesStatus');
  const contactoFormMsgDiv = document.getElementById('contactoFormMsg');

  // Removed the shown.bs.tab listener for messages tab,
  // cargarContactos is now called by showStep()

  $('#btnNuevoContacto').on('click', function() {
    contactoForm.reset();
    $('#contactoId').val('');
    $('#contactoModalLabel').text('Agregar Nuevo Contacto');
    contactoForm.classList.remove('was-validated');
    contactoFormMsgDiv.classList.add('d-none');
    contactoModal.show();
  });

  async function cargarContactos() {
    const tablaBody = $('#tablaContactosBody');
    tablaBody.html('<tr><td colspan="8" class="text-center">Cargando contactos...</td></tr>');
    const JW_TOKEN = sessionStorage.getItem('jwt');
    if (!JW_TOKEN) {
      tablaBody.html('<tr><td colspan="8" class="text-center text-danger">Error de autenticación.</td></tr>');
      return;
    }

    try {
      const response = await fetch('/Proveedores/api/proveedor-contactos/', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + JW_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      const contactos = await response.json();
      renderContactos(contactos);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      tablaBody.html(`<tr><td colspan="8" class="text-center text-danger">Error al cargar contactos: ${error.message}</td></tr>`);
      mostrarMensajeGlobal(mensajesStatusDiv, 'Error al cargar contactos.', 'danger');
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
      const row = `
        <tr>
          <td>${escapeHtml(contacto.nombre || '')}</td>
          <td>${escapeHtml(contacto.cargo || '')}</td>
          <td>${escapeHtml(contacto.email || '')}</td>
          <td>${escapeHtml(contacto.telefono || '')}</td>
          <td class="text-center">${contacto.defecto === 'S' ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
          <td class="text-center">${contacto.envia_pdf_oc === 'S' ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
          <td class="text-center">${contacto.envia_pdf_op === 'S' ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary btn-editar-contacto" data-id="${contacto.id}" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-eliminar-contacto" data-id="${contacto.id}" title="Eliminar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.024l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3.5-.058a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5.5a.5.5 0 0 0-.5-.5m3.5 0a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5.5a.5.5 0 0 0-.5-.5"/></svg>
            </button>
          </td>
        </tr>
      `;
      tablaBody.append(row);
    });

    $('.btn-editar-contacto').on('click', function() {
      const contactoId = $(this).data('id');
      const contactoAEditar = contactos.find(c => c.id == contactoId);
      if (contactoAEditar) {
        abrirModalEdicion(contactoAEditar);
      }
    });

    $('.btn-eliminar-contacto').on('click', function() {
      const contactoId = $(this).data('id');
      const contactoNombre = $(this).closest('tr').find('td:first').text();
      eliminarContacto(contactoId, contactoNombre);
    });
  }

  function abrirModalEdicion(contacto) {
    contactoForm.reset();
    contactoForm.classList.remove('was-validated');
    contactoFormMsgDiv.classList.add('d-none');

    $('#contactoId').val(contacto.id);
    $('#contactoModalLabel').text('Editar Contacto');

    $('#contactoNombre').val(contacto.nombre || '');
    $('#contactoCargo').val(contacto.cargo || '');
    $('#contactoTelefono').val(contacto.telefono || '');
    $('#contactoMovil').val(contacto.telefono_movil || '');
    $('#contactoEmail').val(contacto.email || '');
    $('#contactoObservaciones').val(contacto.observacion || '');

    $('#contactoDefecto').prop('checked', contacto.defecto === 'S');
    $('#contactoEnviaPdfOc').prop('checked', contacto.envia_pdf_oc === 'S');
    $('#contactoEnviaPdfOp').prop('checked', contacto.envia_pdf_op === 'S');

    contactoModal.show();
  }

  contactoForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!contactoForm.checkValidity()) {
      contactoForm.classList.add('was-validated');
      return;
    }
    contactoForm.classList.add('was-validated');

    const JW_TOKEN = sessionStorage.getItem('jwt');
    if (!JW_TOKEN) {
        mostrarMensaje(contactoFormMsgDiv, 'Error de autenticación.', 'danger');
        return;
    }

    const contactoId = $('#contactoId').val();
    const formData = {
      nombre: $('#contactoNombre').val(),
      cargo: $('#contactoCargo').val(),
      telefono: $('#contactoTelefono').val(),
      telefono_movil: $('#contactoMovil').val(),
      email: $('#contactoEmail').val(),
      observacion: $('#contactoObservaciones').val(),
      defecto: $('#contactoDefecto').is(':checked') ? 'S' : 'N',
      envia_pdf_oc: $('#contactoEnviaPdfOc').is(':checked') ? 'S' : 'N',
      envia_pdf_op: $('#contactoEnviaPdfOp').is(':checked') ? 'S' : 'N',
    };

    const url = contactoId ? `/Proveedores/api/proveedor-contactos/${contactoId}/` : '/Proveedores/api/proveedor-contactos/';
    const method = contactoId ? 'PUT' : 'POST';

    $('#btnGuardarContacto').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...');

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': 'Bearer ' + JW_TOKEN,
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = `Error HTTP ${response.status}: ${response.statusText}.`;
        if (errorData && typeof errorData === 'object') {
            errorMsg += " Detalles: " + Object.entries(errorData).map(([key, val]) => `${key}: ${val}`).join('; ');
        }
        throw new Error(errorMsg);
      }

      mostrarMensajeGlobal(mensajesStatusDiv, `Contacto ${contactoId ? 'actualizado' : 'creado'} correctamente.`, 'success');
      contactoModal.hide();
      cargarContactos(); // Reload contacts after save/update

    } catch (error) {
      console.error('Error al guardar contacto:', error);
      mostrarMensaje(contactoFormMsgDiv, `Error al guardar: ${error.message}`, 'danger');
    } finally {
        $('#btnGuardarContacto').prop('disabled', false).text('Guardar Contacto');
    }
  });

  async function eliminarContacto(contactoId, contactoNombre) {
    if (!confirm(`¿Está seguro de que desea eliminar el contacto "${escapeHtml(contactoNombre)}"?`)) {
      return;
    }

    const JW_TOKEN = sessionStorage.getItem('jwt');
    if (!JW_TOKEN) {
        mostrarMensajeGlobal(mensajesStatusDiv, 'Error de autenticación.', 'danger');
        return;
    }

    try {
      const response = await fetch(`/Proveedores/api/proveedor-contactos/${contactoId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + JW_TOKEN,
          'X-CSRFToken': getCookie('csrftoken')
        }
      });

      if (!response.ok) {
        if (response.status !== 204) { // 204 No Content is success for DELETE
            const errorData = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorData || response.statusText}`);
        }
      }

      mostrarMensajeGlobal(mensajesStatusDiv, 'Contacto eliminado correctamente.', 'success');
      cargarContactos(); // Reload contacts after deletion

    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      mostrarMensajeGlobal(mensajesStatusDiv, `Error al eliminar: ${error.message}`, 'danger');
    }
  }

  function mostrarMensaje(divElement, mensaje, tipo = 'info') {
    divElement.textContent = mensaje;
    divElement.className = `alert alert-${tipo}`;
    divElement.classList.remove('d-none');
  }

  function mostrarMensajeGlobal(divElement, mensaje, tipo = 'info') {
    divElement.textContent = mensaje;
    divElement.className = `alert alert-${tipo} mt-3 mb-3`;
    divElement.classList.remove('d-none');
    setTimeout(() => {
        divElement.classList.add('d-none');
    }, 5000);
  }

  function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "''")
         .replace(/'/g, "'");
  }

}); // Fin de $(document).ready()

// Global functions (or functions that need to be global)
function logout() { sessionStorage.removeItem('jwt'); window.location.href = '/Proveedores/acceder/'; }
function goToDashboard() { window.location.href = '/Proveedores/dashboard/'; }

// Modified to be called by action buttons and replace button
function triggerUpload(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (fileInput) {
        fileInput.click();
    } else {
        console.error(`Input de archivo con ID "${fileInputId}" no encontrado.`);
    }
}

// Function to display document in modal
// Now receives the fileInputId to know which document is being viewed
function viewDocument(path, fileInputId) {
  const documentViewerModal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
  const documentViewerModalBody = document.getElementById('documentViewerModalBody');
  const btnReplaceDocument = document.getElementById('btnReplaceDocument');

  // Store the fileInputId in the replace button to use later
  btnReplaceDocument.setAttribute('data-file-input-id', fileInputId);

  if (path && path !== '#' && !path.startsWith('blob:')) {
      documentViewerModalBody.innerHTML = ''; // Clear previous content
      const fileExtension = path.split('.').pop().toLowerCase();

      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
          const img = document.createElement('img');
          img.src = path;
          img.classList.add('img-fluid', 'mw-100', 'mh-100'); // Make image responsive and fit modal
          img.style.maxHeight = '80vh'; // Limit height to prevent overflow
          documentViewerModalBody.appendChild(img);
      } else if (fileExtension === 'pdf') {
          const embed = document.createElement('embed');
          embed.src = path;
          embed.type = 'application/pdf';
          embed.style.width = '100%';
          embed.style.height = '80vh'; // Set a fixed height for PDF viewer
          documentViewerModalBody.appendChild(embed);
      } else if (['doc', 'docx'].includes(fileExtension)) {
           // For Word documents, provide a link to download/view in browser if supported
           const link = document.createElement('a');
           link.href = path;
           link.textContent = `Descargar o ver documento (${fileExtension.toUpperCase()})`;
           link.target = '_blank';
           link.classList.add('btn', 'btn-secondary', 'mt-3');
           documentViewerModalBody.innerHTML = '<p>Este tipo de archivo puede no visualizarse directamente en el navegador.</p>';
           documentViewerModalBody.appendChild(link);
      }
       else {
          // Fallback for other types or if type is unknown
          const link = document.createElement('a');
          link.href = path;
          link.textContent = 'Ver documento (abrir en nueva pestaña)';
          link.target = '_blank';
          link.classList.add('btn', 'btn-secondary', 'mt-3');
          documentViewerModalBody.innerHTML = '<p>No se puede previsualizar este tipo de archivo.</p>';
          documentViewerModalBody.appendChild(link);
      }

      documentViewerModal.show(); // Show the modal
  } else if (path && path.startsWith('blob:')) {
      alert('El archivo está seleccionado localmente. Se enviará al guardar.');
      // If it's a local file, don't show the replace button in the viewer modal
      btnReplaceDocument.style.display = 'none';
      return; // Do not show the modal if it's a local file
  }
  else {
      alert('El documento aún no ha sido cargado o no hay una URL válida. Intente guardar los cambios primero.');
      // If no file is loaded, don't show the replace button
      btnReplaceDocument.style.display = 'none';
      return; // Do not show the modal if no file
  }

  // Show the replace button only if a document is loaded (valid URL)
  btnReplaceDocument.style.display = (path && path !== '#' && !path.startsWith('blob:')) ? 'block' : 'none';
}

// Listener for the "Replace Document" button in the modal
document.getElementById('btnReplaceDocument').addEventListener('click', function() {
    const fileInputId = this.getAttribute('data-file-input-id');
    if (fileInputId) {
        // Hide the viewer modal before opening the file selector
        const documentViewerModal = bootstrap.Modal.getInstance(document.getElementById('documentViewerModal'));
        if (documentViewerModal) {
            documentViewerModal.hide();
        }
        // Trigger the corresponding file upload
        triggerUpload(fileInputId);
    } else {
        console.error('No se pudo determinar el input de archivo para reemplazar.');
    }
});
