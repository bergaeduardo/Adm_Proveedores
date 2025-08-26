// =============================
// Utilidades de proveedor (idénticas al dashboard)
// =============================
(function (w) {
  const KEY = 'proveedor_id';
  function getFromQS() {
    const p = new URLSearchParams(w.location.search).get('proveedor_id');
    return p ? parseInt(p, 10) : null;
  }
  function get() {
    return getFromQS() || parseInt(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '0', 10) || null;
  }
  function set(id, persist = false) {
    if (!id) return;
    sessionStorage.setItem(KEY, String(id));
    if (persist) localStorage.setItem(KEY, String(id));
  }
  w.ProveedorScope = w.ProveedorScope || { get, set };
})(window);

// =============================
// Helpers
// =============================
function getProveedorId() {
  const qs = new URLSearchParams(location.search).get('proveedor_id');
  if (qs) { sessionStorage.setItem('proveedor_id', qs); localStorage.setItem('proveedor_id', qs); return parseInt(qs,10); }
  const sid = sessionStorage.getItem('proveedor_id') || localStorage.getItem('proveedor_id');
  return sid ? parseInt(sid,10) : null;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function paintBadge(id, texto) {
  const badge = document.getElementById('currentProveedorBadge');
  if (!badge) return;
  if (!id) { badge.classList.add('d-none'); return; }
  badge.textContent = `Proveedor #${id}${texto ? ' – ' + texto : ''}`;
  badge.classList.remove('d-none');
}

// =============================
// API calls
// =============================
async function apiListarComprobantes(proveedorId) {
  const r = await fetch(`/administracion/api/comprobantes/?proveedor_id=${encodeURIComponent(proveedorId)}`);
  if (!r.ok) throw new Error('No se pudo cargar el listado');
  return r.json();
}

async function apiCrearComprobante(fd, proveedorId) {
  fd.append('proveedor', proveedorId);
  const r = await fetch('/administracion/api/comprobantes/', {
    method: 'POST',
    body: fd,
    headers: { 'X-CSRFToken': getCookie('csrftoken') || '' }
  });
  if (!r.ok) {
    let msg = `Error HTTP ${r.status}`;
    try { msg += ': ' + JSON.stringify(await r.json()); } catch {}
    throw new Error(msg);
  }
  return r.json();
}

async function apiBorrarComprobante(id, proveedorId) {
  const r = await fetch(`/administracion/api/comprobantes/${id}/?proveedor_id=${encodeURIComponent(proveedorId)}`, {
    method: 'DELETE',
    headers: { 'X-CSRFToken': getCookie('csrftoken') || '' }
  });
  if (!r.ok && r.status !== 204) throw new Error('No se pudo eliminar');
}

// =============================
// Render
// =============================
function renderTablaComprobantes(payload) {
  const items = Array.isArray(payload) ? payload : (payload.results || []);
  const thead = document.getElementById('theadComprobantes');
  const tbody = document.getElementById('tbodyComprobantes');

  if (!items.length) {
    thead.innerHTML = '<tr><th>Sin datos</th></tr>';
    tbody.innerHTML = '';
    return;
  }

  // Determinar columnas dinámicamente
  const first = items[0];
  const blacklist = new Set(['id','proveedor','proveedor_id']);
  const keys = Object.keys(first).filter(k => !blacklist.has(k));

  // Priorizar columnas comunes si existen
  const preferred = ['tipo','numero','fecha_emision','fecha','total','estado'];
  keys.sort((a,b) => (preferred.indexOf(a) === -1 ? 999 : preferred.indexOf(a)) - (preferred.indexOf(b) === -1 ? 999 : preferred.indexOf(b)));

  thead.innerHTML = '<tr>' + keys.map(k => `<th>${k.replace(/_/g,' ')}</th>`).join('') + '<th class="text-end">Acciones</th></tr>';
  tbody.innerHTML = '';

  items.forEach(row => {
    const tr = document.createElement('tr');
    keys.forEach(k => {
      const td = document.createElement('td');
      let v = row[k];
      if (k.toLowerCase().includes('archivo') || k.toLowerCase().includes('file') || k.toLowerCase().includes('url')) {
        const url = row.archivo_url || row.file_url || row.url || row[k];
        if (url && typeof url === 'string') {
          td.innerHTML = `<a href="${url}" target="_blank" rel="noopener">Descargar</a>`;
        } else {
          td.textContent = '';
        }
      } else {
        td.textContent = (v == null ? '' : v);
      }
      tr.appendChild(td);
    });
    const acc = document.createElement('td');
    acc.className = 'text-end';
    acc.innerHTML = `<button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${row.id}">Eliminar</button>`;
    tr.appendChild(acc);
    tbody.appendChild(tr);
  });
}

// =============================
// Main
// =============================
document.addEventListener('DOMContentLoaded', async () => {
  const proveedorId = getProveedorId();
  if (!proveedorId) {
    alert('No se ha seleccionado un proveedor. Volviendo al dashboard.');
    location.href = '/administracion/dashboard/';
    return;
  }

  paintBadge(proveedorId);

  // Listado inicial
  try {
    const data = await apiListarComprobantes(proveedorId);
    renderTablaComprobantes(data);
  } catch (e) {
    document.getElementById('theadComprobantes').innerHTML = '<tr><th>Error al cargar</th></tr>';
  }

  // Nuevo comprobante
  const modalEl = document.getElementById('modalComprobante');
  const modal = new bootstrap.Modal(modalEl);
  document.getElementById('btnNuevo').addEventListener('click', () => {
    document.getElementById('formComprobante').reset();
    document.getElementById('formMsg').className = 'alert d-none';
    modal.show();
  });

  document.getElementById('formComprobante').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const msg = document.getElementById('formMsg');
    msg.className = 'alert d-none';

    const fd = new FormData(form);
    // Si tu backend usa otro nombre de archivo (p.ej. "file"), duplicalo:
    if (!fd.get('archivo') && form.querySelector('input[name="file"]').files[0]) {
      fd.append('archivo', form.querySelector('input[name="file"]').files[0]);
    }

    try {
      await apiCrearComprobante(fd, proveedorId);
      modal.hide();
      const data = await apiListarComprobantes(proveedorId);
      renderTablaComprobantes(data);
    } catch (e) {
      msg.textContent = e.message || 'Error al guardar';
      msg.className = 'alert alert-danger';
    }
  });

  // Eliminar
  document.getElementById('tbodyComprobantes').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-action="del"]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!confirm('¿Eliminar el comprobante seleccionado?')) return;
    try {
      await apiBorrarComprobante(id, proveedorId);
      const data = await apiListarComprobantes(proveedorId);
      renderTablaComprobantes(data);
    } catch (e) {
      alert('No se pudo eliminar');
    }
  });
});