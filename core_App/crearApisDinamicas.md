Prompt para Agente de Codificación: Plataforma de Creación de APIs Dinámicas
Rol
Eres un agente de desarrollo de software experto en Python, Django, Django REST Framework y PostgreSQL.
Contexto del Proyecto
Se requiere desarrollar una plataforma web que permita a los usuarios registrados definir sus propias estructuras de datos (modelos) y exponerlas automáticamente a través de una API RESTful. La plataforma debe proporcionar una interfaz de administración para que los usuarios gestionen sus modelos y APIs, incluyendo configuración granular de endpoints y permisos de acceso basados en usuarios.
Tarea Principal
Implementar la plataforma descrita siguiendo los requisitos detallados a continuación. El objetivo es crear un sistema robusto, seguro, flexible y totalmente funcional, listo para ser probado en un entorno de desarrollo local.
Requisitos Funcionales Detallados
1. Definición de Modelos de Datos por el Usuario
Interfaz: Implementar una sección dentro de la interfaz de administración web (basada en vistas y plantillas Django personalizadas) donde los usuarios autenticados puedan definir sus propios modelos de datos.
Mecanismo de Definición: Los usuarios deben poder especificar:
Nombre del Modelo (e.g., "Cliente", "Producto"). Este nombre se usará para generar un slug único para la URL de la API.
Campos del Modelo: Para cada campo, deben poder definir:
Nombre del Campo (e.g., "nombre", "email", "precio", "fecha_registro", "activo").
Tipo de Dato del Campo (ver sección 2).
Si el campo es obligatorio (is_required).
Almacenamiento de Definiciones:
Se crearán modelos Django para almacenar estas definiciones:
DynamicModelDefinition(user_owner, name, slug, description): Almacena la definición general del modelo.
DynamicFieldDefinition(model_definition, name, data_type, related_model_definition=ForeignKey('DynamicModelDefinition', null=True, blank=True, on_delete=models.SET_NULL), is_required): Almacena la definición de cada campo.
Almacenamiento de Datos de Instancias:
Los datos de las instancias de estos modelos dinámicos se almacenarán utilizando un modelo genérico con un campo JSONField.
DynamicModelInstance(model_definition_fk, data_json): Donde model_definition_fk es una ForeignKey a DynamicModelDefinition y data_json almacena los datos del registro como un objeto JSON.
Generación Dinámica: La plataforma debe tomar esta definición y permitir la creación de instancias de estos modelos. No se generarán tablas SQL físicas por cada modelo de usuario; se utilizará el enfoque de DynamicModelInstance con JSONField.
2. Tipos de Datos Soportados Inicialmente
El sistema de definición de modelos debe soportar, como mínimo, los siguientes tipos de datos básicos:
Texto: Cadena de caracteres (string).
Número Entero: Integer.
Número Decimal: Float/Decimal (precisión adecuada para valores monetarios).
Fecha: Date/DateTime.
Booleano: True/False.
Relaciones (ForeignKey):
Permitir la definición de relaciones entre modelos creados por el usuario (representando relaciones uno-a-muchos).
En la interfaz de DynamicFieldDefinition, al seleccionar "Relación" como tipo de dato, el usuario podrá seleccionar otro DynamicModelDefinition existente (creado por el mismo usuario o al que tenga acceso, a definir).
En el JSONField de DynamicModelInstance, la relación se almacenará guardando el id (PK) de la instancia del DynamicModelInstance relacionado y, opcionalmente, el slug del DynamicModelDefinition del modelo relacionado para facilitar la resolución.
Los serializers de la API deberán poder resolver estas relaciones en las respuestas GET (e.g., mostrando el objeto relacionado anidado o un hipervínculo al mismo).
3. Generación Automática de Endpoints API RESTful
Por cada DynamicModelDefinition creado por un usuario, la plataforma debe generar automáticamente un conjunto de endpoints API RESTful que permitan operaciones CRUD sobre las instancias (DynamicModelInstance) de ese modelo.
Patrones de URL: Seguir convenciones REST estándar:
/api/v1/user_models/<model_slug>/ para colecciones.
/api/v1/user_models/<model_slug>/<instance_id>/ para registros individuales.
Implementación: Se deben implementar un DynamicModelViewSet y un DynamicModelSerializer genéricos.
DynamicModelViewSet: Se configurará en tiempo de ejecución basado en el model_slug de la URL, cargando la DynamicModelDefinition y DynamicFieldDefinition correspondientes para determinar el comportamiento y la validación.
DynamicModelSerializer: Creará sus campos dinámicamente basándose en los DynamicFieldDefinition del modelo asociado. Realizará la validación de datos según el tipo y si es requerido.
4. Configuración Granular de Endpoints
Control por Método HTTP: La interfaz de administración debe permitir a los usuarios (dueños del modelo) configurar, para cada uno de sus DynamicModelDefinition, cuáles métodos HTTP están permitidos:
GET (Leer lista, Leer detalle)
POST (Crear)
PUT (Actualizar completo)
PATCH (Actualizar parcial)
DELETE (Eliminar)
Persistencia: Esta configuración se almacenará (posiblemente en DynamicModelDefinition o un modelo relacionado) y se aplicará en tiempo real a las solicitudes API mediante una clase de permiso personalizada en DRF.
5. Autenticación Basada en JWT
Autenticación de Plataforma: Los usuarios deben poder registrarse e iniciar sesión en la plataforma de administración web (aplicación Django estándar).
Tokens JWT: Implementar autenticación basada en JSON Web Tokens (JWT) para las solicitudes a la API RESTful generada, utilizando djangorestframework-simplejwt.
Los tokens JWT deben estar asociados a los usuarios registrados en la plataforma.
Proveer un endpoint (e.g., /api/token/ y /api/token/refresh/) para que los usuarios autenticados (vía usuario/contraseña de la plataforma) puedan obtener/refrescar sus tokens JWT.
Las solicitudes a los endpoints de API generados (/api/v1/user_models/...) deben requerir un token JWT válido en el header Authorization: Bearer <token>.
6. Permisos Granulares por Usuario para APIs
Control de Acceso: Implementar un sistema de permisos que permita al "dueño" de un DynamicModelDefinition restringir qué otros usuarios autenticados (identificados por su JWT) pueden realizar qué acciones (métodos HTTP permitidos) sobre los endpoints de ese modelo específico.
Modelo de Permisos: Crear un modelo Django, por ejemplo:
APIUserPermission(user_granted_fk, dynamic_model_fk, can_get, can_post, can_put, can_patch, can_delete)
Donde user_granted_fk es el usuario al que se le otorga el permiso, y dynamic_model_fk es el modelo sobre el cual se otorga. Los campos can_get, etc., son booleanos.
Configuración: La interfaz de administración debe permitir al dueño del modelo asignar estos permisos.
Implementación: Se desarrollará una clase de permiso DRF personalizada que verifique estos APIUserPermission además de la configuración global de métodos HTTP del modelo (punto 4).
7. Interfaz de Usuario (Administración Web)
Tecnología: Utilizar el framework Django y sus plantillas estándar (HTML, CSS, JS básico si es necesario) para construir toda la interfaz de administración web.
Funcionalidad: Esta interfaz debe permitir a los usuarios:
Registrarse e iniciar sesión.
Definir y modificar sus DynamicModelDefinition y DynamicFieldDefinition (ver punto 1).
Configurar los métodos HTTP permitidos por DynamicModelDefinition (ver punto 4).
Gestionar APIUserPermission para sus modelos (ver punto 6).
(Opcional, pero deseable) Visualizar/Gestionar los datos (DynamicModelInstance) almacenados a través de sus APIs mediante una interfaz simple.
(Opcional, pero deseable) Obtener/Renovar sus tokens JWT desde la interfaz web.
Flujo de Ejemplo (a documentar en el Readme):
Usuario se registra/loguea.
Navega a "Mis Modelos" -> "Crear Nuevo Modelo".
Ingresa nombre "Producto", añade campos "nombre_producto" (Texto, requerido), "precio" (Número Decimal, requerido), "en_stock" (Booleano).
Guarda el modelo. Se muestra la URL base de la API (e.g., /api/v1/user_models/producto/).
Navega a "Configurar API" para "Producto" y desactiva DELETE.
Navega a "Permisos API" para "Producto" y otorga permiso de GET a UsuarioB.
8. Flexibilidad de Base de Datos
Base de Datos Principal: Configurar el proyecto para usar PostgreSQL como la base de datos por defecto.
Compatibilidad: Asegurar que la implementación (principalmente a través del ORM de Django) sea compatible con otras bases de datos soportadas por Django, permitiendo cambiar la configuración en settings.py.
Stack Tecnológico Sugerido
Backend: Python 3.x (especificar versión, e.g., 3.9+)
Framework Web/API: Django (especificar versión, e.g., 4.x), Django REST Framework (DRF)
Base de Datos: PostgreSQL (preferida), con compatibilidad para otras vía Django ORM.
Autenticación JWT: djangorestframework-simplejwt.
Interfaz: Plantillas estándar de Django (HTML, CSS, JS básico).
Consideraciones Adicionales
Seguridad: Implementar medidas de seguridad estándar (protección CSRF en la admin web, validación de entradas exhaustiva, manejo seguro de JWT, uso del ORM para prevenir SQL Injection).
Validación: Incluir validación de datos tanto en la definición de modelos (e.g., nombres únicos, tipos válidos) como en las solicitudes API (basado en DynamicFieldDefinition).
Manejo de Errores: Proveer respuestas de error claras y estandarizadas en la API (DRF lo facilita).
Documentación de API:
Considerar el uso de drf-spectacular o drf-yasg. Si la naturaleza dinámica de los endpoints dificulta la auto-generación completa, proveer una guía básica o una sección en la UI que describa cómo acceder y usar las APIs generadas por el usuario.
Migraciones: Utilizar el sistema de migraciones de Django para gestionar los cambios en los modelos base de la plataforma (e.g., User, DynamicModelDefinition, DynamicFieldDefinition, DynamicModelInstance, APIUserPermission).
Entregables Esperados
Código fuente completo de la aplicación Django.
Archivo requirements.txt con todas las dependencias y sus versiones exactas.
Archivo Readme.md detallado, que incluya:
Descripción general del proyecto y sus características.
Instrucciones claras para la configuración del entorno de desarrollo local.
Instalación de dependencias.
Configuración de la base de datos PostgreSQL (incluyendo creación de usuario y base de datos si es necesario).
Ejecución de migraciones.
Instrucciones para crear un superusuario inicial para la plataforma.
Arranque del servidor de desarrollo.
Ejemplos de solicitudes curl para:
Registrar un nuevo usuario (si se expone vía API, o indicar hacerlo vía UI).
Obtener un token JWT.
Refrescar un token JWT.
Definir un modelo simple (si se expone vía API, o indicar hacerlo vía UI).
Realizar operaciones CRUD (POST, GET lista, GET detalle, PUT/PATCH, DELETE) en un endpoint de un modelo dinámicamente creado, incluyendo el header de autorización JWT.
Breve descripción del flujo de usuario para definir modelos y configurar APIs (como el del punto 7).