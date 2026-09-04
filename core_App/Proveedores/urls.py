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
  CpaContactosProveedorHabitualViewSet,
  ResumenCuentaProveedorView,
  OrdenesCompraView,
  OrdenCompraItemsView,
  TurnoViewSet
)
from .views import register, login_view, mis_datos_view, dashboard_view, solicitar_turno_view, turnero_view
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'comprobantes', ComprobanteViewSet, basename='comprobante')
router.register(r'proveedor-contactos', CpaContactosProveedorHabitualViewSet, basename='proveedorcontacto')
router.register(r'turnos', TurnoViewSet, basename='turno')

urlpatterns = [
  path('registro/', register, name='registro-proveedor-form'),
  path('acceder/', login_view, name='acceder-proveedor-form'),
  path('mis-datos/', mis_datos_view, name='mis-datos-proveedor'),
  path('dashboard/', dashboard_view, name='dashboard'),
  path('turnero/', turnero_view, name='turnero'),
  path('solicitar-turno/', solicitar_turno_view, name='solicitar-turno'),
  path('comprobantes/', TemplateView.as_view(template_name='comprobantes.html'), name='comprobantes'),
  path('resumen-cuenta/', TemplateView.as_view(template_name='resumen_cuenta.html'), name='resumen-cuenta'),

  # API endpoints
  path('api/registro/', ProveedorRegistroView.as_view(), name='registro-proveedor'),
  path('api/proveedores/resumen-cuenta/', ResumenCuentaProveedorView.as_view(), name='api-resumen-cuenta'),
  path('api/', include(router.urls)),
  path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('api/userid/', UserIdView.as_view(), name='user_id'),
  path('api/validar-cuit/', validar_cuit, name='validar_cuit'),
  path('api/provincias/', ProvinciaListView.as_view(), name='provincia_list'),  
  path('api/cambiar-conexion/', CambiarConexionView.as_view(), name='cambiar-conexion'),
  path('api/categoria-iva/', CategoriaIVAListView.as_view(), name='categoria_iva_list'),
  path('api/ingresos-brutos/', IngresosBrutosListView.as_view(), name='ingresos_brutos_list'),
  path('api/ordenes-compra/', OrdenesCompraView.as_view(), name='ordenes_compra'),
  path('api/ordenes-compra/<str:nro_oc>/items/', OrdenCompraItemsView.as_view(), name='ordenes_compra_items'),
]
