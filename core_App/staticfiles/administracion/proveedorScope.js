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
  function ensureOnLinks() {
    const id = get();
    if (!id) return;
    document.querySelectorAll('a[data-scope="proveedor"]').forEach(a => {
      const url = new URL(a.href, location.origin);
      url.searchParams.set('proveedor_id', id);
      a.href = url.toString();
    });
  }
  w.ProveedorScope = { get, set, getFromQS, ensureOnLinks };
})(window);