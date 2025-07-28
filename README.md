# Nombre del Proyecto

Este proyecto es una aplicación web desarrollada con Django que gestiona proveedores y su vinculación con usuarios de Django. Proporciona un flujo de autenticación seguro y permite la gestión de datos de proveedores.

## Características Principales

- Autenticación de usuarios con JWT.
- Gestión de proveedores vinculados a usuarios de Django.
- API RESTful para operaciones CRUD sobre proveedores.
- Documentación detallada para desarrolladores.

## Estructura del Proyecto

- **`requirements.txt`**: Contiene las dependencias de Python necesarias para ejecutar el proyecto.
- **`manage.py`**: Herramienta de línea de comandos de Django para tareas administrativas.
- **`core_App/settings.py`**: Configuración del proyecto, que selecciona entre configuraciones locales y de producción.
- **`Proveedores/README_vinculacion_usuario.md`**: Documentación sobre la vinculación de proveedores con usuarios de Django.
- **`Proveedores/API_DOC.md`**: Documentación sobre el flujo de autenticación y obtención de datos de proveedores.

## Requisitos Previos

- Python 3.x
- Django 3.2.25
- Base de datos compatible (por ejemplo, PostgreSQL)

## Instrucciones de Instalación

1. Clona el repositorio en tu máquina local.
2. Navega al directorio del proyecto.
3. Crea un entorno virtual y actívalo:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # En Windows usa `venv\Scripts\activate`
   ```
4. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

5. Copia el archivo de credenciales de ejemplo y edítalo con tu usuario y contraseña para las APIs de administración:
   ```bash
   cp core_App/Administracion/admin_credentials.example.json core_App/Administracion/admin_credentials.json
   # Edita el archivo resultante y reemplaza los valores por tus credenciales
   ```
   También puedes indicar la ruta del archivo mediante la variable de entorno `ADMIN_CREDENTIALS_FILE`.

## Instrucciones para Ejecutar el Proyecto

1. Realiza las migraciones de la base de datos:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
3. Accede a la aplicación en tu navegador en `http://localhost:8000`.

### Uso del frontend de Administración

Los archivos HTML y JavaScript de la app **Administracion** se encuentran en el
directorio `administracion_frontend`. Para evitar errores de CORS, sirve estos
archivos a través de un servidor web local en lugar de abrirlos directamente con
`file://` en el navegador. Por ejemplo:

```bash
cd administracion_frontend
python3 -m http.server 8080
```

Luego abre `http://localhost:8080/templates/Administracion/dashboard.html` en tu
navegador y la aplicación podrá comunicarse con el backend sin restricciones de
CORS.

Edita `administracion_frontend/static/administracion/config.js` para establecer
las credenciales y la URL del backend (`API_BASE_URL`) si utilizas un puerto o
host diferente.

## Créditos o Autores

- Desarrollador Principal: [Tu Nombre]
- Colaboradores: [Nombres de Colaboradores]

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Para más detalles, consulta el archivo `LICENSE`.
