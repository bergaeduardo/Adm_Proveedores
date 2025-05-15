from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import ProveedorViewSet, ProveedorRegistroView
from .views import register,login_view  # Importar la vista que renderiza el formulario

# Importar la vista estándar de SimpleJWT
from rest_framework_simplejwt.views import TokenObtainPairView

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')

urlpatterns = [
  # Ruta para el formulario HTML de registro
  path('registro/', register, name='registro-proveedor-form'),

  # Ruta para el formulario HTML de acceso
  path('acceder/', login_view, name='acceder-proveedor-form'),

  # API RESTful para registro y CRUD
  path('api/registro/', ProveedorRegistroView.as_view(), name='registro-proveedor'),
  path('api/', include(router.urls)),

  # Nuevo endpoint: obtención de token JWT
  path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
]
