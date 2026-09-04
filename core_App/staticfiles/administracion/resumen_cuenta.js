document.addEventListener('DOMContentLoaded', function() {
    const loadingMessage = $('#loading-message');
    const errorMessage = $('#error-message');
    const noDataMessage = $('#no-data-message');
    const resumenCuentaTable = $('#resumenCuentaTable');
    const tableContainer = $('.table-responsive');

    const selectedProviderId = localStorage.getItem('selectedProviderId');
    if (!selectedProviderId) {
        alert('No se ha seleccionado un proveedor.');
        window.location.href = '../dashboard/';
        return;
    }

    function loadResumenCuenta() {
        loadingMessage.show();
        errorMessage.hide();
        noDataMessage.hide();
        tableContainer.hide();

        fetch(`/administracion/api/resumen-cuenta/?proveedor_id=${selectedProviderId}`)
            .then(resp => {
                if (!resp.ok) throw new Error(resp.status);
                return resp.json();
            })
            .then(result => {
                loadingMessage.hide();
                if (result && result.data && result.data.length > 0) {
                    tableContainer.show();
                    if ($.fn.DataTable.isDataTable('#resumenCuentaTable')) {
                        resumenCuentaTable.DataTable().destroy();
                        resumenCuentaTable.empty();
                    }
                    resumenCuentaTable.DataTable({
                        data: result.data,
                        columns: result.columns,
                        order: [],
                        language: { url: '//cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json' },
                        responsive: true,
                    });
                } else {
                    noDataMessage.show();
                }
            })
            .catch(error => {
                loadingMessage.hide();
                errorMessage.text('Error al cargar el resumen de cuenta: ' + error.message).show();
            });
    }

    loadResumenCuenta();

    window.goToDashboard = function() {
        window.location.href = '../dashboard/';
    };
});
