// ====== Utilidades de proveedor (mismo criterio que el dashboard) ======
(function (w) {
  const KEY = 'proveedor_id';
  function getFromQS() { const p = new URLSearchParams(w.location.search).get('proveedor_id'); return p ? parseInt(p, 10) : null; }
  function get() { return getFromQS() || parseInt(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '0', 10) || null; }
  function set(id, persist=false) { if (!id) return; sessionStorage.setItem(KEY, String(id)); if (persist) localStorage.setItem(KEY, String(id)); }
  w.ProveedorScope = w.ProveedorScope || { get, set };
})(window);

function getProveedorId() {
  const qs = new URLSearchParams(location.search).get('proveedor_id');
  if (qs) { sessionStorage.setItem('proveedor_id', qs); localStorage.setItem('proveedor_id', qs); return parseInt(qs,10); }
  const sid = sessionStorage.getItem('proveedor_id') || localStorage.getItem('proveedor_id');
  return sid ? parseInt(sid,10) : null;
}
function getCookie(name){ const v = `; ${document.cookie}`; const p = v.split(`; ${name}=`); if (p.length===2) return p.pop().split(';').shift(); }

// ====== API ======
async function apiListarComprobantes(proveedorId, params={}) {
  const url = new URL('/administracion/api/comprobantes/', location.origin);
  url.searchParams.set('proveedor_id', proveedorId);
  // Si tu API acepta filtros por querystring, envialos aquí
  Object.entries(params).forEach(([k,v])=>{ if(v) url.searchParams.set(k,v); });
  const r = await fetch(url);
  if (!r.ok) throw new Error('No se pudo cargar el listado');
  return r.json();
}

async function apiCrearComprobante(fd, proveedorId){
  fd.append('proveedor_id', proveedorId);

  // ⬇⬇⬇ Agregar esta línea (mapea el campo del form al que espera el serializer)
  if (fd.get('total') != null && !fd.get('monto_total')) {
    fd.set('monto_total', fd.get('total'));
  }
  if (fd.get('orden_compra') != null && !fd.get('Num_Oc')) {
    fd.set('Num_Oc', fd.get('orden_compra'));
  }
  // Si existía validación de nombres en comentarios, ya no hace falta tocar nada más

  const r = await fetch('/administracion/api/comprobantes/', {
    method: 'POST',
    body: fd,
    headers: { 'X-CSRFToken': getCookie('csrftoken') || '' }
  });
  if (!r.ok){ let m = `Error HTTP ${r.status}`; try{ m += ': '+JSON.stringify(await r.json()); }catch{}; throw new Error(m); }
  return r.json();
}

async function apiBorrarComprobante(id, proveedorId){
  const r = await fetch(`/administracion/api/comprobantes/${id}/?proveedor_id=${encodeURIComponent(proveedorId)}`, { method:'DELETE', headers:{ 'X-CSRFToken': getCookie('csrftoken')||'' } });
  if (!r.ok && r.status!==204) throw new Error('No se pudo eliminar');
}

async function apiGetComprobante(id, proveedorId) {
  const url = new URL(`/administracion/api/comprobantes/${id}/`, location.origin);
  url.searchParams.set('proveedor_id', proveedorId);
  const r = await fetch(url);
  if (!r.ok) throw new Error('No se pudo cargar el comprobante');
  return r.json();
}

async function apiUpdateComprobante(id, fd, proveedorId) {
    fd.append('proveedor_id', proveedorId);
    if (fd.get('total') != null && !fd.get('monto_total')) {
        fd.set('monto_total', fd.get('total'));
    }
    if (fd.get('orden_compra') != null && !fd.get('Num_Oc')) {
        fd.set('Num_Oc', fd.get('orden_compra'));
    }
  const r = await fetch(`/administracion/api/comprobantes/${id}/`, {
    method: 'PUT',
    body: fd,
    headers: { 'X-CSRFToken': getCookie('csrftoken') || '' }
  });
  if (!r.ok){ let m = `Error HTTP ${r.status}`; try{ m += ': '+JSON.stringify(await r.json()); }catch{}; throw new Error(m); }
  return r.json();
}


// ====== Render helpers ======
function estadoBadgeClass(estado){
  const e = (estado||'').toString().toLowerCase();
  if (e.includes('acept')) return 'badge-aceptado';
  if (e.includes('rechaz')) return 'badge-rechazado';
  if (e.includes('recib')) return 'badge-recibido';
  return 'badge-otro';
}

function pintarLista(payload){
  const cont = document.getElementById('listaComprobantes');
  const items = Array.isArray(payload) ? payload : (payload.results || []);
  cont.innerHTML = '';
  if (!items.length){ cont.innerHTML = '<div class="text-muted">Sin comprobantes.</div>'; return; }

  items.forEach(row => {
    // Nombres de campos tolerantes
    const tipo = row.tipo || row.tipo_comprobante || '';
    const nro = row.numero || row.nro || row.numero_comprobante || '';
    const fecha = row.fecha_emision || row.fecha || '';
    const total = row.total || row.monto || row.monto_total || '';
    const oc = row.orden_compra || row.oc || row.Num_Oc || '';
    const estado = row.estado || '';
    let fileUrl = row.archivo_url || row.archivo || row.file_url || row.url || null;
    // si viene una ruta relativa (p.ej. "comprobantes/44/factura.pdf"), prefijar MEDIA_URL
    if (fileUrl && !/^https?:\/\//.test(fileUrl) && !fileUrl.startsWith('/')) {
      fileUrl = '/media/' + fileUrl.replace(/^\/+/, '');
    }
    // mostrar el nombre de archivo si hay URL
    console.log(fileUrl);

    const wrap = document.createElement('div');
    wrap.className = 'comprobante-item d-flex justify-content-between align-items-center';

    const txt = document.createElement('div');
    txt.innerHTML = `<strong>${tipo || '—'}</strong> - N° ${nro || '—'}<br>
      <span class="text-muted">Fecha: ${fecha || '—'} - Monto: $${total || '—'}</span><br>
      <span class="text-muted">Orden de Compra: ${oc || '—'}</span><br>
      <span class="badge ${estadoBadgeClass(estado)}">${estado || '—'}</span>`;

    const acc = document.createElement('div');
    acc.className = 'd-flex gap-2';

    if (estado !== 'Aceptado') {
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-outline-secondary btn-sm btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.dataset.id = row.id;
        acc.append(btnEditar);
    }

    const btnVer = document.createElement('a');
    btnVer.className = 'btn btn-outline-primary btn-sm';
    btnVer.textContent = 'Ver Archivo';
    btnVer.target = '_blank';
    btnVer.rel = 'noopener';
    if (fileUrl) {
      btnVer.href = fileUrl;
      btnVer.classList.remove('disabled');
      btnVer.removeAttribute('tabIndex');
    } else {
      btnVer.classList.add('disabled');
      btnVer.tabIndex = -1;
    }
    acc.append(btnVer);

    wrap.append(txt, acc);
    cont.appendChild(wrap);
  });
}

// ====== Filtros (si el backend no los implementa, filtramos en cliente) ======
function aplicarFiltrosEnCliente(data){
  const items = Array.isArray(data) ? data : (data.results || []);
  const fDesde = document.getElementById('fDesde').value;
  const fHasta = document.getElementById('fHasta').value;
  const fEstado = (document.getElementById('fEstado').value||'').toLowerCase();
  const fTipo = (document.getElementById('fTipo').value||'').toLowerCase();
  const fBuscar = (document.getElementById('fBuscar').value||'').toLowerCase();

  function inRange(fecha){ if(!fDesde && !fHasta) return true; const d = new Date(fecha||''); if(isNaN(d)) return true; if(fDesde && d < new Date(fDesde)) return false; if(fHasta && d > new Date(fHasta)) return false; return true; }

  return items.filter(r => {
    const estado = (r.estado||'').toString().toLowerCase();
    const tipo = (r.tipo||r.tipo_comprobante||'').toString().toLowerCase();
    const nro = (r.numero||r.nro||r.numero_comprobante||'').toString().toLowerCase();
    const oc = (r.orden_compra||r.oc||'').toString().toLowerCase();
    const fecha = r.fecha_emision || r.fecha;
    if (fEstado && !estado.includes(fEstado)) return false;
    if (fTipo && !tipo.includes(fTipo)) return false;
    if (fBuscar && !(nro.includes(fBuscar) || oc.includes(fBuscar))) return false;
    if (!inRange(fecha)) return false;
    return true;
  });
}

// ====== Main ======
document.addEventListener('DOMContentLoaded', async () => {
  const proveedorId = getProveedorId();
  if (!proveedorId){ alert('No se ha seleccionado un proveedor.'); location.href='/administracion/dashboard/'; return; }

  // Tabs simples (sin recargar)
  const tabs = document.getElementById('tabs');
  tabs.addEventListener('click', (e)=>{
    const a = e.target.closest('a.nav-link');
    if (!a) return;
    e.preventDefault();
    tabs.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
    a.classList.add('active');
    document.getElementById('pane-cargar').classList.toggle('d-none', a.getAttribute('href') !== '#pane-cargar');
    document.getElementById('pane-ver').classList.toggle('d-none', a.getAttribute('href') !== '#pane-ver');
  });

  // Carga inicial del listado
  let rawData = [];
  async function cargarListado(params={}){
    const data = await apiListarComprobantes(proveedorId, params);
    rawData = Array.isArray(data) ? data : (data.results || []);
    pintarLista(data);
  }
  try { await cargarListado(); } catch(e){ /* noop */ }

  // Aplicar filtros
  document.getElementById('btnAplicarFiltros').addEventListener('click', async ()=>{
    // Si tu API soporta filtros por query, pasalos como objeto a cargarListado({estado:..., tipo:..., ...})
    // Si no, filtramos en cliente:
    const filtrados = aplicarFiltrosEnCliente(rawData);
    pintarLista(filtrados);
  });

  // Alta
  const form = document.getElementById('formComprobante');
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const msg = document.getElementById('formMsg');
    msg.className = 'alert d-none';
    const fd = new FormData(form);
    try{
      await apiCrearComprobante(fd, proveedorId);
      msg.textContent = 'Comprobante cargado con éxito';
      msg.className = 'alert alert-success';
      form.reset();
      // refrescar lista
      await cargarListado();
      // ir a la pestaña de Ver
      document.querySelector('#tabs .nav-link[href="#pane-ver"]').click();
    }catch(e){
      msg.textContent = e.message || 'Error al guardar';
      msg.className = 'alert alert-danger';
    }
  });

  // Eliminar
  document.getElementById('listaComprobantes').addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('.btn-outline-danger');
    if (!btn) return;
    const item = btn.closest('.comprobante-item');
    const id = btn.dataset.id;
    if (!id) return;
    if (!confirm('¿Eliminar el comprobante seleccionado?')) return;
    try{
      await apiBorrarComprobante(id, proveedorId);
      await cargarListado();
    }catch(e){ alert('No se pudo eliminar'); }
  });

  // Editar
  const editModalEl = document.getElementById('editModal');
  const editModal = new bootstrap.Modal(editModalEl, { backdrop: 'static' });
  const editForm = document.getElementById('formEditarComprobante');
  let lastFocusedElement; // Variable to store the element that opened the modal

  document.getElementById('listaComprobantes').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.btn-editar');
    if (!btn) return;
    lastFocusedElement = btn;
    const id = btn.dataset.id;
    if (!id) return;

    try {
        const comprobante = await apiGetComprobante(id, proveedorId);
        document.getElementById('edit-id').value = comprobante.id;
        document.getElementById('edit-tipo').value = comprobante.tipo;
        document.getElementById('edit-numero').value = comprobante.numero;
        document.getElementById('edit-fecha_emision').value = comprobante.fecha_emision;
        document.getElementById('edit-total').value = comprobante.monto_total;
        document.getElementById('edit-orden_compra').value = comprobante.Num_Oc || '';
        document.getElementById('edit-estado').value = comprobante.estado;

        editModal.show();
    } catch (e) {
        alert('Error al cargar los datos del comprobante.');
        console.error(e);
    }
  });

  editModalEl.addEventListener('hidden.bs.modal', () => {
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  });

  document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const fd = new FormData(editForm);
    try {
        await apiUpdateComprobante(id, fd, proveedorId);
        editModal.hide();
        await cargarListado();
    } catch (e) {
        alert('Error al guardar los cambios.');
        console.error(e);
    }
  });
});