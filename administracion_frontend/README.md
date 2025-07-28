# Frontend de Administracion

Este directorio contiene los archivos HTML, CSS y JavaScript que sirven de interfaz
para la app **Administracion**. No se sirve desde Django; debe ejecutarse
como un sitio estático independiente.

## Uso en desarrollo

Ejecuta un servidor HTTP local para evitar errores de CORS:

```bash
python3 -m http.server 8080
```

Abre en el navegador `http://localhost:8080/templates/Administracion/dashboard.html`.
Asegúrate de rellenar `static/administracion/config.js` con el mismo usuario y
contraseña que establezcas en `admin_credentials.json` del backend. También
puedes modificar la variable `API_BASE_URL` en ese archivo para apuntar al
backend de Django si se ejecuta en otro host o puerto (por defecto
`http://localhost:8000/administracion/api/`).
