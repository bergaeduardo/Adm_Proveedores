/**
 * Frontend configuration file for API credentials.
 * Modify these values to change the username and password used for API authentication.
 */
let apiCredentials = { username: '', password: '', apiBaseUrl: '' };

export async function loadCredentials() {
    try {
        // const resp = await fetch('../administracion_frontend/config.json');
         const resp = await fetch('../config.json');
        if (resp.ok) {
            apiCredentials = await resp.json();
        }
    } catch (err) {
        console.error('Unable to load credentials', err);
    }
    return apiCredentials;
}

export function getCredentials() {
    return apiCredentials;
}

export function getApiBaseUrl() {
    return apiCredentials.apiBaseUrl || '';
}

