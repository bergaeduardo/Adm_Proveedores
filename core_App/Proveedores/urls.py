from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import (
  ProveedorViewSet,
  ProveedorRegistroView,
  UserIdView,
  validar_cuit,
  ProvinciaListView,
  CambiarConexionView,
  CategoriaIVAListView,
  IngresosBrutosListView,
  ComprobanteViewSet,
  CpaContactosProveedorHabitualViewSet
)
from .views import register, login_view, mis_datos_view, dashboard_view
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'comprobantes', ComprobanteViewSet, basename='comprobante')
router.register(r'proveedor-contactos', CpaContactosProveedorHabitualViewSet, basename='proveedorcontacto')

urlpatterns = [
  path('registro/', register, name='registro-proveedor-form'),
  path('acceder/', login_view, name='acceder-proveedor-form'),
  path('mis-datos/', mis_datos_view, name='mis-datos-proveedor'),
  path('dashboard/', dashboard_view, name='dashboard'),

  # Nueva ruta para la plantilla de comprobantes
  path('comprobantes/', TemplateView.as_view(template_name='comprobantes.html'), name='comprobantes'),

  # API endpoints
  path('api/registro/', ProveedorRegistroView.as_view(), name='registro-proveedor'),
  path('api/', include(router.urls)),
  path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('api/userid/', UserIdView.as_view(), name='user_id'),
  path('api/validar-cuit/', validar_cuit, name='validar_cuit'),
  path('api/provincias/', ProvinciaListView.as_view(), name='provincia_list'),  
  path('api/cambiar-conexion/', CambiarConexionView.as_view(), name='cambiar-conexion'),
  path('api/categoria-iva/', CategoriaIVAListView.as_view(), name='categoria_iva_list'),
  path('api/ingresos-brutos/', IngresosBrutosListView.as_view(), name='ingresos_brutos_list'),
]
