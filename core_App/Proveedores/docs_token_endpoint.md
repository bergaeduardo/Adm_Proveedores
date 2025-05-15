# Documentación del endpoint de autenticación JWT

## Endpoint
`POST /Proveedores/api/token/`

## Descripción
Permite a un usuario registrado obtener un token JWT (access y refresh) enviando sus credenciales.

## Parámetros requeridos (JSON)
- `username`: Nombre de usuario registrado (string, requerido)
- `password`: Contraseña del usuario (string, requerido)

### Ejemplo de solicitud
```json
POST /Proveedores/api/token/
Content-Type: application/json

{
  "username": "usuario1",
  "password": "contraseña123"
}
```

## Respuesta exitosa (200 OK)
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Códigos de error posibles

- **401 Unauthorized**  
  Credenciales inválidas.
  ```json
  {
    "detail": "No active account found with the given credentials"
  }
  ```

- **400 Bad Request**  
  Faltan campos obligatorios.
  ```json
  {
    "username": ["This field is required."],
    "password": ["This field is required."]
  }
  ```

## Notas
- El endpoint no modifica ninguna configuración ni lógica existente.
- Utiliza el sistema de autenticación y usuarios estándar de Django.
- El token `access` se usa para autenticar solicitudes protegidas; el `refresh` permite obtener nuevos tokens de acceso.
