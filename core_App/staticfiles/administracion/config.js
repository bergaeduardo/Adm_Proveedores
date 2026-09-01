/**
 * Frontend configuration file for API settings.
 * Adjust these values to update global frontend constants.
 */

// Configuration object (compatible with existing code)
var CONFIG = {
    API_BASE: '/administracion/api',
    API_BASE_URL: '/administracion/api/' // Backward compatibility
};

// Make CONFIG globally available
window.CONFIG = CONFIG;

console.log('CONFIG loaded:', CONFIG);
