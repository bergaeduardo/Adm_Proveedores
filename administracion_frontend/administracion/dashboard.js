import { loadCredentials, getCredentials, getApiBaseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    await loadCredentials();
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

        const apiUrl = `${getApiBaseUrl()}/administracion/api/proveedor-search/`;
        const creds = getCredentials();

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    username: creds.username,
                    password: creds.password
                })
            });

            if (!response.ok) {
                 // Handle authentication errors or other API errors
                 if (response.status === 401 || response.status === 403) {
                     providerSearchStatus.textContent = 'Error de autenticación. Verifique las credenciales.';
                 } else {
                     providerSearchStatus.textContent = `Error al buscar proveedores: ${response.status}`;
                 }
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
                    listItem.addEventListener('click', handleProviderSelect);
                    providerSearchResults.appendChild(listItem);
                });
            }

        } catch (error) {
            console.error('Fetch error:', error);
            providerSearchStatus.textContent = 'Error de conexión al buscar proveedores.';
        }
    }

    function handleProviderSelect(event) {
        event.preventDefault();
        const selectedProviderId = event.target.dataset.providerId;

        if (selectedProviderId) {
            // Store the selected provider ID (e.g., in localStorage)
            localStorage.setItem('selectedProviderId', selectedProviderId);

            // Redirect to the mis_datos page
            window.location.href = 'mis_datos.html';
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
