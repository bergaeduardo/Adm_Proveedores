import { apiCredentials, API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const noDataMessage = document.getElementById('no-data-message');
    const resumenCuentaTable = $('#resumenCuentaTable');
    const tableContainer = document.querySelector('.table-responsive');

    const selectedProviderId = localStorage.getItem('selectedProviderId');
    if (!selectedProviderId) {
        alert('No se ha seleccionado un proveedor.');
        window.location.href = 'dashboard.html';
        return;
    }

    function showLoading() {
        loadingMessage.style.display = '';
        errorMessage.style.display = 'none';
        noDataMessage.style.display = 'none';
        tableContainer.style.display = 'none';
    }

    function fetchResumenCuenta() {
        const url = new URL(`${API_BASE_URL}resumen-cuenta/`);
        url.searchParams.append('username', apiCredentials.username);
        url.searchParams.append('password', apiCredentials.password);
        url.searchParams.append('proveedor_id', selectedProviderId);
        return fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            return response.json();
        });
    }

    function renderTable(result) {
        loadingMessage.style.display = 'none';

        if (result && Array.isArray(result.data) && result.data.length > 0) {
            noDataMessage.style.display = 'none';
            errorMessage.style.display = 'none';

            const importeColumnIndex = result.columns.findIndex(col => col.data === 'Importe');
            let totalImporte = 0;

            if (importeColumnIndex !== -1) {
                result.data.forEach(row => {
                    const importeStr = Array.isArray(row) ? row[importeColumnIndex] : row.Importe;
                    if (importeStr) {
                        const importeNum = parseFloat(importeStr.replace(/\./g, '').replace(',', '.'));
                        if (!isNaN(importeNum)) {
                            totalImporte += importeNum;
                        }
                    }
                });
            }

            const formattedTotal = totalImporte.toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            document.getElementById('total-importe').textContent = formattedTotal;

            const columnDefs = [{
                targets: importeColumnIndex,
                createdCell: function (td, cellData) {
                    if (cellData) {
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

            tableContainer.style.display = '';
            if ($.fn.DataTable.isDataTable('#resumenCuentaTable')) {
                resumenCuentaTable.DataTable().destroy();
                resumenCuentaTable.empty();
            }

            resumenCuentaTable.DataTable({
                data: result.data,
                columns: result.columns,
                columnDefs: columnDefs,
                order: [],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
                },
                responsive: true,
            });
        } else {
            tableContainer.style.display = 'none';
            noDataMessage.style.display = '';
        }
    }

    function load() {
        showLoading();
        fetchResumenCuenta()
            .then(renderTable)
            .catch(error => {
                loadingMessage.style.display = 'none';
                tableContainer.style.display = 'none';
                noDataMessage.style.display = 'none';
                errorMessage.textContent = 'Error al cargar el resumen de cuenta: ' + error.message;
                errorMessage.style.display = '';
            });
    }

    load();

    window.goToDashboard = function() {
        window.location.href = 'dashboard.html';
    };
});
