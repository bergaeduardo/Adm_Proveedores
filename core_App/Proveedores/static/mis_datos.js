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
        documentCard.classList.remove('status-required-missing', 'status-optional-missing', 'status-present');
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
                actionButton.onclick = () => triggerUpload(fileInputId); // <-- ESTA LÍNEA ES LA CORRECCIÓN
                actionButton.classList.add('btn-outline-primary');
                documentCard.classList.add('status-optional-missing');
                statusIconArea.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle-fill status-icon" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/></svg>`;
            }
        }
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


      const camposPrincipalesEditables = [
        { key: "nom_provee", label: "Razon social" }, { key: "n_cuit", label: "CUIT" },
        { key: "domicilio", label: "Domicilio" }, { key: "localidad", label: "Localidad" },
        { key: "c_postal", label: "Código postal" }, { key: "telefono_1", label: "Teléfono" },
        { key: "telefono_2", label: "Teléfono 2" }, { key: "telefono_movil", label: "Teléfono móvil" },
        { key: "e_mail", label: "Email" }, { key: "web", label: "Pagina Web" },
        { key: "nom_fant", label: "Nombre comercial" }, { key: "domicilio_comercial", label: "Domicilio comercial" },
        { key: "n_iva", label: "Actividad" },
      ];
      const camposConfiguracionEditables = [
        { key: "n_ing_brut", label: "Nro. de ingresos brutos" },
        { key: "cbu", label: "Clave bancaria única (CBU)" }, { key: "descripcion_cbu", label: "Descripción" },
        { key: "cbu_2", label: "Clave bancaria única 2 (CBU)" }, { key: "descripcion_cbu_2", label: "Descripción" },
        { key: "cbu_3", label: "Clave bancaria única 3 (CBU)" }, { key: "descripcion_cbu_3", label: "Descripción" },
      ];

      const camposContactoObligatorios = ["nom_provee", "n_cuit", "telefono_1", "e_mail", "domicilio", "cbu"];

      const camposBloquear = ["nom_provee","nom_fant","n_cuit"];

      // Nuevos campos de switches para certificaciones
      const certificacionSwitches = [
          { id: 'certExclGanancias', name: 'excl_ganancias_file', documentId: 'exclGananciasFile' }, // Mapeo a nombre de campo de archivo
          { id: 'certExclIIBB', name: 'excl_iibb_file', documentId: 'exclIIBBFile' },
          { id: 'certNoRetGanancias', name: 'no_ret_ganancias_file', documentId: 'noRetGananciasFile' },
          { id: 'certNoRetIIBB', name: 'no_ret_iibb_file', documentId: 'noRetIIBBFile' }
      ];

      async function obtenerUserId() {
        const JW_TOKEN = sessionStorage.getItem('jwt');
        if (!JW_TOKEN) {
            console.warn('No se encontró JWT en sessionStorage. Redirigiendo a la página de acceso.');
            window.location.href = '/Proveedores/acceder/';
            return null;
        }
        try {
          const resp = await fetch('/Proveedores/api/userid/', { headers: { 'Authorization': 'Bearer ' + JW_TOKEN }});
          if (!resp.ok) {
            console.error(`Error al obtener User ID. Estado: ${resp.status}, Texto: ${resp.statusText}`);
            if (resp.status === 401 || resp.status === 403) {
              console.log('Error de autenticación (401/403). Limpiando JWT y redirigiendo a la página de acceso.');
              sessionStorage.removeItem('jwt');
              window.location.href = '/Proveedores/acceder/';
            }
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
          console.error('Error de red durante la obtención de User ID (/api/userid/):', error);
          sessionStorage.removeItem('jwt');
          window.location.href = '/Proveedores/acceder/';
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
          const resp = await fetch('/Proveedores/api/proveedores/' + userId + '/', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('jwt') }});
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

          camposConfiguracionEditables.forEach(campo => {
            const inputElement = document.getElementById(campo.key);
            if (inputElement) {
              const value = proveedor[campo.key]; inputElement.value = (value !== null && value !== undefined) ? value : '';
              initialData[campo.key] = inputElement.value;
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
          });
          console.log('Proveedor file states initialized from API:', proveedorFileStates);

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
          const initiallyRequiredDocumentIds = getDynamicRequiredDocumentIds();

          allFileInputs.forEach(input => {
              if (input.id) {
                  const modelFieldName = fileInputIdToModelFieldName[input.id];
                  const fileUrl = proveedorFileStates[modelFieldName];
                  const fileName = fileUrl ? fileUrl.split('/').pop() : null;

                  initialData[input.id] = fileName || '';

                  const esRequerido = initiallyRequiredDocumentIds.includes(input.id);
                  actualizarUICardDocumento(input.id, fileName, fileUrl, esRequerido);
              }
          });


          // Cargar datos de contactos (si aplica, basado en tu implementación actual)
          // ... (Tu código existente para cargar contactos si es necesario al inicio) ...


          agregarValidacionCuitFrontend();
          monitorChanges(); // Iniciar monitoreo de cambios después de cargar y establecer estados iniciales
          addCertificationSwitchListeners(); // Añadir listeners para los switches de certificación
        } catch (error) {
          console.error('Error al procesar los datos del proveedor o al cargar componentes:', error);
          msgDivCarga.text('Ocurrió un error al cargar la información de la página. Intente recargar.')
                     .removeClass('d-none').addClass('alert-danger');
          monitorChanges();
          agregarValidacionCuitFrontend();
        }
      }

      async function cargarCondicionIva(selectedId) {
        const select = document.getElementById('condicionIva');
        select.innerHTML = '<option value="">Seleccione...</option>';
        try {
          const resp = await fetch('/Proveedores/api/categoria-iva/', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('jwt') }});
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
          const resp = await fetch('/Proveedores/api/ingresos-brutos/', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('jwt') }});
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
              const resp = await fetch('/Proveedores/api/cambiar-conexion/', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer ' + sessionStorage.getItem('jwt')
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
              // Para inputs de tipo file, comparamos si se ha seleccionado un nuevo archivo
              // con el nombre del archivo que estaba cargado inicialmente (si lo había).
              const currentFileName = input.files && input.files.length > 0 ? input.files[0].name : '';
              const initialFileName = initialData[key] || ''; // initialData[key] guarda el nombre del archivo cargado inicialmente
              if (currentFileName !== '' && currentFileName !== initialFileName) {
                 hasChanges = true;
              }
            } else if (input.type === 'checkbox') {
                // Para checkboxes, comparamos el estado actual ('S'/'N' o true/false) con el estado inicial
                // Usamos el nombre del campo del modelo para los switches de certificación
                const isCertSwitch = certificacionSwitches.some(s => s.id === key);
                const initialValue = initialData[isCertSwitch ? input.name : dataKey] !== undefined ? String(initialData[isCertSwitch ? input.name : dataKey]) : (isCertSwitch ? 'N' : ''); // Default 'N' for switches, '' for others
                const currentValue = isCertSwitch ? (input.checked ? 'S' : 'N') : (input.checked.toString());

                if (currentValue !== initialValue) {
                    hasChanges = true;
                }
            } else if (input.type === 'radio') {
                 // Para radios, comparamos el valor seleccionado con el inicial
                 const initialValue = initialData[dataKey] !== undefined ? String(initialData[dataKey]) : '';
                 const currentValue = input.checked ? (input.value.trim() === "" ? '' : input.value.trim()) : initialValue; // Si no está checked, mantenemos el valor inicial para no detectar cambio si no se tocó
                 if (input.checked && String(currentValue) !== initialValue) {
                     hasChanges = true;
                 }
            }
            else {
                // Para otros tipos de inputs (texto, select, textarea, etc.)
                const currentValue = input.value;
                const initialValue = initialData[dataKey] !== undefined ? String(initialData[dataKey]) : ''; // Default to empty string
                if (String(currentValue) !== initialValue) {
                    hasChanges = true;
                }
            }
          });
          saveButton.style.display = hasChanges ? 'block' : 'none';
        };
        inputs.forEach(input => {
          if (input.type === 'file' || input.tagName.toLowerCase() === 'select' || input.type === 'checkbox' || input.type === 'radio') {
              input.addEventListener('change', checkChanges);
          } else {
              input.addEventListener('input', checkChanges); input.addEventListener('change', checkChanges);
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
                      const fileWasLoadedInitially = initialData[fileInputId] && initialData[fileInputId] !== '';

                      if (this.checked && !fileWasLoadedInitially) {
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


      function gatherFormDataFromAllTabs() {
          const formData = new FormData();
          const formsToProcess = ['#proveedorForm', '#configForm', '#messagesForm'];
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
          if (formData.has('provincia_display')) { formData.delete('provincia_display'); }
          const idCpa57Val = document.getElementById('id_cpa57').value; const nomProvVal = document.getElementById('nom_prov').value;
          formData.set('id_cpa57', idCpa57Val || ''); formData.set('nom_prov', nomProvVal || '');
          formData.set('id_categoria_iva_cond_iva', document.getElementById('condicionIva').value || '');
          if (formData.has('condicionIva')) formData.delete('condicionIva');
          formData.set('tipo', document.getElementById('ingresosBrutos').value || '');
          if (formData.has('ingresosBrutos')) formData.delete('ingresosBrutos');

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

      document.getElementById('proveedorForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        let valido = true; let mensajes = [];
        camposContactoObligatorios.forEach(campoKey => {
            const input = document.getElementById(campoKey);
            if (input && input.value.trim() === "") {
                valido = false; const labelText = input.previousElementSibling?.textContent.replace('*', '').trim() || campoKey;
                mensajes.push(`El campo "${labelText}" (pestaña Home) es obligatorio.`); input.classList.add('is-invalid');
                const feedbackEl = document.getElementById(`${campoKey}-invalid`); if (feedbackEl) feedbackEl.textContent = `Este campo es obligatorio.`;
            } else if (input) { input.classList.remove('is-invalid'); const feedbackEl = document.getElementById(`${campoKey}-invalid`); if (feedbackEl) feedbackEl.textContent = "";}}
        );
        const cuitInputHTML = document.getElementById('n_cuit');
        if (cuitInputHTML && cuitInputHTML.value.trim() !== "") {
            const cuitPattern = /^\d{2}-\d{8}-\d{1}$/;
            if (!cuitPattern.test(cuitInputHTML.value.trim())) {
                valido = false; mensajes.push('El CUIT (pestaña Home) debe tener el formato XX-XXXXXXXX-X.');
                cuitInputHTML.classList.add('is-invalid'); const feedbackEl = document.getElementById('n_cuit-invalid'); if (feedbackEl) feedbackEl.textContent = 'Formato inválido. Ejemplo: 20-31441849-3';
            } else { if (cuitInputHTML.classList.contains('is-invalid')) { cuitInputHTML.classList.remove('is-invalid'); const feedbackEl = document.getElementById('n_cuit-invalid'); if (feedbackEl) feedbackEl.textContent = "";}}
        }

        // Validar documentos requeridos dinámicamente
        const requiredDocumentIds = getDynamicRequiredDocumentIds();
        let primerDocumentoFaltante = null;

        requiredDocumentIds.forEach(fileInputId => {
            const fileInput = document.getElementById(fileInputId);
            const documentCard = document.getElementById(`card-${fileInputId}`);
            const documentTitleElement = documentCard ? documentCard.querySelector('.document-title') : null;
            const documentName = documentTitleElement ? documentTitleElement.textContent.replace('*','').trim() : `Documento ${fileInputId}`;

            // Verificar si hay un archivo seleccionado localmente O si ya estaba cargado inicialmente (verificando initialData)
            const nuevoArchivoSeleccionado = fileInput && fileInput.files && fileInput.files.length > 0;
            const yaCargadoPreviamente = initialData[fileInputId] && initialData[fileInputId] !== ''; // initialData[fileInputId] guarda el nombre del archivo cargado inicialmente

            if (!nuevoArchivoSeleccionado && !yaCargadoPreviamente) {
                valido = false;
                mensajes.push(`El documento "${documentName}" (pestaña Documentos) es requerido.`);
                if (documentCard) { documentCard.classList.add('border', 'border-danger'); }
                if (!primerDocumentoFaltante) { primerDocumentoFaltante = fileInputId; }
            } else if (documentCard) {
                documentCard.classList.remove('border', 'border-danger');
            }
        });

        const msgDiv = document.getElementById('formMsg');
        if (!valido) {
            msgDiv.innerHTML = mensajes.join('<br>'); msgDiv.className = 'alert alert-danger mt-0 mb-3'; msgDiv.classList.remove('d-none');
            if (primerDocumentoFaltante && !mensajes.some(m => m.includes("pestaña Home"))) {
                const documentsTabButton = document.getElementById('documents-tab-btn');
                if (documentsTabButton) { new bootstrap.Tab(documentsTabButton).show(); }
            } return;
        } else { msgDiv.classList.add('d-none'); msgDiv.textContent = '';}
        const formDataToSave = gatherFormDataFromAllTabs(); const method = proveedorId ? 'PATCH' : 'POST';
        let url = proveedorId ? `/Proveedores/api/proveedores/${proveedorId}/` : `/Proveedores/api/proveedores/`;
        if (method === 'POST') { if (userId) formDataToSave.append('user', userId); if (codPais) formDataToSave.append('cod_pais', codPais); }
        msgDiv.textContent = 'Guardando datos...'; msgDiv.className = 'alert alert-info mt-0 mb-3'; msgDiv.classList.remove('d-none');
        document.querySelector('.btn-save').disabled = true;
        try {
          const resp = await fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('jwt'), 'X-CSRFToken': getCookie('csrftoken') }, body: formDataToSave });
          if (resp.ok) {
            const responseData = await resp.json();
            if (method === 'POST' && responseData.id) {
              proveedorId = responseData.id;
              if (responseData.cod_cpa01) { codCpa01Value = responseData.cod_cpa01; camposBloquear.forEach(keyToBlock => { const inputToBlock = document.getElementById(keyToBlock); if (inputToBlock && codCpa01Value && codCpa01Value.trim() !== "") { inputToBlock.disabled = true; }});}
              if (responseData.cod_pais) { codPais = responseData.cod_pais; }
            }
            // Actualizar initialData con los valores guardados (excluyendo archivos por ahora)
            for (const [key, value] of formDataToSave.entries()) {
              // No actualizamos initialData para archivos aquí, se maneja después
              if (value instanceof File) continue;

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
            initialData[document.getElementById('provincia').name || document.getElementById('provincia').id] = formDataToSave.get('nom_prov') || '';

            // Actualizar initialData y UI para archivos basándose en la respuesta del servidor
            const fileInputs = document.querySelectorAll('#documents-tab-pane .file-input');
            fileInputs.forEach(input => {
              if (input.id) {
                  const modelFieldName = fileInputIdToModelFieldName[input.id];
                  const docUrlFromServer = responseData[modelFieldName] || null; // Obtener la URL del archivo guardado desde la respuesta
                  const docNameFromServer = docUrlFromServer ? docUrlFromServer.split('/').pop() : null;

                  // Actualizar proveedorFileStates con la URL del archivo guardado
                  proveedorFileStates[modelFieldName] = docUrlFromServer;

                  // Actualizar initialData para el input de archivo con el nombre del archivo guardado
                  initialData[input.id] = docNameFromServer || '';

                  const esRequerido = getDynamicRequiredDocumentIds().includes(input.id); // Usar la función dinámica

                  actualizarUICardDocumento(input.id, docNameFromServer, docUrlFromServer, esRequerido);

                  input.value = ''; // Limpiar el input file después de la carga exitosa
              }
            });

            // Re-evaluar el estado de los switches de certificación después de actualizar los estados de archivo
             certificacionSwitches.forEach(s => {
                const switchElement = document.getElementById(s.id);
                const fileFieldName = s.name;
                 if (switchElement && proveedorFileStates.hasOwnProperty(fileFieldName)) {
                    // Sincronizar el estado del switch con si hay un archivo cargado
                    switchElement.checked = !!proveedorFileStates[fileFieldName];
                    // Sincronizar initialData con el estado final del switch
                    initialData[fileFieldName] = switchElement.checked ? 'S' : 'N';
                 }
             });


            msgDiv.textContent = 'Datos actualizados correctamente.'; msgDiv.className = 'alert alert-success mt-0 mb-3'; msgDiv.classList.remove('d-none');
            document.querySelector('.btn-save').style.display = 'none'; // Ocultar botón de guardar si no hay cambios
          } else {
            const errText = await resp.text(); let err; try { err = JSON.parse(errText); } catch (e) { err = errText; }
            let errorMessages = 'Error al guardar los datos.';
            if (typeof err === 'object' && err !== null) { errorMessages = Object.entries(err).map(([key, value]) => { const fieldLabel = camposPrincipalesEditables.find(c => c.key === key)?.label || document.querySelector(`label[for="${key}"]`)?.textContent.replace('*', '').trim() || key; return `${fieldLabel}: ${Array.isArray(value) ? value.join(', ') : value}`; }).join('<br>');
            } else if (typeof err === 'string') { errorMessages = err; }
            msgDiv.innerHTML = errorMessages; msgDiv.className = 'alert alert-danger mt-0 mb-3'; msgDiv.classList.remove('d-none');
          }
        } catch (error) {
          console.error("Error durante el guardado:", error); msgDiv.textContent = 'Error de red o problema al procesar la solicitud de guardado.';
          msgDiv.className = 'alert alert-danger mt-0 mb-3'; msgDiv.classList.remove('d-none');
        } finally { document.querySelector('.btn-save').disabled = false; }
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

      cargarDatos(); // Iniciar la carga de datos al cargar la página

      // Listener para inputs de archivo
      document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function() {
          const fileInputId = this.id;
          const file = this.files[0];
          const fileName = file ? file.name : null;
          const esRequerido = getDynamicRequiredDocumentIds().includes(fileInputId); // Usar la función dinámica

          // Actualizar UI inmediatamente con info del archivo local (sin URL aún)
          // La URL se obtendrá y actualizará en proveedorFileStates después de un guardado exitoso
          actualizarUICardDocumento(fileInputId, fileName, null, esRequerido);

          if (file) {
              const maxFileSize = 5 * 1024 * 1024;
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

      $('#messages-tab-btn').on('shown.bs.tab', function () {
        cargarContactos();
      });

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
          cargarContactos();

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
            if (response.status !== 204) {
                const errorData = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${errorData || response.statusText}`);
            }
          }

          mostrarMensajeGlobal(mensajesStatusDiv, 'Contacto eliminado correctamente.', 'success');
          cargarContactos();

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

    // Funciones globales (o que necesitan serlo)
    function logout() { sessionStorage.removeItem('jwt'); window.location.href = '/Proveedores/acceder/'; }
    function goToDashboard() { window.location.href = '/Proveedores/dashboard/'; }

    // Modificada para ser llamada por los botones de acción y el botón de reemplazar
    function triggerUpload(fileInputId) {
        const fileInput = document.getElementById(fileInputId);
        if (fileInput) {
            fileInput.click();
        } else {
            console.error(`Input de archivo con ID "${fileInputId}" no encontrado.`);
        }
    }

    // Function to display document in modal
    // Ahora recibe el fileInputId para saber qué documento se está viendo
    function viewDocument(path, fileInputId) {
      const documentViewerModal = new bootstrap.Modal(document.getElementById('documentViewerModal'));
      const documentViewerModalBody = document.getElementById('documentViewerModalBody');
      const btnReplaceDocument = document.getElementById('btnReplaceDocument');

      // Almacenar el fileInputId en el botón de reemplazar para usarlo después
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
          // Si es un archivo local, no mostramos el botón de reemplazar en el modal de visualización
          btnReplaceDocument.style.display = 'none';
          return; // No mostrar el modal si es un archivo local
      }
      else {
          alert('El documento aún no ha sido cargado o no hay una URL válida. Intente guardar los cambios primero.');
          // Si no hay archivo cargado, no mostramos el botón de reemplazar
          btnReplaceDocument.style.display = 'none';
          return; // No mostrar el modal si no hay archivo
      }

      // Mostrar el botón de reemplazar solo si hay un documento cargado (URL válida)
      btnReplaceDocument.style.display = (path && path !== '#' && !path.startsWith('blob:')) ? 'block' : 'none';
    }

    // Listener para el botón "Reemplazar Documento" en el modal
    document.getElementById('btnReplaceDocument').addEventListener('click', function() {
        const fileInputId = this.getAttribute('data-file-input-id');
        if (fileInputId) {
            // Ocultar el modal de visualización antes de abrir el selector de archivos
            const documentViewerModal = bootstrap.Modal.getInstance(document.getElementById('documentViewerModal'));
            if (documentViewerModal) {
                documentViewerModal.hide();
            }
            // Disparar la carga del archivo correspondiente
            triggerUpload(fileInputId);
        } else {
            console.error('No se pudo determinar el input de archivo para reemplazar.');
        }
    });
