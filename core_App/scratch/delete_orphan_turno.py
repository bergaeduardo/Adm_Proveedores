import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_App.settings')
django.setup()

from Proveedores.models import Turno

# Borrar el turno de prueba que quedó huérfano
oc_a_borrar = '0000100015060'
deleted_count, _ = Turno.objects.filter(nro_orden_co=oc_a_borrar).delete()

print(f"Se eliminaron {deleted_count} turnos con la OC {oc_a_borrar}")
