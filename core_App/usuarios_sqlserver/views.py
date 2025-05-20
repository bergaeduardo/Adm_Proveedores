from django.http import JsonResponse
from .models import SofUsuario

def lista_usuarios_sqlserver(request):
    usuarios = SofUsuario.objects.using('sqlserver').all()
    data = [
        {
            "id": usuario.id,
            "nombre": usuario.nombre,
            # Agrega aquí los demás campos que quieras exponer
        }
        for usuario in usuarios
    ]
    return JsonResponse(data, safe=False)
