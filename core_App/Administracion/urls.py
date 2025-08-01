from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api

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
    path('api/proveedor-search/', api.AdministracionProveedorSearchView.as_view(), name='api-proveedor-search'),
]
