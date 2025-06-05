from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual 
from consultasTango.models import Cpa57 # Asegúrate que esta importación sea correcta para tu proyecto
from .serializers import ProveedorRegistroSerializer, ProveedorSerializer, ComprobanteSerializer, CpaContactosProveedorHabitualSerializer
from django.contrib.auth.models import User
from django.conf import settings
from django.db import connections
from rest_framework.decorators import api_view
import os
from django.utils import timezone
import re # Para validación de CUIT en ProveedorRegistroSerializer

# No necesitas definir ProveedorViewSet dos veces. Usa la que ya está configurada para el router.
# class ProveedorViewSet(viewsets.ModelViewSet):
#   queryset = Proveedor.objects.all()
#   serializer_class = ProveedorSerializer

class CpaContactosProveedorHabitualViewSet(viewsets.ModelViewSet):
    serializer_class = CpaContactosProveedorHabitualSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Solo devolver contactos del usuario autenticado
        user = self.request.user
        # Es importante que el related_name esté bien o usar el nombre por defecto
        # (modelo_en_minusculas_set)
        # O filtrar directamente por el campo:
        return CpaContactosProveedorHabitual.objects.filter(username_django=user)

    def perform_create(self, serializer):
        # El serializer ya maneja la asignación de username_django y cod_provee en su método create
        # gracias al context que le pasamos.
        serializer.save()

    def perform_update(self, serializer):
        # No se necesita lógica adicional aquí si el serializer maneja la conversión S/N
        serializer.save()


class ComprobanteViewSet(viewsets.ModelViewSet):
  serializer_class = ComprobanteSerializer
  permission_classes = [IsAuthenticated]
  parser_classes = [MultiPartParser, FormParser]

  def get_queryset(self):
    user = self.request.user
    # Asegúrate de que la relación inversa 'proveedores' exista en el modelo User o que uses el campo correcto.
    # Si Proveedor tiene un ForeignKey a User llamado 'username_django', entonces:
    try:
      proveedor_instance = Proveedor.objects.get(username_django=user)
      return Comprobante.objects.filter(proveedor=proveedor_instance)
    except Proveedor.DoesNotExist:
      return Comprobante.objects.none()

  def perform_create(self, serializer):
    user = self.request.user
    try:
      proveedor_instance = Proveedor.objects.get(username_django=user)
      serializer.save(proveedor=proveedor_instance)
    except Proveedor.DoesNotExist:
      # Esto no debería ocurrir si el usuario autenticado siempre tiene un proveedor asociado para esta acción.
      # Considera cómo manejar este caso: ¿error o creación implícita de proveedor?
      # Por ahora, asumimos que el proveedor existe.
      pass 


Ingresos_brutos = {
  '': '',
  'L': 'Local',
  'M': 'Multilateral',
  'S': 'Reg. simplificado',
}

class ProveedorViewSet(viewsets.ModelViewSet): # Esta es la que se registra en el router
  serializer_class = ProveedorSerializer
  permission_classes = [IsAuthenticated]
  parser_classes = [MultiPartParser, FormParser] # Esencial para file uploads

  def get_queryset(self):
    user = self.request.user
    # Asume que hay una relación directa o inversa desde User a Proveedor.
    # Si Proveedor.username_django es un ForeignKey a User:
    return Proveedor.objects.filter(username_django=user)

  def partial_update(self, request, *args, **kwargs):
    instance = self.get_object()
    # Verificar que el usuario que hace el request es el "dueño" del proveedor
    if instance.username_django != request.user:
      return Response({'detail': 'No tiene permiso para modificar este proveedor.'}, status=status.HTTP_403_FORBIDDEN)

    # Mapeo de IDs de input del frontend a nombres de campos del modelo Proveedor
    file_field_map = {
        'cuitFile': 'cuit_file',
        'ingBrutosFile': 'ing_brutos_file',
        'exclGananciasFile': 'excl_ganancias_file',
        'cm05File': 'cm05_file',
        'noRetGananciasFile': 'no_ret_ganancias_file',
        'exclIIBBFile': 'excl_iibb_file',
        'noRetIIBBFile': 'no_ret_iibb_file',
    }

    data_for_serializer = request.data.copy() # Copiar para poder modificarlo
    files_updated_this_request = {} # Para saber qué archivos se actualizaron
    now = timezone.now()

    max_file_size = 5 * 1024 * 1024  # 5MB
    allowed_content_types = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    for frontend_key, model_field_name in file_field_map.items():
        uploaded_file = request.FILES.get(frontend_key)
        if uploaded_file:
            if uploaded_file.size > max_file_size:
                return Response({frontend_key: f'El archivo es demasiado grande (máx. {max_file_size // (1024*1024)}MB).'}, status=status.HTTP_400_BAD_REQUEST)
            if uploaded_file.content_type not in allowed_content_types:
                return Response({frontend_key: f'Tipo de archivo no permitido ({uploaded_file.content_type}). Permitidos: PDF, JPG, PNG, DOC, DOCX.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Asignar el archivo al campo correspondiente en data_for_serializer para que el serializador lo procese
            data_for_serializer[model_field_name] = uploaded_file
            data_for_serializer[model_field_name + '_updated_at'] = now
            files_updated_this_request[model_field_name] = uploaded_file.name # Guardar nombre para la respuesta
            
            # Si el frontend_key (ej. 'cuitFile') también está en request.data (como string vacío o placeholder),
            # es mejor quitarlo de data_for_serializer si ya se está manejando como archivo.
            if frontend_key in data_for_serializer:
                 del data_for_serializer[frontend_key]


    serializer = self.get_serializer(instance, data=data_for_serializer, partial=True)
    serializer.is_valid(raise_exception=True)
    self.perform_update(serializer) # Esto guarda la instancia con los archivos y otros datos

    # Preparar datos de documentos para la respuesta, incluyendo URLs de los archivos actualizados
    # y nombres/URLs de los archivos que ya existían y no se modificaron.
    # El ProveedorSerializer con SerializerMethodFields para las URLs se encargará de esto.
    # Solo necesitamos asegurar que la instancia 'instance' está actualizada antes de re-serializar.
    
    # Re-obtener la instancia para asegurar que todos los campos (incluyendo URLs de archivos) estén actualizados
    updated_instance = self.get_object()
    response_serializer = self.get_serializer(updated_instance) # Usar el serializer para obtener los datos actualizados
    
    return Response(response_serializer.data)


  def perform_update(self, serializer):
    serializer.save()

  def create(self, request, *args, **kwargs):
    # Asumimos que la creación de proveedor está ligada al registro de usuario
    # y se maneja por ProveedorRegistroView.
    # Si se permite crear un proveedor para un usuario ya existente:
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    # Asegurarse de que el usuario no tenga ya un proveedor si la relación es OneToOne
    if Proveedor.objects.filter(username_django=request.user).exists():
        return Response({"detail": "Este usuario ya tiene un proveedor asociado."}, status=status.HTTP_400_BAD_REQUEST)
    serializer.save(username_django=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProveedorRegistroView(APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    serializer = ProveedorRegistroSerializer(data=request.data)
    if serializer.is_valid():
      result = serializer.save()
      return Response({'msg': 'Proveedor y usuario creados correctamente.', 'user_id': result['user'].id, 'proveedor_id': result['proveedor'].id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
  
class UserIdView(APIView):
  permission_classes = [IsAuthenticated]
  def get(self, request):
    return Response({'user_id': request.user.id})

class ProvinciaListView(APIView):
  permission_classes = [IsAuthenticated] # O AllowAny si es pública
  def get(self, request):
    query = request.GET.get('q', '')
    # Asegúrate que Cpa57 y su manager 'objects' estén bien definidos
    provincias = Cpa57.objects.filter(nom_provin__icontains=query).values('id_cpa57', 'cod_provin', 'nom_provin')[:50] # Limitar resultados
    data = [{'id': p['id_cpa57'], 'display': f"{p['nom_provin']}"} for p in provincias]
    return Response(data, status=status.HTTP_200_OK)
  
class CategoriaIVAListView(APIView):
  permission_classes = [IsAuthenticated] # O AllowAny
  def get(self, request):
    try:
      with connections['sqlserver'].cursor() as cursor: # Asumiendo que 'sqlserver' es el alias de tu DB externa
        cursor.execute("SELECT ID_CATEGORIA_IVA, COD_CATEGORIA_IVA, DESC_CATEGORIA_IVA FROM CATEGORIA_IVA")
        rows = cursor.fetchall()
        data = [{"id_categoria_iva": row[0], "cod_categoria_iva": row[1], "desc_categoria_iva": row[2]} for row in rows]
      return Response(data)
    except Exception as e:
      return Response({"error": f"Error al conectar con la base de datos externa: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def cambiar_conexion_db(alias_db, nombre_db_nuevo): # Renombrada para evitar conflicto
  try:
    if alias_db in settings.DATABASES:
        settings.DATABASES[alias_db]['NAME'] = nombre_db_nuevo
        # Forzar el cierre de conexiones antiguas para que se restablezcan con el nuevo nombre
        connections[alias_db].close() 
        print(f'Cambiando base de datos para la conexión "{alias_db}" a "{nombre_db_nuevo}"')
        return True
    else:
        print(f'Alias de conexión "{alias_db}" no encontrado en settings.DATABASES.')
        return False
  except Exception as e:
    print(f"Error al cambiar la conexión {alias_db} a {nombre_db_nuevo}: {e}")
    return False

class CambiarConexionView(APIView):
  permission_classes = [IsAuthenticated] # Proteger este endpoint
  def post(self, request):
    cod_pais = request.data.get('cod_pais', 'AR')
    connection_alias = 'sqlserver' # El alias de la conexión en settings.DATABASES
    
    db_name = 'Empresa_Ejemplo' # DB por defecto (AR)
    if cod_pais == 'UR':
      db_name = 'TASKY_SA'
    
    if cambiar_conexion_db(connection_alias, db_name):
      return Response({'msg': f'Conexión para {connection_alias} cambiada a {db_name} correctamente.'}, status=status.HTTP_200_OK)
    else:
      return Response({'error': f'No se pudo cambiar la conexión para {connection_alias}.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])

def validar_cuit(request):
  n_cuit = request.GET.get('n_cuit')
  exists = False
  if n_cuit:
    exists = Proveedor.objects.filter(n_cuit=n_cuit).exists()
  return Response({'exists': exists})

class IngresosBrutosListView(APIView):
  permission_classes = [IsAuthenticated] # O AllowAny
  def get(self, request):
    data = [{'Cod_Ingresos_brutos': key, 'Desc_Ingresos_brutos': value} for key, value in Ingresos_brutos.items()]
    return Response(data, status=status.HTTP_200_OK)
