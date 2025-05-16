from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import ProveedorViewSet, ProveedorRegistroView,UserIdView
from .views import register,login_view,mis_datos_view  # Importar la vista que renderiza el formulario
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Importar la vista estándar de SimpleJWT
from rest_framework_simplejwt.views import TokenObtainPairView

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')

urlpatterns = [
  path('registro/', register, name='registro-proveedor-form'),
  path('acceder/', login_view, name='acceder-proveedor-form'),
  path('mis-datos/', mis_datos_view, name='mis-datos-proveedor'),
  path('api/registro/', ProveedorRegistroView.as_view(), name='registro-proveedor'),
  path('api/', include(router.urls)),
  path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('api/userid/', UserIdView.as_view(), name='user_id'),  # Nuevo endpoint
]
