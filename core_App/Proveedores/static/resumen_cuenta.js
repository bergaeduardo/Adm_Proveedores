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

    // --- Petición al API para obtener los datos ---
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
            
            // --- INICIO DE MODIFICACIONES ---

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
});

// Función auxiliar para el botón de "Volver" (si es que existe uno con este llamado)
function goToDashboard() {
  window.location.href = '/Proveedores/dashboard/';
}