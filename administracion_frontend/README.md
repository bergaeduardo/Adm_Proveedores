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
Para consultar los movimientos de cuenta puedes dirigirte a
`http://localhost:8080/templates/Administracion/resumen_cuenta.html` una vez
iniciado el mismo servidor estático.

> **Advertencia**: antes de usar cualquiera de las páginas edita
`static/administracion/config.js` e introduce las credenciales de
`admin_credentials.json`. Aprovecha también para ajustar la variable
`API_BASE_URL` si tu backend se ejecuta en otro host o puerto (por defecto
`http://localhost:8000/administracion/api/`).
