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
3. Accede a la aplicación en tu navegador en `http://127.0.0.1:8000`.

## Créditos o Autores

- Desarrollador Principal: [Tu Nombre]
- Colaboradores: [Nombres de Colaboradores]

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Para más detalles, consulta el archivo `LICENSE`.

## App "Administracion"

El backend expone APIs en `/administracion/api/` para ser consumidas por un
frontend desacoplado. Configura las credenciales en un archivo `.env` (ver
`.env.example`). El código del frontend se encuentra en el directorio
`administracion_frontend/` y puede servirse desde cualquier servidor estático.
Define además la variable `API_BASE_URL` en `administracion_frontend/static/config.js`
para apuntar al dominio y puerto donde corre Django (por defecto
`http://127.0.0.1:8000/administracion/api/`).

## Entorno de Pruebas

Para ejecutar los tests unitarios de la app **Administracion** se
incluye una configuración específica en `settings_test.py`. Usa el
siguiente comando para correr las pruebas:

```bash
DJANGO_ENV=test python manage.py test
```
