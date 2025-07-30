# Administracion Frontend

Archivos HTML, CSS y JS desacoplados del backend de Django.

Sirve estas plantillas desde cualquier servidor web estático y consume las APIs
expuestas por el proyecto Django en `/administracion/api/`.

Configura las credenciales de acceso y la URL base de la API en
`static/config.js`. La variable `API_BASE_URL` debe apuntar al servidor donde
corre el backend de Django (por defecto `http://localhost:8000/administracion/api/`).
