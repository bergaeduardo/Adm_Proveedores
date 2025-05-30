from django.contrib import admin
from django.urls import path, include
from Proveedores.views import login_view
from consultasTango.views import lista_usuarios_tango

urlpatterns = [
    path('', login_view, name='acceder-proveedor-form'),
    path('admin/', admin.site.urls),
    path('Proveedores/', include('Proveedores.urls')),
    path('api/usuarios-tango/', lista_usuarios_tango, name='lista_usuarios_tango'),
]
