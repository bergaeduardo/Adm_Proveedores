import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const providerSearchModal = new bootstrap.Modal(document.getElementById('providerSearchModal'));
    const providerSearchInput = document.getElementById('providerSearchInput');
    const providerSearchResults = document.getElementById('providerSearchResults');
    const providerSearchStatus = document.getElementById('providerSearchStatus');
    const misDatosCard = document.querySelector('.card-mis-datos'); // Get the Mis Datos card

    // Event listener for the Mis Datos card click
    misDatosCard.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        providerSearchModal.show(); // Show the modal
        providerSearchInput.value = ''; // Clear previous search
        providerSearchResults.innerHTML = ''; // Clear previous results
        providerSearchStatus.textContent = ''; // Clear status message
    });


    // Event listener for input in the search field
    providerSearchInput.addEventListener('input', debounce(function() {
        const query = providerSearchInput.value.trim();
        if (query.length > 2) { // Search only if query is at least 3 characters
            searchProviders(query);
        } else {
            providerSearchResults.innerHTML = '';
            providerSearchStatus.textContent = '';
        }
    }, 300)); // Debounce search to avoid too many requests

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    async function searchProviders(query) {
        providerSearchStatus.textContent = 'Buscando...';
        providerSearchResults.innerHTML = '';

        const apiUrl = `${API_BASE_URL}proveedor-search/`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST', // Use POST as defined in api.py
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                }),
            });

            if (!response.ok) {
                 providerSearchStatus.textContent = `Error al buscar proveedores: ${response.status}`;
                 console.error('API Error:', response.status, await response.text());
                 return;
            }

            const data = await response.json();

            if (data.length === 0) {
                providerSearchStatus.textContent = 'No se encontraron proveedores.';
            } else {
                providerSearchStatus.textContent = '';
                data.forEach(provider => {
                    const listItem = document.createElement('a');
                    listItem.href = '#'; // Prevent default link behavior
                    listItem.classList.add('list-group-item', 'list-group-item-action');
                    listItem.textContent = provider.display;
                    listItem.dataset.providerId = provider.id; // Store provider ID
                    listItem.dataset.codPais = provider.cod_pais; // Store cod_pais
                    listItem.addEventListener('click', handleProviderSelect);
                    providerSearchResults.appendChild(listItem);
                });
            }

        } catch (error) {
            console.error('Fetch error:', error);
            providerSearchStatus.textContent = 'Error de conexión al buscar proveedores.';
        }
    }

    async function changeDbConnection(codPais) {
        console.log(`Enviando solicitud para cambiar la conexión a la DB para el país: ${codPais}`);
        const apiUrl = `${API_BASE_URL}cambiar-conexion/`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cod_pais: codPais }),
            });
            const responseData = await response.json();
            if (!response.ok) {
                console.error('Error en la API al cambiar la conexión:', response.status, responseData);
                return false;
            }
            console.log('Respuesta del servidor al cambiar la conexión:', responseData);
            return true;
        } catch (error) {
            console.error('Error de fetch al cambiar la conexión:', error);
            return false;
        }
    }

    async function handleProviderSelect(event) {
        event.preventDefault();
        const selectedProviderId = event.target.dataset.providerId;
        const selectedCodPais = event.target.dataset.codPais;

        console.log(`Proveedor seleccionado: ID=${selectedProviderId}, CodPais=${selectedCodPais}`);

        if (selectedProviderId) {
            const connectionChanged = await changeDbConnection(selectedCodPais);
            if (connectionChanged) {
                console.log('Conexión cambiada con éxito. Redirigiendo a mis-datos...');
                localStorage.setItem('selectedProviderId', selectedProviderId);
                window.location.href = '../mis-datos/';
            } else {
                alert('Error al cambiar la conexión de la base de datos. Por favor, revise la consola para más detalles.');
            }
        }

        providerSearchModal.hide(); // Hide the modal
    }

    // Basic logout function (adapt as needed for your auth flow)
    window.logout = function() {
        // Clear any stored authentication data (if applicable)
        localStorage.removeItem('selectedProviderId'); // Clear selected provider on logout
        // Redirect to login page or home
        window.location.href = '/'; // Example: Redirect to root
    };
});