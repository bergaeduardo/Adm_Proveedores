from django.contrib import admin
from .models import Proveedor

class ProveedorAdmin(admin.ModelAdmin):
  list_display = (
    'nom_provee',        # Nombre del proveedor
    'n_cuit',            # CUIT
    'domicilio',         # Domicilio
    'localidad',         # Localidad
    'telefono_1',        # Teléfono principal
    'e_mail',            # Email
    'fecha_alta',        # Fecha de alta
    'username_django',   # Usuario Django relacionado
  )
  search_fields = ('nom_provee', 'n_cuit', 'e_mail', 'localidad')
  list_filter = ('localidad', 'fecha_alta')

admin.site.register(Proveedor, ProveedorAdmin)
