/**
 * Utilidades de autenticación JWT para la app Proveedores
 * Este archivo centraliza el manejo de tokens JWT incluyendo renovación automática
 */

// Configuración de la utilidad de autenticación
const AuthConfig = {
    ACCESS_TOKEN_KEY: 'jwt',
    REFRESH_TOKEN_KEY: 'refresh_token',
    LOGIN_URL: '/Proveedores/acceder/',
    TOKEN_REFRESH_ENDPOINT: '/Proveedores/api/token/refresh/',
    // Intentar renovar el token cuando queden 2 minutos o menos antes de expirar
    REFRESH_THRESHOLD_MINUTES: 2
};

/**
 * Clase para manejar la autenticación JWT
 */
class AuthManager {
    // Cache para evitar múltiples verificaciones
    static _lastTokenCheck = null;
    static _tokenCheckCache = null;
    static _cacheTimeout = 60000; // 1 minuto de cache
    static _isRefreshing = false; // Flag para evitar renovaciones concurrentes
    static _lastTokenRefresh = null; // Timestamp de última renovación
    
    /**
     * Obtiene el access token del sessionStorage
     */
    static getAccessToken() {
        return sessionStorage.getItem(AuthConfig.ACCESS_TOKEN_KEY);
    }
    
    /**
     * Obtiene el refresh token del sessionStorage
     */
    static getRefreshToken() {
        return sessionStorage.getItem(AuthConfig.REFRESH_TOKEN_KEY);
    }
    
    /**
     * Verifica si el usuario está autenticado (tiene tokens válidos)
     */
    static isAuthenticated() {
        return !!(this.getAccessToken() && this.getRefreshToken());
    }
    
    /**
     * Limpia todos los tokens del sessionStorage
     */
    static clearTokens() {
        sessionStorage.removeItem(AuthConfig.ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(AuthConfig.REFRESH_TOKEN_KEY);
    }
    
    /**
     * Redirige a la página de login y limpia tokens
     */
    static redirectToLogin(message = 'Sesión expirada. Por favor, inicie sesión nuevamente.') {
        this.clearTokens();
        if (message) {
            alert(message);
        }
        window.location.href = AuthConfig.LOGIN_URL;
    }
    
    /**
     * Decodifica un JWT y extrae el payload sin verificar la firma
     * (solo para leer la fecha de expiración)
     */
    static decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (error) {
            console.error('Error decodificando JWT:', error);
            return null;
        }
    }
    
    /**
     * Verifica si un token está próximo a expirar
     */
    static isTokenNearExpiry(token) {
        if (!token) {
            return true;
        }
        
        const payload = this.decodeJWT(token);
        if (!payload || !payload.exp) {
            return true;
        }
        
        const now = Math.floor(Date.now() / 1000);
        const expiryTime = payload.exp;
        const timeUntilExpiry = expiryTime - now;
        
        // Convertir umbral de minutos a segundos
        const thresholdSeconds = AuthConfig.REFRESH_THRESHOLD_MINUTES * 60;
        
        // Si el token ya expiró
        if (timeUntilExpiry <= 0) {
            console.log('Token expirado');
            return true;
        }
        
        // Si está dentro del umbral de renovación
        const shouldRefresh = timeUntilExpiry <= thresholdSeconds;
        
        // Solo mostrar mensaje si necesita renovación
        if (shouldRefresh) {
            const minutesLeft = Math.floor(timeUntilExpiry / 60);
            console.log(`Token expira en ${minutesLeft} minutos, renovando...`);
        }
        
        return shouldRefresh;
    }
    
    /**
     * Intenta renovar el access token usando el refresh token
     */
    static async refreshAccessToken() {
        // Evitar renovaciones concurrentes
        if (this._isRefreshing) {
            console.log('Renovación ya en progreso, esperando...');
            return false;
        }
        
        // Evitar renovar el mismo token múltiples veces en poco tiempo
        const now = Date.now();
        if (this._lastTokenRefresh && (now - this._lastTokenRefresh) < 30000) { // 30 segundos
            console.log('Token renovado recientemente, saltando renovación');
            return true;
        }
        
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
            console.warn('No hay refresh token disponible');
            return false;
        }
        
        this._isRefreshing = true;
        
        try {
            const response = await fetch(AuthConfig.TOKEN_REFRESH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            });
            
            if (!response.ok) {
                console.error('Error renovando token:', response.status);
                return false;
            }
            
            const data = await response.json();
            
            // Actualizar el access token en sessionStorage
            sessionStorage.setItem(AuthConfig.ACCESS_TOKEN_KEY, data.access);
            console.log('Token renovado exitosamente');
            
            // Actualizar timestamps
            this._lastTokenRefresh = now;
            
            // Limpiar cache para forzar nueva verificación
            this._lastTokenCheck = null;
            this._tokenCheckCache = null;
            
            return true;
            
        } catch (error) {
            console.error('Error de red renovando token:', error);
            return false;
        } finally {
            this._isRefreshing = false;
        }
    }
    
    /**
     * Función principal que verifica y renueva el token si es necesario
     * SOLO para peticiones API - NO usar en carga de páginas
     */
    static async ensureValidToken() {
        const now = Date.now();
        
        // Usar cache para evitar verificaciones múltiples
        if (this._lastTokenCheck && this._tokenCheckCache && 
            (now - this._lastTokenCheck) < this._cacheTimeout) {
            return this._tokenCheckCache;
        }
        
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        
        if (!accessToken || !refreshToken) {
            console.warn('Tokens no encontrados');
            this.redirectToLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            this._tokenCheckCache = false;
            this._lastTokenCheck = now;
            return false;
        }
        
        // Solo verificar expiración si realmente está próximo a expirar
        if (this.isTokenNearExpiry(accessToken)) {
            const refreshed = await this.refreshAccessToken();
            
            if (!refreshed) {
                console.error('No se pudo renovar el token');
                this.redirectToLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                this._tokenCheckCache = false;
                this._lastTokenCheck = now;
                return false;
            }
        }
        
        // Cachear resultado exitoso
        this._tokenCheckCache = true;
        this._lastTokenCheck = now;
        return true;
    }
    
    /**
     * Wrapper para fetch que maneja automáticamente la autenticación
     * Incluye el token Bearer y maneja errores 401/403 con renovación automática
     */
    static async authenticatedFetch(url, options = {}) {
        // Asegurar que tenemos un token válido
        const tokenValid = await this.ensureValidToken();
        if (!tokenValid) {
            throw new Error('Token inválido o expirado');
        }
        
        // Preparar headers con autenticación
        const authHeaders = {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            ...options.headers
        };
        
        const requestOptions = {
            ...options,
            headers: authHeaders
        };
        
        try {
            const response = await fetch(url, requestOptions);
            
            // Si obtenemos 401 o 403, intentar renovar el token una vez más
            if (response.status === 401 || response.status === 403) {
                console.log('Recibido 401/403, intentando renovar token...');
                
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Reintentar la petición con el nuevo token
                    requestOptions.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    const retryResponse = await fetch(url, requestOptions);
                    
                    // Si aún falla después del refresh, redirigir al login
                    if (retryResponse.status === 401 || retryResponse.status === 403) {
                        this.redirectToLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                        throw new Error('Autenticación fallida después de refresh');
                    }
                    
                    return retryResponse;
                } else {
                    // No se pudo renovar, redirigir al login
                    this.redirectToLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                    throw new Error('No se pudo renovar el token');
                }
            }
            
            return response;
            
        } catch (error) {
            console.error('Error en authenticatedFetch:', error);
            throw error;
        }
    }
}

/**
 * Funciones de conveniencia para compatibilidad con código existente
 */

/**
 * Verifica autenticación al cargar una página (SIN renovación automática)
 * Solo verifica que existan los tokens, no los renueva
 */
async function checkAuthOnPageLoad() {
    // Verificación básica de tokens sin renovación
    const accessToken = AuthManager.getAccessToken();
    const refreshToken = AuthManager.getRefreshToken();
    
    if (!accessToken || !refreshToken) {
        console.log('No se encontraron tokens, redirigiendo al login');
        AuthManager.redirectToLogin('Debe iniciar sesión para acceder a esta página.');
        return false;
    }
    
    // Verificar si el token ya expiró completamente (sin umbral)
    const payload = AuthManager.decodeJWT(accessToken);
    if (payload && payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (now > payload.exp) {
            console.log('Token expirado, redirigiendo al login');
            AuthManager.redirectToLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            return false;
        }
    }
    
    console.log('Usuario autenticado');
    return true;
}

/**
 * Verifica autenticación básica sin renovar tokens
 * Para uso en verificaciones simples
 */
function isUserAuthenticated() {
    const accessToken = AuthManager.getAccessToken();
    const refreshToken = AuthManager.getRefreshToken();
    return !!(accessToken && refreshToken);
}

/**
 * Función de logout que limpia tokens y redirige
 */
function logout() {
    AuthManager.clearTokens();
    window.location.href = AuthConfig.LOGIN_URL;
}

// Exportar para uso global
window.AuthManager = AuthManager;
window.checkAuthOnPageLoad = checkAuthOnPageLoad;
window.logout = logout;