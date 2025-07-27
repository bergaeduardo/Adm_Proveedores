from django.contrib import admin
from django.urls import path, include
from Proveedores.views import login_view
from consultasTango.views import lista_usuarios_tango
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', login_view, name='acceder-proveedor-form'),
    path('admin/', admin.site.urls),
    path('Proveedores/', include('Proveedores.urls')),
    path('administracion/', include('Administracion.urls')),
    path('api/usuarios-tango/', lista_usuarios_tango, name='lista_usuarios_tango'),
]

if settings.DEBUG:
  urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
