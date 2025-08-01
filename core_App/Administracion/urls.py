from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import api # Import the new api.py

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'proveedores', api.AdministracionProveedorViewSet)
router.register(r'contactos', api.AdministracionCpaContactosProveedorHabitualViewSet)
router.register(r'comprobantes', api.AdministracionComprobanteViewSet)

app_name = 'administracion' # Define app_name for namespaced URLs

urlpatterns = [
    # API URLs
    path('api/', include(router.urls)),
    path('api/provincias/', api.AdministracionProvinciaListView.as_view(), name='api-provincias'),
    path('api/categorias-iva/', api.AdministracionCategoriaIVAListView.as_view(), name='api-categorias-iva'),
    path('api/ingresos-brutos/', api.AdministracionIngresosBrutosListView.as_view(), name='api-ingresos-brutos'),
    path('api/resumen-cuenta/', api.AdministracionResumenCuentaProveedorView.as_view(), name='api-resumen-cuenta'),
    path('api/proveedor-search/', api.AdministracionProveedorSearchView.as_view(), name='api-proveedor-search'), # New search API

    # Template URLs (assuming simple rendering views exist or will be added)
    # These views would typically just render the HTML templates
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('mis-datos/', views.mis_datos_view, name='mis-datos'),
    path('comprobantes/', views.comprobantes_view, name='comprobantes'),
    path('resumen-cuenta/', views.resumen_cuenta_view, name='resumen-cuenta'), # Assuming a view for this template
]
