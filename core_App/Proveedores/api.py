"""
Vistas API RESTful para el modelo Proveedor y registro de usuario.
Permite operaciones CRUD y registro conjunto.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Proveedor, Comprobante
from consultasTango.models import Cpa57
from drf_spectacular.utils import extend_schema, OpenApiExample
from .serializers import ProveedorRegistroSerializer, ProveedorSerializer, ComprobanteSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from django.db import connections
from rest_framework.decorators import api_view

class ComprobanteViewSet(viewsets.ModelViewSet):
  serializer_class = ComprobanteSerializer
  permission_classes = [IsAuthenticated]
  parser_classes = [MultiPartParser, FormParser]

  def get_queryset(self):
    # Solo comprobantes del proveedor autenticado
    user = self.request.user
    proveedor = getattr(user, 'proveedores', None)
    if proveedor:
      return Comprobante.objects.filter(proveedor=proveedor.first())
    return Comprobante.objects.none()

  def perform_create(self, serializer):
    user = self.request.user
    proveedor = user.proveedores.first()
    serializer.save(proveedor=proveedor)

Ingresos_brutos = {
  '': '',
  'L': 'Local',
  'M': 'Multilateral',
  'S': 'Reg. simplificado',
}

class ProveedorViewSet(viewsets.ModelViewSet):
  serializer_class = ProveedorSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    user = self.request.user
    # DEBUG: imprime el usuario autenticado y el queryset
    print(f"Usuario autenticado: {user} (id={user.id})")
    qs = Proveedor.objects.filter(username_django_id=user.id)
    print(f"Proveedores encontrados para user.id={user.id}: {[p.id for p in qs]}")
    return qs

  def list(self, request, *args, **kwargs):
    # DEBUG extra: muestra el usuario y el queryset en la respuesta
    queryset = self.get_queryset()
    serializer = self.get_serializer(queryset, many=True)
    return Response({
      "user_id": request.user.id,
      "proveedores": serializer.data
    })

  def update(self, request, *args, **kwargs):
    instance = self.get_object()
    if instance.username_django_id != request.user.id:
      return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)
    return super().update(request, *args, **kwargs)

class ProveedorRegistroView(APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    serializer = ProveedorRegistroSerializer(data=request.data)
    if serializer.is_valid():
      result = serializer.save()
      # DEBUG: muestra el id del usuario y del proveedor creado
      print(f"Usuario creado: {result['user'].id}, Proveedor creado: {result['proveedor'].id}, username_django={result['proveedor'].username_django_id}")
      return Response({'msg': 'Proveedor y usuario creados correctamente.'}, status=201)
    return Response(serializer.errors, status=400)
  
  # Endpoint para obtener el user_id autenticado
class UserIdView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    return Response({'user_id': request.user.id})

class ProvinciaListView(APIView):
  def get(self, request):
    query = request.GET.get('q', '')
    provincias = Cpa57.objects.filter(nom_provin__icontains=query).values('id_cpa57', 'cod_provin', 'nom_provin')
    data = [{'id': p['id_cpa57'], 'display': f"{p['nom_provin']}"} for p in provincias]
    return Response(data, status=status.HTTP_200_OK)
  
class CategoriaIVAListView(APIView):
  def get(self, request):
    with connections['sqlserver'].cursor() as cursor:
      cursor.execute("SELECT ID_CATEGORIA_IVA, COD_CATEGORIA_IVA, DESC_CATEGORIA_IVA FROM CATEGORIA_IVA")
      rows = cursor.fetchall()
      data = [
        {
          "id_categoria_iva": row[0],
          "cod_categoria_iva": row[1],
          "desc_categoria_iva": row[2]
        }
        for row in rows
      ]
    return Response(data)

def cambiar_conexion(conection, nombre_db):
  if conection == 'sqlserver':
      settings.DATABASES[conection]['NAME'] = nombre_db
      print('Cambiando base de datos a ' + conection + '.'+ nombre_db)
  elif conection == 'mi_db_4':
      settings.DATABASES[conection]['NAME'] = nombre_db
      print('Cambiando base de datos a ' + conection + '.'+ nombre_db)


class CambiarConexionView(APIView):
  def post(self, request):
    cod_pais = request.data.get('cod_pais', 'AR')  # Valor por defecto AR
    connection = 'sqlserver'
    
    if cod_pais == 'UR':
      cambiar_conexion(connection, 'TASKY_SA')
    else:
      cambiar_conexion(connection, 'Empresa_Ejemplo')
    
    return Response({'msg': 'Conexión cambiada correctamente.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def validar_cuit(request):
  """
  Endpoint para validar si un CUIT ya existe.
  Recibe ?n_cuit=XX-XXXXXXXX-X y responde {"exists": true/false}
  """
  n_cuit = request.GET.get('n_cuit')
  exists = False
  if n_cuit:
    exists = Proveedor.objects.filter(n_cuit=n_cuit).exists()
  return Response({'exists': exists})

# CRUD clásico (opcional, para otros endpoints)
class ProveedorViewSet(viewsets.ModelViewSet):
  queryset = Proveedor.objects.all()
  serializer_class = ProveedorSerializer

class IngresosBrutosListView(APIView):
  def get(self, request):
    data = [{'Cod_Ingresos_brutos': key, 'Desc_Ingresos_brutos': value} for key, value in Ingresos_brutos.items()]
    return Response(data, status=status.HTTP_200_OK)
