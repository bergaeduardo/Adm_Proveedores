"""
Vistas API RESTful para el modelo Proveedor y registro de usuario.
Permite operaciones CRUD y registro conjunto.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Proveedor
from drf_spectacular.utils import extend_schema, OpenApiExample
from .serializers import ProveedorRegistroSerializer, ProveedorSerializer

# Importar JWT
from rest_framework_simplejwt.tokens import RefreshToken

class ProveedorRegistroView(APIView):
  """
  API para registrar usuario, proveedor y generar token JWT.
  """
  
  def post(self, request, *args, **kwargs):
    serializer = ProveedorRegistroSerializer(data=request.data)
    if serializer.is_valid():
      resultado = serializer.save()
      user = resultado['user']
      proveedor = resultado['proveedor']
      # Generar JWT
      refresh = RefreshToken.for_user(user)
      return Response({
        'mensaje': '¡Registro exitoso!',
        'refresh': str(refresh),
        'access': str(refresh.access_token)
      }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# CRUD clásico (opcional, para otros endpoints)
class ProveedorViewSet(viewsets.ModelViewSet):
  queryset = Proveedor.objects.all()
  serializer_class = ProveedorSerializer
