from django.http import JsonResponse
from .models import SofUsuarios

def lista_usuarios_tango(request):
    usuarios = SofUsuarios.objects.using('sqlserver').all()
    data = [
        {
            "id": usuario.id,
            "nombre": usuario.nombre,
            # Agrega aquí los demás campos que quieras exponer
        }
        for usuario in usuarios
    ]
    return JsonResponse(data, safe=False)
