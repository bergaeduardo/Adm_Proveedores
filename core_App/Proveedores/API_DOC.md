# Flujo validado de autenticación y obtención de datos de proveedor

## 1. Login y obtención de token
- El usuario ingresa credenciales en el formulario.
- El frontend envía POST a `/Proveedores/api/token/`.
- El backend valida y responde con un JWT.

## 2. Redirección
- Si el login es exitoso, el frontend guarda el JWT en sessionStorage y redirige a `/Proveedores/mis-datos/`.

## 3. Petición de datos de proveedor
- El frontend hace GET a `/Proveedores/api/proveedores/` con el header `Authorization: Bearer <jwt>`.

## 4. Obtención del id de usuario
- El backend extrae el usuario autenticado del JWT (`request.user`).
- Obtiene el id: `user.id`.

## 5. Búsqueda de proveedor
- El backend filtra: `Proveedor.objects.filter(username_django_id=user.id)`.
- Solo devuelve los proveedores vinculados a ese usuario.

## 6. Visualización
- El frontend muestra los datos recibidos.

## Notas de seguridad
- El backend nunca expone datos de otros usuarios.
- El frontend no necesita conocer el id del usuario, solo el JWT.
- El endpoint PATCH también valida que el proveedor pertenezca al usuario autenticado.

## Ejemplo de respuesta de `/api/proveedores/`
```json
[
  {
    "id": 12,
    "nom_provee": "Proveedor Ejemplo",
    "n_cuit": "20304050607",
    "e_mail": "proveedor@ejemplo.com",
    ...
    "username_django": 8
  }
]
```
