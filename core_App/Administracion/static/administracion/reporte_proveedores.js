/**
 * reporte_proveedores.js
 * Maneja la lógica del reporte de proveedores con comprobantes recibidos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    const searchProveedorInput = document.getElementById('searchProveedor');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const resumenSection = document.getElementById('resumenSection');
    const resultadosSection = document.getElementById('resultadosSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const proveedoresTableBody = document.getElementById('proveedoresTableBody');
    const totalProveedoresEl = document.getElementById('totalProveedores');
    const totalComprobantesEl = document.getElementById('totalComprobantes');
    const periodoTextoEl = document.getElementById('periodoTexto');

    // Restaurar filtros guardados o inicializar por defecto
    restaurarFiltros();

    // Event listeners
    btnBuscar.addEventListener('click', cargarProveedores);
    btnLimpiar.addEventListener('click', limpiarFiltros);
    
    // Permitir buscar con Enter en el campo de búsqueda
    searchProveedorInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cargarProveedores();
        }
    });

    // Cargar datos iniciales
    cargarProveedores();
    
    /**
     * Restaura los filtros desde sessionStorage o establece valores por defecto
     */
    function restaurarFiltros() {
        const filtrosGuardados = sessionStorage.getItem('reporte_proveedores_filtros');
        
        if (filtrosGuardados) {
            try {
                const filtros = JSON.parse(filtrosGuardados);
                fechaDesdeInput.value = filtros.fechaDesde || '';
                fechaHastaInput.value = filtros.fechaHasta || '';
                searchProveedorInput.value = filtros.search || '';
            } catch (e) {
                console.error('Error al restaurar filtros:', e);
                establecerFiltrosPorDefecto();
            }
        } else {
            establecerFiltrosPorDefecto();
        }
    }
    
    /**
     * Establece los filtros por defecto (último mes)
     */
    function establecerFiltrosPorDefecto() {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(haceUnMes.getMonth() - 1);
        
        fechaHastaInput.value = formatDate(hoy);
        fechaDesdeInput.value = formatDate(haceUnMes);
        searchProveedorInput.value = '';
    }
    
    /**
     * Guarda los filtros actuales en sessionStorage
     */
    function guardarFiltros() {
        const filtros = {
            fechaDesde: fechaDesdeInput.value,
            fechaHasta: fechaHastaInput.value,
            search: searchProveedorInput.value
        };
        sessionStorage.setItem('reporte_proveedores_filtros', JSON.stringify(filtros));
    }

    /**
     * Formatea una fecha a YYYY-MM-DD
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Formatea una fecha de YYYY-MM-DD a DD/MM/YYYY
     */
    function formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    /**
     * Muestra un mensaje de error
     */
    function mostrarError(mensaje) {
        errorText.textContent = mensaje;
        errorMessage.classList.remove('d-none');
        setTimeout(() => {
            errorMessage.classList.add('d-none');
        }, 5000);
    }

    /**
     * Oculta el mensaje de error
     */
    function ocultarError() {
        errorMessage.classList.add('d-none');
    }

    /**
     * Muestra el indicador de carga
     */
    function mostrarCarga() {
        loadingIndicator.classList.remove('d-none');
        resultadosSection.classList.add('d-none');
        resumenSection.classList.add('d-none');
        ocultarError();
    }

    /**
     * Oculta el indicador de carga
     */
    function ocultarCarga() {
        loadingIndicator.classList.add('d-none');
    }

    /**
     * Limpia los filtros y recarga
     */
    function limpiarFiltros() {
        // Limpiar sessionStorage
        sessionStorage.removeItem('reporte_proveedores_filtros');
        
        // Establecer valores por defecto
        establecerFiltrosPorDefecto();
        
        // Recargar con filtros limpios
        cargarProveedores();
    }

    /**
     * Carga los proveedores desde la API
     */
    async function cargarProveedores() {
        mostrarCarga();
        
        // Guardar los filtros actuales en sessionStorage
        guardarFiltros();

        // Construir URL con parámetros
        const params = new URLSearchParams();
        
        if (fechaDesdeInput.value) {
            params.append('fecha_desde', fechaDesdeInput.value);
        }
        if (fechaHastaInput.value) {
            params.append('fecha_hasta', fechaHastaInput.value);
        }
        if (searchProveedorInput.value.trim()) {
            params.append('search', searchProveedorInput.value.trim());
        }

        try {
            const response = await fetch(`/administracion/api/proveedores-comprobantes/?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error desconocido al cargar proveedores');
            }

            // Renderizar resultados
            renderizarProveedores(data.data, data.filters);

        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            mostrarError(`Error al cargar los datos: ${error.message}`);
        } finally {
            ocultarCarga();
        }
    }

    /**
     * Renderiza la tabla de proveedores
     */
    function renderizarProveedores(proveedores, filters) {
        // Limpiar tabla
        proveedoresTableBody.innerHTML = '';

        // Si no hay resultados
        if (proveedores.length === 0) {
            noResultsMessage.classList.remove('d-none');
            resultadosSection.classList.add('d-none');
            resumenSection.classList.add('d-none');
            return;
        }

        noResultsMessage.classList.add('d-none');
        resultadosSection.classList.remove('d-none');
        resumenSection.classList.remove('d-none');

        // Calcular totales
        const totalProveedores = proveedores.length;
        const totalComprobantes = proveedores.reduce((sum, p) => sum + p.total_comprobantes_recibidos, 0);

        // Actualizar resumen
        totalProveedoresEl.textContent = totalProveedores;
        totalComprobantesEl.textContent = totalComprobantes;

        // Actualizar período
        if (filters.fecha_desde && filters.fecha_hasta) {
            periodoTextoEl.textContent = `${formatDateDisplay(filters.fecha_desde)} - ${formatDateDisplay(filters.fecha_hasta)}`;
        } else if (filters.fecha_desde) {
            periodoTextoEl.textContent = `Desde ${formatDateDisplay(filters.fecha_desde)}`;
        } else if (filters.fecha_hasta) {
            periodoTextoEl.textContent = `Hasta ${formatDateDisplay(filters.fecha_hasta)}`;
        } else {
            periodoTextoEl.textContent = 'Sin filtro de fechas';
        }

        // Renderizar filas
        proveedores.forEach(proveedor => {
            const row = document.createElement('tr');
            
            // Determinar clase según cantidad de comprobantes
            let badgeClass = 'bg-secondary';
            if (proveedor.total_comprobantes_recibidos > 10) {
                badgeClass = 'bg-danger';
            } else if (proveedor.total_comprobantes_recibidos > 5) {
                badgeClass = 'bg-warning';
            } else if (proveedor.total_comprobantes_recibidos > 0) {
                badgeClass = 'bg-success';
            }

            row.innerHTML = `
                <td><strong>${escapeHtml(proveedor.cod_cpa01 || '-')}</strong></td>
                <td>${escapeHtml(proveedor.nom_provee)}</td>
                <td><span class="badge bg-primary">${escapeHtml(proveedor.username || '-')}</span></td>
                <td class="text-center">
                    <span class="badge ${badgeClass} fs-6">
                        ${proveedor.total_comprobantes_recibidos}
                    </span>
                </td>
                <td class="text-center">
                    <button 
                        class="btn btn-sm btn-primary btn-ver-comprobantes" 
                        data-proveedor-id="${proveedor.id}"
                        data-proveedor-nombre="${escapeHtml(proveedor.nom_provee)}"
                        ${proveedor.total_comprobantes_recibidos === 0 ? 'disabled' : ''}
                    >
                        <i class="bi bi-file-earmark-text"></i> Ver Comprobantes
                    </button>
                </td>
            `;

            proveedoresTableBody.appendChild(row);
        });

        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-ver-comprobantes').forEach(btn => {
            btn.addEventListener('click', function() {
                const proveedorId = this.getAttribute('data-proveedor-id');
                verComprobantesProveedor(proveedorId);
            });
        });
    }

    /**
     * Redirige a la página de comprobantes del proveedor
     */
    function verComprobantesProveedor(proveedorId) {
        // Obtener fechas actuales de los filtros
        const fechaDesde = fechaDesdeInput.value;
        const fechaHasta = fechaHastaInput.value;
        
        // Construir URL con parámetros
        let url = `/administracion/comprobantes-proveedor/?proveedor_id=${proveedorId}`;
        if (fechaDesde) {
            url += `&fecha_desde=${fechaDesde}`;
        }
        if (fechaHasta) {
            url += `&fecha_hasta=${fechaHasta}`;
        }
        
        window.location.href = url;
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
});
