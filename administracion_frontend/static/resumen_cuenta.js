$(document).ready(function() {
    // Seleccionar todos los elementos del DOM que vamos a manipular
    const loadingMessage = $('#loading-message');
    const errorMessage = $('#error-message');
    const noDataMessage = $('#no-data-message');
    const resumenCuentaTable = $('#resumenCuentaTable');
    const tableContainer = $('.table-responsive'); // Contenedor que envuelve la tabla

    // Obtener el token JWT de la sesión del navegador
    const jwt = sessionStorage.getItem('jwt');

    // Si no hay token, el usuario no está autenticado. Redirigir al login.
    if (!jwt) {
      alert('Debe iniciar sesión para acceder a esta página.');
      window.location.href = '/Proveedores/acceder/';
      return; // Detener la ejecución del script
    }

    // --- Estado inicial de la interfaz ---
    // Mostrar el mensaje de "cargando" y ocultar todo lo demás
    loadingMessage.show();
    errorMessage.hide();
    noDataMessage.hide();
    tableContainer.hide();

    // --- Funciones para obtener User ID y cambiar conexión (copiadas de mis_datos.js) ---

    async function obtenerUserId() {
        const JW_TOKEN = sessionStorage.getItem('jwt');
        if (!JW_TOKEN) {
            console.warn('No se encontró JWT en sessionStorage. Redirigiendo a la página de acceso.');
            // Redirection is handled at the start of $(document).ready, but good to have this check
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
          // Assuming network errors might indicate session issues, redirect
          sessionStorage.removeItem('jwt');
          window.location.href = '/Proveedores/acceder/';
          return null;
        }
    }

    async function cambiarConexion(pais) {
        if (!pais) {
            console.warn("No se proporcionó código de país para cambiar la conexión.");
            return;
        }
        try {
            const resp = await fetch('/Proveedores/api/cambiar-conexion/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('jwt'),
                    'X-CSRFToken': getCookie('csrftoken') // Assuming getCookie is available or defined elsewhere
                },
                body: JSON.stringify({ cod_pais: pais })
            });
            if (!resp.ok) {
                console.error('Error al cambiar la conexión de país:', await resp.text());
                // Decide how to handle this error - maybe show a message or prevent loading data
                errorMessage.text('Error al establecer la conexión de país. Los datos podrían no ser correctos.');
                errorMessage.show();
            } else {
                console.log('Conexión de país cambiada a:', pais);
                // Connection successful, hide any previous connection error message
                 if (errorMessage.text().includes('conexión de país')) {
                     errorMessage.hide();
                 }
            }
        } catch (error) {
            console.error('Network error al cambiar la conexión de país:', error);
            errorMessage.text('Error de red al intentar establecer la conexión de país.');
            errorMessage.show();
        }
    }

    // Helper function to get CSRF token (assuming it's needed for POST requests)
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


    // --- Nueva función para cargar los datos del proveedor ---
    async function fetchProveedorData(userId) {
        try {
            const resp = await fetch('/Proveedores/api/proveedores/' + userId + '/', {
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('jwt') }
            });
            if (!resp.ok) {
                if (resp.status === 404) {
                    console.warn('No se encontraron datos de proveedor para el usuario.');
                    errorMessage.text('No se encontraron datos de proveedor asociados a su usuario.');
                    errorMessage.show();
                } else {
                    console.error('Error al cargar datos del proveedor: ' + resp.statusText, resp.status);
                    errorMessage.text(`Error al cargar datos del proveedor (${resp.status}). Por favor, intente más tarde.`);
                    errorMessage.show();
                }
                return null; // Return null if data fetching failed
            }
            const proveedor = await resp.json();
            console.log('Datos del proveedor cargados:', proveedor);
            return proveedor; // Return the fetched data
        } catch (error) {
            console.error('Error de red durante la carga de datos del proveedor:', error);
            errorMessage.text('Error de red al cargar los datos del proveedor.');
            errorMessage.show();
            return null; // Return null on network error
        }
    }

    // --- Función principal para cargar el resumen de cuenta ---
    async function loadResumenCuenta() {
        // --- Petición al API para obtener los datos del resumen ---
        fetch('/Proveedores/api/proveedores/resumen-cuenta/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + jwt,
            }
        })
        .then(response => {
            // --- Manejo de la respuesta HTTP ---
            // Si la respuesta no es exitosa (ej: 401, 403, 500)
            if (!response.ok) {
                // Si el error es de autenticación o autorización, redirigir al login
                if (response.status === 401 || response.status === 403) {
                     alert('Su sesión ha expirado o no está autorizado. Por favor, inicie sesión nuevamente.');
                     window.location.href = '/Proveedores/acceder/';
                     // Lanzar un error para que no continúe el ".then()"
                     throw new Error('Unauthorized or Forbidden');
                }
                // Para otros errores, intentar leer el cuerpo de la respuesta para un mensaje más detallado
                return response.json().then(errorData => {
                     let mensajes = [];
                     if (typeof errorData === 'object' && errorData !== null) {
                         for (const key in errorData) {
                             mensajes.push(`${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key]}`);
                         }
                     } else {
                         mensajes.push(`Error: ${response.status} ${response.statusText}`);
                     }
                     throw new Error('Error al cargar resumen: ' + mensajes.join('\n'));
                }).catch(() => {
                     // Si falla la lectura del JSON del error, usar el texto de estado HTTP
                     throw new Error(`Error al cargar resumen: ${response.status} ${response.statusText}`);
                });
            }
            // Si la respuesta es exitosa (2xx), parsear el JSON
            return response.json();
        })
        .then(result => {
            // --- Procesamiento de los datos recibidos ---
            loadingMessage.hide();

            // Comprobar si el API devolvió datos en el formato esperado { data: [...], columns: [...] }
            if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                // --- Caso 1: Hay datos para mostrar ---
                noDataMessage.hide();
                errorMessage.hide();

                // --- INICIO DE MODIFICACIONES (Existente) ---

                // 1. Calcular el total del campo "Importe"
                const importeColumnIndex = result.columns.findIndex(col => col.data === 'Importe');
                let totalImporte = 0;

                if (importeColumnIndex !== -1) {
                    result.data.forEach(row => {
                        // El dato puede venir en un array o en un objeto, nos aseguramos que funcione para ambos
                        const importeStr = Array.isArray(row) ? row[importeColumnIndex] : row.Importe;
                        if (importeStr) {
                            // Convertir el formato "1.234.567,89" a un número 1234567.89
                            const importeNum = parseFloat(importeStr.replace(/\./g, '').replace(',', '.'));
                            if (!isNaN(importeNum)) {
                                totalImporte += importeNum;
                            }
                        }
                    });
                }

                // Formatear el total al estilo moneda y mostrarlo
                const formattedTotal = totalImporte.toLocaleString('es-AR', {
                    style: 'currency',
                    currency: 'ARS', // Esto agregará el símbolo '$' para el localismo es-AR
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                $('#total-importe').text(formattedTotal);


                // 2. Definir las reglas de estilo para la columna "Importe"
                const columnDefs = [{
                    targets: importeColumnIndex,
                    createdCell: function (td, cellData, rowData, row, col) {
                        if (cellData) {
                            // Convertir el dato de la celda a número para la comparación
                            const valor = parseFloat(cellData.replace(/\./g, '').replace(',', '.'));
                            if (!isNaN(valor)) {
                                if (valor > 0) {
                                    $(td).css('font-weight', 'bold');
                                } else if (valor < 0) {
                                    $(td).css('color', 'red');
                                }
                            }
                        }
                    }
                }];

                // --- FIN DE MODIFICACIONES ---

                tableContainer.show(); // Mostrar el contenedor de la tabla

                // Destruir cualquier instancia previa de DataTables en este elemento
                // Esto es crucial para evitar errores al recargar datos
                if ($.fn.DataTable.isDataTable('#resumenCuentaTable')) {
                    resumenCuentaTable.DataTable().destroy();
                    // Limpiar el contenido HTML de la tabla para evitar duplicados
                    resumenCuentaTable.empty();
                }

                // Inicializar DataTables con la configuración recibida del API
                resumenCuentaTable.DataTable({
                    data: result.data,       // Array de objetos con los datos de las filas
                    columns: result.columns, // Array de objetos que define las columnas
                    columnDefs: columnDefs,  // <-- Aplicar las reglas de estilo
                    order: [], // <-- MODIFICACIÓN: Evita el ordenamiento inicial automático.
                    language: {
                        // Usar el plugin de traducción al español para DataTables
                        url: '//cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
                    },
                    responsive: true, // Habilitar diseño responsivo para móviles
                });

            } else {
                // --- Caso 2: No hay datos ---
                // Ocultar el contenedor de la tabla y mostrar el mensaje informativo
                tableContainer.hide();
                noDataMessage.show();
            }
        })
        .catch(error => {
            // --- Manejo de errores de la petición (ej. red caída, error lanzado) ---
            loadingMessage.hide();
            // No mostrar el mensaje si el error fue de redirección (401/403)
            if (error.message !== 'Unauthorized or Forbidden') {
                 tableContainer.hide();
                 noDataMessage.hide();
                 errorMessage.text('Error al cargar el resumen de cuenta: ' + error.message);
                 errorMessage.show();
                 console.error("Error fetching resumen cuenta:", error);
            }
        });
    }

    // --- Nueva función de inicialización que incluye la lógica de conexión ---
    async function initializePage() {
        const userId = await obtenerUserId();

        if (!userId) {
            // Redirection already handled in obtenerUserId if JWT is missing or invalid
            loadingMessage.hide();
            errorMessage.text('No se pudo obtener el ID de usuario. Por favor, intente iniciar sesión nuevamente.');
            errorMessage.show();
            return; // Stop execution
        }

        const proveedorData = await fetchProveedorData(userId);

        if (!proveedorData) {
             // Error message already shown in fetchProveedorData
             loadingMessage.hide();
             return; // Stop execution if supplier data could not be fetched
        }

        const codPais = proveedorData.cod_pais;

        if (codPais) {
            await cambiarConexion(codPais);
        } else {
            console.warn("Código de país (cod_pais) no encontrado en los datos del proveedor. Usando conexión por defecto.");
            // Optionally show a warning message to the user
            // errorMessage.text('Advertencia: Código de país no encontrado. Los datos mostrados podrían no ser correctos.');
            // errorMessage.show();
        }

        // Now that the connection is potentially changed, load the account summary
        loadResumenCuenta();
    }

    // Iniciar el proceso de inicialización y carga de datos
    initializePage();

    // Función auxiliar para el botón de "Volver" (si es que existe uno con este llamado)
    function goToDashboard() {
      window.location.href = '/Proveedores/dashboard/';
    }
});
