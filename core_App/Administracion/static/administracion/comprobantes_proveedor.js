/**
 * comprobantes_proveedor.js
 * Maneja la lógica de visualización y gestión de comprobantes filtrados por proveedor
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const infoSection = document.getElementById('infoSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const comprobantesTableBody = document.getElementById('comprobantesTableBody');
    const checkboxSelectAll = document.getElementById('checkboxSelectAll');
    const btnCambiarEstado = document.getElementById('btnCambiarEstado');
    const btnEliminar = document.getElementById('btnEliminar');
    
    // Modales
    const modalCambiarEstado = new bootstrap.Modal(document.getElementById('modalCambiarEstado'));
    const modalConfirmarEliminar = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
    
    // Variables globales
    let comprobantesData = [];
    let proveedorData = null;
    let comprobantesSeleccionados = new Set();
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const proveedorId = urlParams.get('proveedor_id');
    const fechaDesde = urlParams.get('fecha_desde') || '';
    const fechaHasta = urlParams.get('fecha_hasta') || '';
    
    // Validar que tengamos el ID del proveedor
    if (!proveedorId) {
        mostrarError('No se especificó el ID del proveedor');
        return;
    }
    
    // Event listeners
    checkboxSelectAll.addEventListener('change', toggleSelectAll);
    btnCambiarEstado.addEventListener('click', mostrarModalCambiarEstado);
    btnEliminar.addEventListener('click', mostrarModalEliminar);
    document.getElementById('btnConfirmarCambioEstado').addEventListener('click', confirmarCambioEstado);
    document.getElementById('btnConfirmarEliminar').addEventListener('click', confirmarEliminar);
    
    // Cargar datos iniciales
    cargarComprobantes();
    
    /**
     * Muestra un mensaje de error
     */
    function mostrarError(mensaje) {
        errorText.textContent = mensaje;
        errorMessage.classList.remove('d-none');
        loadingIndicator.classList.add('d-none');
        infoSection.classList.add('d-none');
    }
    
    /**
     * Oculta el mensaje de error
     */
    function ocultarError() {
        errorMessage.classList.add('d-none');
    }
    
    /**
     * Formatea una fecha de YYYY-MM-DD a DD/MM/YYYY
     */
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    
    /**
     * Formatea un número como moneda
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }
    
    /**
     * Carga los comprobantes desde la API
     */
    async function cargarComprobantes() {
        loadingIndicator.classList.remove('d-none');
        ocultarError();
        
        // Construir URL con parámetros
        let url = `/administracion/api/comprobantes-proveedor-filtrados/?proveedor_id=${proveedorId}`;
        if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
        if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Error desconocido al cargar comprobantes');
            }
            
            // Guardar datos
            comprobantesData = data.data;
            proveedorData = data.proveedor;
            
            // Renderizar
            renderizarInfo(data);
            renderizarComprobantes(data.data);
            
        } catch (error) {
            console.error('Error al cargar comprobantes:', error);
            mostrarError(`Error al cargar los datos: ${error.message}`);
        } finally {
            loadingIndicator.classList.add('d-none');
        }
    }
    
    /**
     * Renderiza la información del proveedor y período
     */
    function renderizarInfo(data) {
        document.getElementById('proveedorNombre').textContent = data.proveedor.nom_provee;
        document.getElementById('proveedorCodigo').textContent = data.proveedor.cod_cpa01 || '-';
        document.getElementById('proveedorCuit').textContent = data.proveedor.n_cuit || '-';
        
        document.getElementById('fechaDesdeDisplay').textContent = formatDate(data.filters.fecha_desde);
        document.getElementById('fechaHastaDisplay').textContent = formatDate(data.filters.fecha_hasta);
        
        infoSection.classList.remove('d-none');
    }
    
    /**
     * Renderiza la tabla de comprobantes
     */
    function renderizarComprobantes(comprobantes) {
        comprobantesTableBody.innerHTML = '';
        comprobantesSeleccionados.clear();
        checkboxSelectAll.checked = false;
        actualizarBotones();
        
        if (comprobantes.length === 0) {
            noResultsMessage.classList.remove('d-none');
            document.querySelector('.card.shadow-sm').classList.add('d-none');
            document.getElementById('totalComprobantes').textContent = '0';
            document.getElementById('montoTotal').textContent = '$0.00';
            return;
        }
        
        noResultsMessage.classList.add('d-none');
        document.querySelector('.card.shadow-sm').classList.remove('d-none');
        
        // Calcular totales
        const totalComprobantes = comprobantes.length;
        const montoTotal = comprobantes.reduce((sum, c) => sum + parseFloat(c.monto_total || 0), 0);
        
        document.getElementById('totalComprobantes').textContent = totalComprobantes;
        document.getElementById('montoTotal').textContent = formatCurrency(montoTotal);
        
        // Renderizar filas
        comprobantes.forEach(comprobante => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', comprobante.id);
            
            const archivoNombre = comprobante.archivo ? comprobante.archivo.split('/').pop() : '-';
            const archivoUrl = comprobante.archivo || '#';
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input checkbox-comprobante" data-id="${comprobante.id}">
                </td>
                <td>${escapeHtml(comprobante.tipo)}</td>
                <td><strong>${escapeHtml(comprobante.numero)}</strong></td>
                <td>${formatDate(comprobante.fecha_emision)}</td>
                <td>${formatCurrency(comprobante.monto_total)}</td>
                <td>${escapeHtml(comprobante.Num_Oc || '-')}</td>
                <td><span class="badge bg-success">${escapeHtml(comprobante.estado)}</span></td>
                <td class="text-center">
                    ${comprobante.archivo ? `<a href="${archivoUrl}" target="_blank" class="btn btn-sm btn-outline-primary" title="Ver archivo">
                        <i class="bi bi-file-earmark-pdf"></i>
                    </a>` : '-'}
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger btn-eliminar-uno" data-id="${comprobante.id}" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            
            comprobantesTableBody.appendChild(row);
        });
        
        // Agregar event listeners a checkboxes individuales
        document.querySelectorAll('.checkbox-comprobante').forEach(cb => {
            cb.addEventListener('change', handleCheckboxChange);
        });
        
        // Agregar event listeners a botones de eliminar individual
        document.querySelectorAll('.btn-eliminar-uno').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                comprobantesSeleccionados.clear();
                comprobantesSeleccionados.add(id);
                mostrarModalEliminar();
            });
        });
    }
    
    /**
     * Maneja el cambio de estado de un checkbox individual
     */
    function handleCheckboxChange(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        if (e.target.checked) {
            comprobantesSeleccionados.add(id);
        } else {
            comprobantesSeleccionados.delete(id);
        }
        actualizarBotones();
        actualizarSelectAll();
    }
    
    /**
     * Selecciona o deselecciona todos los checkboxes
     */
    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.checkbox-comprobante');
        checkboxes.forEach(cb => {
            cb.checked = checkboxSelectAll.checked;
            const id = parseInt(cb.getAttribute('data-id'));
            if (checkboxSelectAll.checked) {
                comprobantesSeleccionados.add(id);
            } else {
                comprobantesSeleccionados.delete(id);
            }
        });
        actualizarBotones();
    }
    
    /**
     * Actualiza el estado del checkbox "seleccionar todos"
     */
    function actualizarSelectAll() {
        const checkboxes = document.querySelectorAll('.checkbox-comprobante');
        const todosSeleccionados = Array.from(checkboxes).every(cb => cb.checked);
        checkboxSelectAll.checked = todosSeleccionados;
    }
    
    /**
     * Actualiza el estado de los botones según la selección
     */
    function actualizarBotones() {
        const haySeleccion = comprobantesSeleccionados.size > 0;
        btnCambiarEstado.disabled = !haySeleccion;
        btnEliminar.disabled = !haySeleccion;
    }
    
    /**
     * Muestra el modal para cambiar estado
     */
    function mostrarModalCambiarEstado() {
        document.getElementById('cantidadSeleccionados').textContent = comprobantesSeleccionados.size;
        document.getElementById('nuevoEstado').value = 'Aceptado';
        document.getElementById('observacion').value = '';
        modalCambiarEstado.show();
    }
    
    /**
     * Confirma el cambio de estado
     */
    async function confirmarCambioEstado() {
        const nuevoEstado = document.getElementById('nuevoEstado').value;
        const observacion = document.getElementById('observacion').value;
        
        modalCambiarEstado.hide();
        loadingIndicator.classList.remove('d-none');
        
        try {
            // Cambiar estado de cada comprobante seleccionado
            for (const id of comprobantesSeleccionados) {
                await cambiarEstadoComprobante(id, nuevoEstado, observacion);
            }
            
            // Recargar comprobantes
            await cargarComprobantes();
            mostrarMensajeExito(`Estado cambiado exitosamente para ${comprobantesSeleccionados.size} comprobante(s)`);
            
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            mostrarError(`Error al cambiar estado: ${error.message}`);
        }
    }
    
    /**
     * Cambia el estado de un comprobante
     */
    async function cambiarEstadoComprobante(id, estado, observacion) {
        const formData = new FormData();
        formData.append('estado', estado);
        if (observacion) {
            formData.append('observacion', observacion);
        }
        
        const response = await fetch(`/administracion/api/comprobantes/${id}/?proveedor_id=${proveedorId}`, {
            method: 'PATCH',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken') || ''
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al cambiar estado del comprobante ${id}`);
        }
        
        return response.json();
    }
    
    /**
     * Muestra el modal de confirmación de eliminación
     */
    function mostrarModalEliminar() {
        document.getElementById('cantidadEliminar').textContent = comprobantesSeleccionados.size;
        modalConfirmarEliminar.show();
    }
    
    /**
     * Confirma la eliminación de comprobantes
     */
    async function confirmarEliminar() {
        modalConfirmarEliminar.hide();
        loadingIndicator.classList.remove('d-none');
        
        try {
            // Eliminar cada comprobante seleccionado
            for (const id of comprobantesSeleccionados) {
                await eliminarComprobante(id);
            }
            
            // Recargar comprobantes
            await cargarComprobantes();
            mostrarMensajeExito(`${comprobantesSeleccionados.size} comprobante(s) eliminado(s) exitosamente`);
            
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarError(`Error al eliminar: ${error.message}`);
        }
    }
    
    /**
     * Elimina un comprobante
     */
    async function eliminarComprobante(id) {
        const response = await fetch(`/administracion/api/comprobantes/${id}/?proveedor_id=${proveedorId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken') || ''
            }
        });
        
        if (!response.ok && response.status !== 204) {
            throw new Error(`Error al eliminar comprobante ${id}`);
        }
    }
    
    /**
     * Muestra un mensaje de éxito temporal
     */
    function mostrarMensajeExito(mensaje) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <i class="bi bi-check-circle"></i> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').insertBefore(alert, document.querySelector('.container').firstChild);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
    
    /**
     * Obtiene una cookie por nombre
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
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
