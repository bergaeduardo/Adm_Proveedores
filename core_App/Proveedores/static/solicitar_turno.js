let ocItems = [];
let remitosList = [];
let bultosList = [];
let selectedFiles = []; // Array de objetos {file, type}

document.addEventListener('DOMContentLoaded', () => {
    loadOCs();
    setupEventListeners();
});

let allOCs = []; // Guardamos todas las OCs para filtrar

async function loadOCs() {
    try {
        const response = await fetch('/Proveedores/api/ordenes-compra/', {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('jwt')}` }
        });
        allOCs = await response.json();
        if (Array.isArray(allOCs)) {
            renderOCList(allOCs);
        } else {
            console.error('Respuesta inválida del servidor:', allOCs);
            renderOCList([]);
        }
    } catch (error) {
        console.error('Error al cargar OCs:', error);
    }
}

function renderOCList(ocs) {
    const list = document.getElementById('oc-checkbox-list');
    list.innerHTML = ocs.map(oc => {
        const fecha = oc.fecha_emision ? oc.fecha_emision.split('-').reverse().join('/') : 'Sin fecha';
        return `
            <div class="oc-checkbox-item" onclick="event.target.tagName !== 'INPUT' && toggleOC('${oc.nro_orden_co}')">
                <input type="checkbox" id="check-${oc.nro_orden_co}" value="${oc.nro_orden_co}" onchange="handleOCSelectionChange()" onclick="event.stopPropagation()">
                <label for="check-${oc.nro_orden_co}" onclick="event.stopPropagation()">
                    ${oc.nro_orden_co}
                    <span class="oc-date" style="display:block; margin-top: 2px;">FECHA: ${fecha}</span>
                </label>
            </div>
        `;
    }).join('');
    
    if (ocs.length === 0) {
        list.innerHTML = '<div style="padding: 1rem; text-align: center; color: #94a3b8; font-size: 0.75rem;">No se encontraron órdenes pendientes</div>';
    }
}

function filterOCs() {
    const term = document.getElementById('oc-search').value.toLowerCase();
    const filtered = allOCs.filter(oc => oc.nro_orden_co.toLowerCase().includes(term));
    renderOCList(filtered);
}

function toggleOC(nroOc) {
    const check = document.getElementById(`check-${nroOc}`);
    if (check) {
        check.checked = !check.checked;
        handleOCSelectionChange();
    }
}

async function handleOCSelectionChange() {
    const selected = Array.from(document.querySelectorAll('#oc-checkbox-list input:checked')).map(i => i.value);
    if (selected.length > 0) {
        loadItems(selected.join(','));
    } else {
        document.getElementById('items-section').style.display = 'none';
        ocItems = [];
        checkStep2();
    }
}

function setupEventListeners() {
    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora');
    const form = document.getElementById('turno-form');

    fechaInput.addEventListener('change', () => {
        if (fechaInput.value) {
            const dateVal = new Date(fechaInput.value + 'T00:00:00');
            if (dateVal.getDay() === 0) { // 0 es Domingo
                Swal.fire({
                    title: 'Día No Laborable',
                    text: 'Los días Domingo no se trabaja. Por favor, seleccione otro día.',
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#0f172a'
                });
                fechaInput.value = '';
                horaInput.innerHTML = '<option value="">Seleccione una fecha primero...</option>';
                horaInput.disabled = true;
                checkStep1();
                return;
            }
        }
        loadAvailableSlots();
        checkStep1();
    });
    horaInput.addEventListener('change', checkStep1);
    form.addEventListener('submit', handleSubmit);
}

async function loadAvailableSlots() {
    const fecha = document.getElementById('fecha').value;
    const horaSelect = document.getElementById('hora');
    
    if (!fecha) {
        horaSelect.innerHTML = '<option value="">Seleccione una fecha primero...</option>';
        horaSelect.disabled = true;
        return;
    }

    horaSelect.innerHTML = '<option value="">Cargando horarios...</option>';
    horaSelect.disabled = true;

    try {
        const response = await fetch(`/Proveedores/api/turnos/horarios_disponibles/?fecha=${fecha}`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('jwt')}` }
        });
        const slots = await response.json();
        
        horaSelect.innerHTML = '<option value="">Seleccione hora...</option>';
        slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.hora;
            option.innerText = slot.hora + ' HS';
            if (!slot.disponible) {
                option.disabled = true;
                option.innerText += ' (Ocupado)';
                option.style.color = '#94a3b8';
                option.style.backgroundColor = '#f1f5f9';
            }
            horaSelect.appendChild(option);
        });
        horaSelect.disabled = false;
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        horaSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
    }
}

function nextStep(step) {
    // Hide all sections
    document.getElementById('section-1').style.display = 'none';
    document.getElementById('section-2').style.display = 'none';
    document.getElementById('section-3').style.display = 'none';

    // Show target section
    document.getElementById('section-' + step).style.display = 'block';

    // Update stepper
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + step).classList.add('active');
    
    lucide.createIcons();
}

function checkStep1() {
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    document.getElementById('btn-next-1').disabled = !(fecha && hora);
}

function checkStep2() {
    const selected = document.querySelectorAll('#oc-checkbox-list input:checked').length;
    const qtyInputs = document.querySelectorAll('.qty-input');
    let totalQty = 0;
    qtyInputs.forEach(input => totalQty += parseFloat(input.value) || 0);

    document.getElementById('btn-next-2').disabled = !(selected > 0 && totalQty > 0);
}

async function loadItems(ocs) {
    const itemsSection = document.getElementById('items-section');
    const itemsList = document.getElementById('items-list');
    
    itemsList.innerHTML = '<tr><td colspan="3" class="text-center">Cargando productos de las OCs...</td></tr>';
    itemsSection.style.display = 'block';

    try {
        const response = await fetch(`/Proveedores/api/ordenes-compra/${ocs}/items/`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('jwt')}` }
        });
        const data = await response.json();
        itemsList.innerHTML = '';
        
        if (!Array.isArray(data)) {
            itemsList.innerHTML = `<tr><td colspan="5" class="text-center text-red-500">${data.error || 'Error'}</td></tr>`;
            return;
        }

        ocItems = data;
        ocItems.forEach((item, index) => {
            const tr = document.createElement('tr');
            const yaEntregado = (item.cantidad_recibida_tango || 0) + (item.cantidad_reservada || 0);
            const aEntregarInicial = item.cantidad_pendiente; // Lo que sugerimos entregar
            
            tr.innerHTML = `
                <td style="padding: 1.25rem 1rem; vertical-align: top; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 0.813rem; font-weight: 700; margin: 0;">${item.cod_articulo}</p>
                    <p style="font-size: 0.688rem; color: #64748b; margin: 0;">${item.descripcion}</p>
                    <span style="font-size: 0.625rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">OC: ${item.nro_oc}</span>
                </td>
                <td class="text-center" style="padding: 1.25rem 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 0.813rem;">${item.cantidad_planificada}</td>
                <td class="text-center" style="padding: 1.25rem 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; color: #f59e0b; font-weight: 600; font-size: 0.813rem;">${yaEntregado}</td>
                <td class="text-center" style="padding: 1.25rem 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9;">
                    <input type="number" class="qty-input" data-index="${index}" 
                           min="0" max="${item.cantidad_pendiente}" 
                           value="${aEntregarInicial}" 
                           oninput="updateDynamicPending(${index}); checkStep2();"
                           style="width: 75px; text-align: right; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px;">
                </td>
                <td class="text-right" id="pending-cell-${index}" style="padding: 1.25rem 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; color: #2563eb; font-weight: 700; font-size: 0.813rem;">
                    0
                </td>
            `;
            itemsList.appendChild(tr);
        });
        checkStep2();
    } catch (error) {
        console.error(error);
        itemsList.innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Error de conexión</td></tr>';
    }
}

function updateDynamicPending(index) {
    const input = document.querySelector(`.qty-input[data-index="${index}"]`);
    const pendingCell = document.getElementById(`pending-cell-${index}`);
    if (!input || !pendingCell) return;

    const item = ocItems[index];
    const yaEntregado = (item.cantidad_recibida_tango || 0) + (item.cantidad_reservada || 0);
    const aEntregar = parseFloat(input.value) || 0;
    
    // Pendiente = Planificado - Entregado - A Entregar
    let pendiente = item.cantidad_planificada - yaEntregado - aEntregar;
    if (pendiente < 0) pendiente = 0;
    
    pendingCell.innerText = pendiente;
}


// LOGISTICS FUNCTIONS
function addRemito() {
    const input = document.getElementById('remito-input');
    const val = input.value.trim();
    if (val && !remitosList.includes(val)) {
        remitosList.push(val);
        input.value = '';
        renderRemitos();
    }
}

function removeRemito(index) {
    remitosList.splice(index, 1);
    renderRemitos();
}

function renderRemitos() {
    const container = document.getElementById('remitos-list');
    container.innerHTML = remitosList.map((r, i) => `
        <div class="logistics-tag">
            ${r} <button type="button" onclick="removeRemito(${i})"><i data-lucide="x" style="width:12px;"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
    checkSubmit();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        selectedFiles.push({ file, type: 'OTRO DOCUMENTO' }); // Default type
    });
    renderFileList();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

function renderFileList() {
    const list = document.getElementById('selected-files-list');
    list.innerHTML = selectedFiles.map((item, index) => `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
            <div style="flex-grow: 1;">
                <p style="font-size: 0.813rem; font-weight: 700; margin: 0; color: #1e293b;">${item.file.name}</p>
                <p style="font-size: 0.688rem; color: #64748b; margin: 0;">${(item.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <select style="font-size: 0.75rem; padding: 0.25rem 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem;" 
                    onchange="selectedFiles[${index}].type = this.value">
                <option value="REMITO" ${item.type === 'REMITO' ? 'selected' : ''}>Remito</option>
                <option value="DETALLE CONSOLIDADO DE CARGA" ${item.type === 'DETALLE CONSOLIDADO DE CARGA' ? 'selected' : ''}>Detalle Consolidado de Carga</option>
                <option value="FACTURA" ${item.type === 'FACTURA' ? 'selected' : ''}>Factura</option>
                <option value="OTRO DOCUMENTO" ${item.type === 'OTRO DOCUMENTO' ? 'selected' : ''}>Otro Documento</option>
            </select>
            <button type="button" onclick="removeFile(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                <i data-lucide="trash-2" style="width: 16px;"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addBulto() {
    const cant = parseInt(document.getElementById('bulto-cant').value) || 1;
    const alto = document.getElementById('bulto-alto').value;
    const ancho = document.getElementById('bulto-ancho').value;
    const largo = document.getElementById('bulto-largo').value;

    if (alto && ancho && largo && cant > 0) {
        bultosList.push({ cant, alto, ancho, largo });
        document.getElementById('bulto-cant').value = '1';
        document.getElementById('bulto-alto').value = '';
        document.getElementById('bulto-ancho').value = '';
        document.getElementById('bulto-largo').value = '';
        renderBultos();
    }
}

function removeBulto(index) {
    bultosList.splice(index, 1);
    renderBultos();
}

function renderBultos() {
    const container = document.getElementById('bultos-display-list');
    const countSpan = document.getElementById('total-bultos-count');
    
    let totalBultos = 0;
    container.innerHTML = bultosList.map((b, i) => {
        totalBultos += b.cant;
        return `
            <div class="bulto-card">
                <div>
                    <span class="text-sm font-bold text-gray-700" style="display:block; margin-bottom: 0.25rem;">
                        <i data-lucide="package" style="width:16px; display:inline; vertical-align:middle; color:#64748b;"></i> 
                        ${b.cant} ${b.cant > 1 ? 'Bultos' : 'Bulto'}
                    </span>
                    <div style="display:flex; gap: 0.5rem;">
                        <span class="dimension-badge">AL: ${b.alto}cm</span>
                        <span class="dimension-badge">AN: ${b.ancho}cm</span>
                        <span class="dimension-badge">LA: ${b.largo}cm</span>
                    </div>
                </div>
                <button type="button" onclick="removeBulto(${i})" style="color:#ef4444; background:#fee2e2; border:none; border-radius:0.5rem; padding:0.5rem; cursor:pointer; display:flex;">
                    <i data-lucide="trash-2" style="width:16px;"></i>
                </button>
            </div>
        `;
    }).join('');
    
    countSpan.innerText = totalBultos;
    lucide.createIcons();
    checkSubmit();
}

function checkSubmit() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = !(remitosList.length > 0 && bultosList.length > 0);
}

async function handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');
    
    btn.disabled = true;
    btn.innerHTML = 'Procesando...';
    errorMsg.style.display = 'none';

    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const horaParts = hora.split(':');
    const dateObj = new Date(fecha + 'T' + hora);
    const horaInicio = dateObj.getHours() + ':' + dateObj.getMinutes().toString().padStart(2, '0');
    dateObj.setMinutes(dateObj.getMinutes() + 30);
    const horaFin = dateObj.getHours() + ':' + dateObj.getMinutes().toString().padStart(2, '0');

    const ocs = Array.from(document.querySelectorAll('#oc-checkbox-list input:checked')).map(i => i.value);
    
    // Preparar FormData para enviar archivos
    const formData = new FormData();
    formData.append('nro_orden_co', JSON.stringify(ocs).replace(/"/g, "'"));
    formData.append('fecha_turno', fecha);
    formData.append('hora_turno', horaInicio);
    formData.append('hora_fin', horaFin);
    formData.append('remitos', remitosList.join(', '));
    formData.append('cantidad_bultos', document.getElementById('total-bultos-count').innerText);
    formData.append('observaciones', document.getElementById('observaciones').value);
    
    // Empaquetar ítems
    const items = [];
    document.querySelectorAll('.qty-input').forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            const index = input.getAttribute('data-index');
            items.push({
                cod_articulo: ocItems[index].cod_articulo,
                descripcion: ocItems[index].descripcion,
                cantidad_a_entregar: qty,
                nro_oc: ocItems[index].nro_oc
            });
        }
    });
    formData.append('items', JSON.stringify(items));

    // Agregar bultos detallados
    formData.append('bultos_detalle', JSON.stringify(bultosList));

    // Agregar archivos con sus tipos
    selectedFiles.forEach((item, index) => {
        formData.append(`file_${index}`, item.file);
        formData.append(`file_type_${index}`, item.type);
    });
    formData.append('file_count', selectedFiles.length);

    try {
        const response = await fetch('/Proveedores/api/turnos/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
            },
            body: formData
        });

        if (response.ok) {
            closeSolicitarModal();
            if (typeof loadTurnos === 'function') loadTurnos();
            // Reset form for next time
            remitosList = [];
            bultosList = [];
            e.target.reset();
        } else {
            const errData = await response.json();
            let fullError = errData.error || 'Error al agendar';
            if (errData.details) {
                fullError += `\n\nDetalle técnico: ${errData.details}`;
            }
            errorMsg.innerText = fullError;
            errorMsg.style.display = 'block';
            btn.innerText = 'Confirmar Solicitud';
            btn.disabled = false;
        }
    } catch (error) {
        errorMsg.innerText = 'Error de conexión';
        errorMsg.style.display = 'block';
        btn.innerText = 'Confirmar Solicitud';
        btn.disabled = false;
    }
}
