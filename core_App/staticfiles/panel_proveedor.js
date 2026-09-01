
document.addEventListener('DOMContentLoaded', () => {
    loadTurnos();
});

async function loadTurnos() {
    try {
        const response = await fetch('/Proveedores/api/turnos/', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Intentar refresh o logout
                console.error('No autorizado');
                return;
            }
            throw new Error('Error al cargar turnos');
        }

        const turnos = await response.json();
        renderDashboard(turnos);
    } catch (error) {
        console.error(error);
        document.getElementById('turnos-list').innerHTML = '<div class="py-20 text-center text-red-500 font-bold">ERROR AL CARGAR LOS DATOS</div>';
    }
}

function formatOCList(ocString) {
    if (!ocString) return 'Sin OC';
    try {
        // Limpiar formato ['OC1', 'OC2'] a OC1, OC2
        return ocString.replace(/[\[\]']/g, '').split(',').map(s => s.trim()).join(', ');
    } catch (e) {
        return ocString;
    }
}

function renderDashboard(turnos) {
    const listContainer = document.getElementById('turnos-list');
    const countConfirmados = document.getElementById('count-confirmados');
    const countPendientes = document.getElementById('count-pendientes');
    const countEntregas = document.getElementById('count-entregas');
    const totalCount = document.getElementById('total-count');

    const confirmados = turnos.filter(t => t.estado === 'Agendado');
    const pendientes = turnos.filter(t => t.estado === 'Solicitado');
    const completados = turnos.filter(t => t.estado === 'Completado');

    countConfirmados.innerText = confirmados.length;
    countPendientes.innerText = pendientes.length;
    countEntregas.innerText = completados.length;
    totalCount.innerText = `${confirmados.length + pendientes.length} TOTAL`;

    if (turnos.length === 0) {
        listContainer.style.display = 'flex';
        listContainer.innerHTML = `
            <div class="text-center flex flex-col items-center gap-4">
                <div style="background: #f1f5f9; width: 5rem; height: 5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #cbd5e1;">
                    <i data-lucide="package" style="width: 40px; height: 40px;"></i>
                </div>
                <div>
                    <p style="font-size: 1.125rem; font-weight: 800; color: #1e293b;">No tienes entregas activas</p>
                    <p style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Tus solicitudes aparecerán aquí una vez creadas.</p>
                </div>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    listContainer.style.display = 'block';
    listContainer.innerHTML = '';
    
    // Solo mostrar Agendados y Solicitados en la lista principal
    const activos = turnos.filter(t => t.estado === 'Agendado' || t.estado === 'Solicitado');
    
    activos.forEach(t => {
        const parts = t.fecha_turno.split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('es', { month: 'short' }).toUpperCase();

        const row = document.createElement('div');
        row.className = 'turno-row';
        row.onclick = () => showDetalle(t);
        
        const statusClass = t.estado === 'Solicitado' ? 'bg-amber-100' : 'bg-blue-100';
        const statusText = t.estado === 'Solicitado' ? 'PENDIENTE' : 'CONFIRMADO';

        row.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%;">
                <div class="date-badge" style="background: ${t.estado === 'Solicitado' ? '#fef3c7' : '#eff6ff'}; color: ${t.estado === 'Solicitado' ? '#92400e' : '#2563eb'};">
                    <span class="month">${month}</span>
                    <span class="day">${day}</span>
                </div>
                <div style="flex-grow: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <p style="font-size: 1.125rem; font-weight: 800; margin: 0; color: #1e293b;">ORDEN: ${formatOCList(t.nro_orden_co)}</p>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.813rem; color: #64748b; font-weight: 600;">
                        <span style="display: flex; align-items: center; gap: 0.35rem;"><i data-lucide="clock" style="width: 14px;"></i> ${t.hora_turno.substring(0,5)} HS</span>
                        <span style="display: flex; align-items: center; gap: 0.35rem;"><i data-lucide="package" style="width: 14px;"></i> PRODUCTOS</span>
                    </div>
                </div>
                <i data-lucide="chevron-right" style="color: #cbd5e1;"></i>
            </div>
        `;
        listContainer.appendChild(row);
    });
    lucide.createIcons();
}

function showDetalle(turno) {
    const modal = document.getElementById('modal-detalle');
    const subtitle = document.getElementById('modal-subtitle');
    const status = document.getElementById('modal-status');
    const datetime = document.getElementById('modal-datetime');
    const itemsTable = document.getElementById('modal-items');
    const actionBox = document.getElementById('modal-actions');

    // Guardar ID global para acciones
    window.currentTurnoId = turno.id;

    subtitle.innerText = `ORDEN: ${formatOCList(turno.nro_orden_co)}`;
    status.innerText = turno.estado.toUpperCase();
    status.className = 'status-badge ' + (
        turno.estado === 'Solicitado' ? 'bg-amber-100' : 
        turno.estado === 'Agendado' ? 'bg-blue-100' :
        turno.estado === 'Completado' ? 'bg-green-100' : 'bg-red-100'
    );
    
    const parts = turno.fecha_turno.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    datetime.innerText = `${date.toLocaleDateString()} - ${turno.hora_turno.substring(0,5)} hs`;
    
    // Mostrar botones de acción solo si es Solicitado
    if (turno.estado === 'Solicitado') {
        actionBox.style.display = 'flex';
    } else {
        actionBox.style.display = 'none';
    }

    // Poblar datos logísticos
    document.getElementById('modal-remitos').innerText = turno.remitos || 'Sin remitos';
    document.getElementById('modal-bultos').innerText = turno.cantidad_bultos || '0';
    
    // Procesar observaciones para separar el detalle logístico
    const obsFull = turno.observaciones || '';
    const logisticMatch = obsFull.match(/\[DETALLE LOGÍSTICO: (.*?)\]/);
    
    if (logisticMatch) {
        const cleanObs = obsFull.replace(logisticMatch[0], '').replace(/\[ITEMS: .*?\]/, '').trim();
        document.getElementById('modal-obs').innerText = cleanObs || 'Sin observaciones';
        document.getElementById('modal-logistic-detail-content').innerText = logisticMatch[1];
        document.getElementById('modal-logistic-detail-container').style.display = 'block';
    } else {
        document.getElementById('modal-obs').innerText = obsFull.replace(/\[ITEMS: .*?\]/, '').trim() || 'Sin observaciones';
        document.getElementById('modal-logistic-detail-container').style.display = 'none';
    }

    itemsTable.innerHTML = '<tr><td colspan="2" class="text-center py-4">Cargando ítems...</td></tr>';
    modal.style.display = 'flex';
    lucide.createIcons();

    fetch(`/Proveedores/api/turnos/${turno.id}/detalles/`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
        }
    })
    .then(res => res.json())
    .then(items => {
        itemsTable.innerHTML = '';
        if (items.length === 0) {
            itemsTable.innerHTML = '<tr><td colspan="2" class="text-center py-4 text-slate-400">No hay detalles disponibles</td></tr>';
            return;
        }
        items.forEach(item => {
            const tr = document.createElement('tr');
            const ocBadge = item.nro_oc ? `<span style="font-size: 0.625rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569; display: inline-block; margin-top: 4px;">OC: ${item.nro_oc}</span>` : '';
            tr.innerHTML = `
                <td style="padding: 1rem 1.5rem;">
                    <p style="font-size: 0.813rem; font-weight: 700; margin: 0;">${item.cod_articulo}</p>
                    <p style="font-size: 0.688rem; color: #64748b; margin: 0;">${item.descripcion}</p>
                    ${ocBadge}
                </td>
                <td class="text-right" style="padding: 1rem 1.5rem; font-weight: 900; font-size: 0.813rem;">${item.cantidad_a_entregar}</td>
            `;
            itemsTable.appendChild(tr);
        });
    })
    .catch(err => {
        itemsTable.innerHTML = '<tr><td colspan="2" class="text-center text-red-500">Error al cargar ítems</td></tr>';
    });
}

async function eliminarTurno() {
    if (!window.currentTurnoId) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar este turno? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const btn = document.getElementById('btn-eliminar-turno');
    btn.innerText = 'ELIMINANDO...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`/Proveedores/api/turnos/${window.currentTurnoId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
            }
        });
        
        if (response.ok) {
            closeModal();
            loadTurnos(); // Recargar la lista
            alert('Turno eliminado correctamente.');
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'No se pudo eliminar el turno'));
            btn.innerHTML = '<i data-lucide="trash-2" style="width: 16px; margin-right: 0.5rem;"></i> ELIMINAR TURNO';
            btn.disabled = false;
            lucide.createIcons();
        }
    } catch (error) {
        alert('Error de conexión al intentar eliminar.');
        btn.disabled = false;
    }
}

function closeModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}
