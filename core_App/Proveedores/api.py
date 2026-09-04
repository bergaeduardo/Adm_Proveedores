from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual, Turno, TurnoItem
from consultasTango.models import Cpa57 # Asegúrate que esta importación sea correcta para tu proyecto
from .serializers import (
    ProveedorRegistroSerializer, ProveedorSerializer, ComprobanteSerializer, 
    CpaContactosProveedorHabitualSerializer, TurnoSerializer, TurnoItemSerializer
)
from django.contrib.auth.models import User
from django.conf import settings
from django.db import connections
from datetime import datetime, date, timedelta, time as dt_time
from dateutil.relativedelta import relativedelta
import json

from rest_framework.decorators import api_view
import os
from django.utils import timezone
import re # Para validación de CUIT en ProveedorRegistroSerializer
import traceback # Importar para imprimir el traceback completo si es necesario
import decimal # Importar para manejar Decimal
from rest_framework.decorators import action

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
        'cbuFile': 'cbu_file',
        'exclIvaFile': 'excl_iva_file',
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
    
    db_name = 'LAKER_SA' # DB por defecto (AR)
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


class OrdenesCompraView(APIView):
  """Devuelve las OC pendientes del proveedor autenticado consultando SQL Server."""
  permission_classes = [IsAuthenticated]

  def get(self, request):
    user = request.user
    try:
      proveedor = Proveedor.objects.get(username_django=user)
    except Proveedor.DoesNotExist:
      return Response([], status=status.HTTP_200_OK)

    cod_provee = proveedor.cod_cpa01
    if not cod_provee:
      return Response([], status=status.HTTP_200_OK)

    try:
      with connections['sqlserver'].cursor() as cursor:
        cursor.execute(
          """
          SELECT CPA35.N_ORDEN_CO, CPA35.FEC_GENER
          FROM CPA35
          LEFT JOIN CPA50 ON (CPA35.COD_COMPRA = CPA50.COD_COMPRA)
          INNER JOIN CPA01 ON CPA01.COD_PROVEE = CPA35.COD_PROVEE
          LEFT JOIN SUCURSAL ON SUCURSAL.ID_SUCURSAL = CPA35.ID_SUCURSAL_DESTINO
          WHERE CPA35.COD_PROVEE = %s
          AND CPA35.ESTADO IN ('1', '2', '3')
          ORDER BY CPA35.N_ORDEN_CO
          """,
          [cod_provee]
        )
        rows = cursor.fetchall()
        data = [
          {
            'nro_orden_co': str(row[0]).strip(),
            'fecha_emision': row[1].strftime('%Y-%m-%d') if row[1] else None
          }
          for row in rows
          if row[0] is not None and str(row[0]).strip()
        ]
      return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
      return Response({'error': f'Error al consultar ordenes de compra: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrdenCompraItemsView(APIView):
  """Devuelve los items de una OC específica, descontando lo ya reservado en otros turnos activos."""
  permission_classes = [IsAuthenticated]

  def get(self, request, nro_oc):
    try:
      oc_list = [oc.strip() for oc in str(nro_oc).split(',')]
      if not oc_list: return Response([], status=200)

      # 1. Obtener items de Tango (CPA36)
      with connections['sqlserver'].cursor() as cursor:
        placeholders = ', '.join(['%s'] * len(oc_list))
        sql_tango = f"""
          SELECT COD_ARTICU, DESCRIPCION_ARTICULO, CAN_PEDIDA, CAN_RECIBI, N_ORDEN_CO
          FROM CPA36
          WHERE LTRIM(RTRIM(N_ORDEN_CO)) IN ({placeholders})
        """
        cursor.execute(sql_tango, oc_list)
        rows_tango = cursor.fetchall()

        # 2. Obtener turnos con estados activos / completados:
        # 1: RESERVADO, 2: CONFIRMADO, 3: INGRESO AL CD, 4: RECEPCIONADO, 5: AUDITADO, 6: POSICIONADO, 7: COMPLETADO
        sql_turnos = """
            SELECT detalle_items, id_estado 
            FROM TurnoReserva 
            WHERE id_estado IN (1, 2, 3, 4, 5, 6, 7, 8) 
            AND detalle_items IS NOT NULL
        """
        cursor.execute(sql_turnos)
        active_appointments = cursor.fetchall()

        # Mapa de cantidades acumuladas en turnos: (sku, oc) -> total_unidades_en_turnos
        cant_en_turnos = {}
        for app_row in active_appointments:
            items_str = app_row[0]
            if not items_str: continue
            # Formato: cod:desc:cant:oc|cod:desc:cant:oc o cod|desc|cant|oc
            for item_part in items_str.split('|'):
                parts = item_part.split(':')
                if len(parts) >= 4:
                    sku = parts[0].strip()
                    cant = float(parts[2]) if parts[2] else 0.0
                    oc = parts[3].strip()
                    key = (sku, oc)
                    cant_en_turnos[key] = cant_en_turnos.get(key, 0.0) + cant

        # 3. Consolidar datos
        data = []
        for row in rows_tango:
          sku = str(row[0]).strip()
          desc = str(row[1]).strip()
          cant_pedida = float(row[2]) if row[2] is not None else 0.0
          cant_recibida_tango = float(row[3]) if row[3] is not None else 0.0
          oc = str(row[4]).strip()

          total_turnos = cant_en_turnos.get((sku, oc), 0.0)
          
          # Lo ya entregado/procesado es el máximo entre lo asentado en Tango y lo programado/recibido en turnos
          ya_entregado = max(cant_recibida_tango, total_turnos)
          
          # El pendiente real es: Pedido - Ya entregado
          cant_pendiente = max(0.0, cant_pedida - ya_entregado)
          
          if cant_pendiente > 0:
            data.append({
              'cod_articulo': sku,
              'descripcion': desc,
              'cantidad_planificada': cant_pedida,
              'cantidad_recibida_tango': ya_entregado,
              'cantidad_reservada': 0,
              'cantidad_pendiente': cant_pendiente,
              'nro_oc': oc
            })
            
      return Response(data, status=200)
    except Exception as e:
      print(f"Error en OrdenCompraItemsView: {str(e)}")
      return Response({'error': str(e)}, status=500)


def enviar_mail_notificacion_turno(turno_id, proveedor, data, items_data, bultos_data):
    from django.core.mail import EmailMultiAlternatives
    
    destinatarios = [
        'analia.jarc@xl.com.ar',
        'lucas.navarro@xl.com.ar',
        'franco.pertus@xl.com.ar',
        'natalia.bontempo@xl.com.ar',
        'ramiro.orozco@xl.com.ar',
        'julieta.dalmeida@xl.com.ar',
        'jessica.farias@xl.com.ar',
        'valeria.villarreal@xl.com.ar',
        'martin.becker@xl.com.ar'
    ]
    
    subject = f'Nuevo Turno Solicitado - {proveedor.nom_provee}'
    
    fecha_turno = data.get('fecha_turno')
    hora_turno = data.get('hora_turno')
    remitos = data.get('remitos', 'Sin remitos')
    bultos_cant = data.get('cantidad_bultos', '0')
    observaciones = data.get('observaciones', 'Sin observaciones')
    nro_oc = data.get('nro_orden_co', '')
    
    # Construcción de la tabla de items en HTML
    items_html = ""
    items_txt = ""
    for item in items_data:
        cod = item.get('cod_articulo', '')
        desc = item.get('descripcion', '')
        cant = item.get('cantidad_a_entregar', '0')
        oc = item.get('nro_oc', '')
        items_html += f"<tr><td style='padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b;'>{cod}</td><td style='padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569;'>{desc}</td><td style='padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #1e293b; font-weight: bold;'>{cant}</td><td style='padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569;'>{oc}</td></tr>"
        items_txt += f"- Art: {cod} | Desc: {desc} | Cant: {cant} | OC: {oc}\n"

    # Construcción de la lista de bultos
    bultos_html = ""
    bultos_txt = ""
    for b in bultos_data:
        cant = b.get('cant', 1)
        dim = f"{b.get('alto', 0)}x{b.get('ancho', 0)}x{b.get('largo', 0)} cm"
        bultos_html += f"<li style='margin-bottom: 6px; line-height: 1.5;'>{cant} bulto/s de {dim}</li>"
        bultos_txt += f"- {cant} bulto/s de {dim}\n"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155; margin: 0; padding: 0; }}
        </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155; margin: 0; padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">
            <!-- HEADER -->
            <tr>
                <td style="background-color: #0f172a; padding: 32px; text-align: center; border-bottom: 4px solid #2563eb;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">PORTAL DE PROVEEDORES</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 13px; font-weight: 500;">Nueva Solicitud de Turno Registrada</p>
                </td>
            </tr>
            
            <!-- CONTENT -->
            <tr>
                <td style="padding: 32px;">
                    <h2 style="color: #1e293b; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Turno Solicitado #{turno_id}</h2>
                    
                    <!-- SECCION 1: DETALLES GENERALES -->
                    <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detalles Generales</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 16px; vertical-align: top; width: 50%;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Proveedor</div>
                                <div style="font-size: 13px; font-weight: 700; color: #1e293b;">{proveedor.nom_provee}</div>
                                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Cód: {proveedor.cod_cpa01}</div>
                            </td>
                            <td style="padding: 16px; vertical-align: top; width: 50%;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Fecha y Hora</div>
                                <div style="font-size: 13px; font-weight: 700; color: #1e293b;">{fecha_turno}</div>
                                <div style="font-size: 11px; font-weight: 700; color: #2563eb; margin-top: 2px;">{hora_turno} HS</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 16px 16px 16px; vertical-align: top;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Órdenes de Compra</div>
                                <div style="font-size: 13px; font-weight: 600; color: #1e293b;">{nro_oc}</div>
                            </td>
                            <td style="padding: 0 16px 16px 16px; vertical-align: top;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Remitos</div>
                                <div style="font-size: 13px; font-weight: 600; color: #1e293b;">{remitos}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 16px 16px 16px; vertical-align: top;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Bultos Informados</div>
                                <div style="font-size: 13px; font-weight: 700; color: #1e293b;">{bultos_cant}</div>
                            </td>
                            <td style="padding: 0 16px 16px 16px; vertical-align: top;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Observaciones</div>
                                <div style="font-size: 13px; color: #475569; font-style: italic;">{observaciones}</div>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- SECCION 2: DETALLE CARGA -->
                    <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detalle de Carga y Bultos</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
                        {bultos_html if bultos_html else "<li style='margin-bottom: 6px; line-height: 1.5;'>No especificados</li>"}
                    </ul>
                    
                    <!-- SECCION 3: DESGLOSE PRODUCTOS -->
                    <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Desglose de Productos</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="padding: 10px 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 11px; letter-spacing: 0.05em;">Artículo</th>
                                <th style="padding: 10px 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 11px; letter-spacing: 0.05em;">Descripción</th>
                                <th style="padding: 10px 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-align: center; width: 80px; font-size: 11px; letter-spacing: 0.05em;">Cant.</th>
                                <th style="padding: 10px 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-align: left; width: 100px; font-size: 11px; letter-spacing: 0.05em;">OC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                </td>
            </tr>
            
            <!-- FOOTER -->
            <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0;">Este es un mensaje automático generado por el Portal de Proveedores.</p>
                    <p style="margin: 4px 0 0 0;">Por favor, no respondas a este correo.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    text_content = f"""
Nueva Solicitud de Turno Registrada (#{turno_id})
Se ha registrado un nuevo turno en el Portal de Proveedores:

- Proveedor: {proveedor.nom_provee} ({proveedor.cod_cpa01})
- Fecha: {fecha_turno}
- Hora: {hora_turno} HS
- Órdenes de Compra: {nro_oc}
- Remitos: {remitos}
- Cantidad Total Bultos: {bultos_cant}
- Observaciones: {observaciones}

Detalle de Carga / Bultos:
{bultos_txt if bultos_txt else "No especificados"}

Detalle de Productos a Entregar:
{items_txt}

Este es un mensaje automático generado por el Portal de Proveedores.
    """
    
    try:
        msg = EmailMultiAlternatives(subject, text_content, None, destinatarios)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        print(f"Email enviado correctamente para el turno {turno_id}")
    except Exception as email_err:
        print(f"Error al enviar email para el turno {turno_id}: {str(email_err)}")

class TurnoViewSet(viewsets.ModelViewSet):
    serializer_class = TurnoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Como ahora solo usamos SQL Server, devolvemos un queryset vacío para cumplir con DRF
        # pero sobreescribimos 'list' y 'retrieve'
        return Turno.objects.none()

    def list(self, request, *args, **kwargs):
        user = request.user
        try:
            proveedor = Proveedor.objects.get(username_django=user)
            cod_provee = str(proveedor.cod_cpa01).strip()
            
            with connections['sqlserver'].cursor() as cursor:
                cursor.execute("""
                    SELECT id_turno_reserva, orden_compra, fecha, hora_inicio, hora_fin, 
                           remitos, cantidad_bultos, observaciones, id_estado
                    FROM TurnoReserva
                    WHERE codigo_proveedor = %s
                    ORDER BY fecha DESC, hora_inicio DESC
                """, [cod_provee])
                
                rows = cursor.fetchall()
                
                estado_map = {
                    1: 'Solicitado',
                    2: 'Solicitado',
                    3: 'Agendado',
                    4: 'Recepcionado',
                    5: 'Auditado',
                    6: 'Posicionado',
                    7: 'Completado',
                    8: 'Completado',
                    9: 'Rechazado'
                }
                
                data = []
                for row in rows:
                    data.append({
                        'id': row[0],
                        'nro_orden_co': str(row[1]).strip(),
                        'fecha_turno': row[2].strftime('%Y-%m-%d') if row[2] else None,
                        'hora_turno': str(row[3])[:5] if row[3] else "00:00",
                        'hora_fin': str(row[4])[:5] if row[4] else "00:00",
                        'remitos': str(row[5]).strip() if row[5] else "",
                        'cantidad_bultos': row[6] or 0,
                        'observaciones': str(row[7]).strip() if row[7] else "",
                        'estado': estado_map.get(row[8], 'Solicitado')
                    })
                
                return Response(data)
        except Proveedor.DoesNotExist:
            return Response([])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request, *args, **kwargs):
        user = request.user
        try:
            proveedor = Proveedor.objects.get(username_django=user)
        except Proveedor.DoesNotExist:
            return Response({"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Los datos vienen de FormData
            data = request.data
            import json
            items_data = json.loads(data.get('items', '[]'))
            bultos_data = json.loads(data.get('bultos_detalle', '[]'))
            
            if not items_data:
                return Response({"error": "Debe incluir al menos un ítem"}, status=status.HTTP_400_BAD_REQUEST)

            # Validar que se haya subido al menos un documento adjunto
            file_count = int(data.get('file_count', 0))
            if file_count <= 0:
                return Response({"error": "Debe adjuntar al menos un documento (remito, consolidado, factura u otro)."}, status=status.HTTP_400_BAD_REQUEST)

            # Validaciones de Agenda (Bucle, Fines de semana y Breaks)
            fecha_str = data.get('fecha_turno')
            hora_ini_str = data.get('hora_turno')
            hora_fin_str = data.get('hora_fin')

            if not fecha_str or not hora_ini_str or not hora_fin_str:
                return Response({"error": "Debe definir fecha, hora de inicio y hora de fin."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                fecha_val = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except ValueError:
                fecha_val = datetime.strptime(fecha_str.split('T')[0], '%Y-%m-%d').date()

            h_ini_val = datetime.strptime(hora_ini_str, '%H:%M').time()
            h_fin_val = datetime.strptime(hora_fin_str, '%H:%M').time()
            weekday_val = fecha_val.weekday()

            # Validar anticipación mínima (no hoy ni mañana -> mín. 2 días desde hoy)
            min_fecha_permitida = datetime.now().date() + timedelta(days=2)
            if fecha_val < min_fecha_permitida:
                return Response({"error": "No se pueden solicitar turnos para hoy ni para mañana. La fecha de entrega debe programarse con al menos 48 hs de anticipación."}, status=status.HTTP_400_BAD_REQUEST)

            if weekday_val == 6:
                return Response({"error": "No se pueden solicitar turnos los días Domingo ya que no se trabaja."}, status=status.HTTP_400_BAD_REQUEST)

            if weekday_val == 5:  # Sábado (7:00 a 10:00)
                if h_ini_val < dt_time(7, 0) or h_fin_val > dt_time(10, 0):
                    return Response({"error": "Los días Sábado el horario de entrega permitido es únicamente de 07:00 a 10:00 HS."}, status=status.HTTP_400_BAD_REQUEST)
            else:  # Lunes a Viernes (7:00 a 16:00)
                if h_ini_val < dt_time(7, 0) or h_fin_val > dt_time(16, 0):
                    return Response({"error": "El horario permitido de Lunes a Viernes es únicamente de 07:00 a 16:00 HS."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Breaks
                # Break mañana: 10:00 a 10:30
                if not (h_fin_val <= dt_time(10, 0) or h_ini_val >= dt_time(10, 30)):
                    return Response({"error": "El horario seleccionado se superpone con el break de la mañana (10:00 a 10:30 HS)."}, status=status.HTTP_400_BAD_REQUEST)
                # Break comida/almuerzo: 13:00 a 14:00
                if not (h_fin_val <= dt_time(13, 0) or h_ini_val >= dt_time(14, 0)):
                    return Response({"error": "El horario seleccionado se superpone con el break de almuerzo (13:00 a 14:00 HS)."}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar si está ocupado
            with connections['sqlserver'].cursor() as cursor:
                cursor.execute("""
                    SELECT hora_inicio, hora_fin 
                    FROM TurnoReserva 
                    WHERE fecha = %s AND id_estado IN (1, 2, 3, 4, 5, 6, 7)
                """, [fecha_str])
                for t_ini_raw, t_fin_raw in cursor.fetchall():
                    if t_ini_raw and t_fin_raw:
                        t_ini = t_ini_raw if hasattr(t_ini_raw, 'hour') else datetime.strptime(str(t_ini_raw)[:5], "%H:%M").time()
                        t_fin = t_fin_raw if hasattr(t_fin_raw, 'hour') else datetime.strptime(str(t_fin_raw)[:5], "%H:%M").time()
                        if not (h_fin_val <= t_ini or h_ini_val >= t_fin):
                            return Response({"error": "El horario seleccionado ya no está disponible (está ocupado)."}, status=status.HTTP_400_BAD_REQUEST)

            # Calculamos total de unidades para la tabla externa
            total_unidades = sum(float(item.get('cantidad_a_entregar', 0)) for item in items_data)
            
            # Formateamos el detalle de ítems
            items_str = "|".join([f"{item['cod_articulo']}:{str(item['descripcion']).replace(':', '-').replace('|', '-')}:{item['cantidad_a_entregar']}:{item.get('nro_oc', '')}" for item in items_data])
            
            # Formateamos detalle de bultos
            bultos_str = " | ".join([f"{b['cant']} Bulto/s ({b['alto']}x{b['ancho']}x{b['largo']} cm)" for b in bultos_data])
            obs_final = f"{data.get('observaciones', '')} [DETALLE LOGÍSTICO: {bultos_str}]".strip()

            # Guardamos en la base externa (sqlserver -> TurnoReserva)
            with connections['sqlserver'].cursor() as ext_cursor:
                sql = """
                    INSERT INTO TurnoReserva 
                    (codigo_proveedor, nombre_proveedor, fecha, hora_inicio, hora_fin, 
                     orden_compra, remitos, cantidad_unidades, cantidad_bultos, 
                     observaciones, detalle_items, id_estado, usuario_creador, fecha_creacion,
                     fecha_modificacion, estado_actual_desde, usuario_ultima_modificacion_estado)
                    OUTPUT INSERTED.id_turno_reserva
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                params = [
                    proveedor.cod_cpa01,
                    proveedor.nom_provee,
                    data.get('fecha_turno'),
                    data.get('hora_turno'),
                    data.get('hora_fin'),
                    data.get('nro_orden_co'),
                    data.get('remitos'),
                    total_unidades,
                    data.get('cantidad_bultos'),
                    obs_final,
                    items_str, # Guardamos el desglose aquí
                    2, # ID_ESTADO (SOLICITADO)
                    request.user.username,
                    datetime.now(),
                    datetime.now(),
                    datetime.now(),
                    request.user.username
                ]
                ext_cursor.execute(sql, params)
                turno_id = ext_cursor.fetchone()[0]

                # PROCESAR ARCHIVOS ADJUNTOS
                file_count = int(data.get('file_count', 0))
                if file_count > 0:
                    from django.core.files.storage import FileSystemStorage
                    from django.conf import settings
                    import os
                    fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'adjuntos_turnos'))
                    
                    for i in range(file_count):
                        file_obj = request.FILES.get(f'file_{i}')
                        doc_type = data.get(f'file_type_{i}', 'OTRO')
                        
                        if file_obj:
                            # Formato nombre: <turno_id>_<timestamp>_<nombre_original>
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                            filename = f"{turno_id}/{turno_id}_{timestamp}_{file_obj.name}"
                            
                            # Guardar archivo físico
                            saved_path = fs.save(filename, file_obj)
                            # Ruta completa relativa para la base: adjuntos_turnos/<turno_id>/...
                            db_path = f"adjuntos_turnos/{saved_path}"
                            
                            # Insertar en AdjuntoTurnoReserva
                            adj_sql = """
                                INSERT INTO AdjuntoTurnoReserva 
                                (archivo, tipo_documento, nombre_original, tipo_archivo, tamaño_bytes, usuario_subio, fecha_subida, id_turno_reserva)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """
                            ext_cursor.execute(adj_sql, [
                                db_path,
                                doc_type,
                                file_obj.name,
                                file_obj.content_type,
                                file_obj.size,
                                request.user.username,
                                datetime.now(),
                                turno_id
                            ])

                # INSERTAR EN HISTORIAL (Usando nombres correctos de columnas)
                hist_sql = """
                    INSERT INTO HistorialEstadoTurno (id_turno_reserva, id_estado_nuevo, fecha_cambio, usuario, observaciones)
                    VALUES (%s, %s, %s, %s, %s)
                """
                ext_cursor.execute(hist_sql, [
                    turno_id, 
                    2, # id_estado_nuevo (SOLICITADO)
                    datetime.now(), 
                    request.user.username,
                    'Turno solicitado desde el Portal de Proveedores'
                ])

                # Enviar correo de notificación
                enviar_mail_notificacion_turno(turno_id, proveedor, data, items_data, bultos_data)

            return Response({'id': turno_id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_detail = str(e)
            print(f"Error en creación de turno: {error_detail}")
            return Response({
                "error": "No se pudo agendar el turno en el servidor de logística.",
                "details": error_detail
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """
        Elimina un turno de TurnoReserva si está en estado 'Solicitado' (2)
        """
        pk = kwargs.get('pk')
        try:
            with connections['sqlserver'].cursor() as cursor:
                # Primero verificamos el estado
                cursor.execute("SELECT id_estado FROM TurnoReserva WHERE id_turno_reserva = %s", [pk])
                row = cursor.fetchone()
                
                if not row:
                    return Response({'error': 'Turno no encontrado'}, status=404)
                
                if row[0] != 2:
                    return Response({'error': 'Solo se pueden eliminar turnos en estado Solicitado'}, status=400)
                
                # Eliminamos registros relacionados para evitar conflictos de integridad
                # 1. Adjuntos
                cursor.execute("DELETE FROM AdjuntoTurnoReserva WHERE id_turno_reserva = %s", [pk])
                # 2. Historial de estados
                cursor.execute("DELETE FROM HistorialEstadoTurno WHERE id_turno_reserva = %s", [pk])
                # 3. Incidencias
                cursor.execute("DELETE FROM IncidenciasTurno WHERE id_turno_reserva = %s", [pk])
                
                # Finalmente eliminamos el turno principal
                cursor.execute("DELETE FROM TurnoReserva WHERE id_turno_reserva = %s", [pk])
                
                return Response({'message': 'Turno eliminado correctamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        """
        Obtiene los items de un turno consultando tanto detalle_items como observaciones
        """
        try:
            with connections['sqlserver'].cursor() as cursor:
                cursor.execute("SELECT detalle_items, observaciones FROM TurnoReserva WHERE id_turno_reserva = %s", [pk])
                row = cursor.fetchone()
                
                if not row:
                    return Response({'error': 'Turno no encontrado'}, status=404)
                
                detalle_items = str(row[0]) if row[0] else ""
                observaciones = str(row[1]) if row[1] else ""
                items = []
                
                items_raw = detalle_items if detalle_items else ""
                if not items_raw:
                    import re
                    match = re.search(r'\[ITEMS: (.*?)\]', observaciones)
                    if match:
                        items_raw = match.group(1)

                if items_raw:
                    for item_str in items_raw.split('|'):
                        parts = item_str.split(':')
                        if len(parts) >= 3:
                            items.append({
                                'cod_articulo': parts[0],
                                'descripcion': parts[1],
                                'cantidad_a_entregar': parts[2],
                                'nro_oc': parts[3] if len(parts) >= 4 else ""
                            })
                return Response(items)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def horarios_disponibles(self, request):
        """
        Calcula horarios disponibles para una fecha específica (7:00 a 16:00 cada 30 min)
        tomando en cuenta fines de semana, breaks de almuerzo/comida y turnos ocupados.
        """
        fecha_str = request.query_params.get('fecha')
        if not fecha_str:
            return Response({'error': 'Falta el parámetro fecha'}, status=400)

        try:
            # Parsear la fecha
            try:
                fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except ValueError:
                # Intentar con otros formatos si es necesario
                fecha = datetime.strptime(fecha_str.split('T')[0], '%Y-%m-%d').date()

            min_fecha_permitida = datetime.now().date() + timedelta(days=2)
            if fecha < min_fecha_permitida:
                return Response([])

            weekday = fecha.weekday()
            
            # Domingo no se trabaja
            if weekday == 6:
                return Response([])

            # Definir límites de horario por día
            if weekday == 5:  # Sábado (7:00 a 10:00)
                hora_inicio = dt_time(7, 0)
                hora_fin = dt_time(10, 0)
            else:  # Lunes a Viernes (7:00 a 16:00)
                hora_inicio = dt_time(7, 0)
                hora_fin = dt_time(16, 0)

            # Generar todos los slots posibles de 30 minutos
            slots_generados = []
            current_time = datetime.combine(fecha, hora_inicio)
            end_time = datetime.combine(fecha, hora_fin)

            while current_time < end_time:
                slot_inicio = current_time.time()
                slot_fin = (current_time + timedelta(minutes=30)).time()

                # Filtrar breaks de comida para Lunes a Viernes
                if weekday < 5:  # L-V
                    # Break mañana: 10:00 a 10:30
                    if slot_inicio == dt_time(10, 0):
                        current_time += timedelta(minutes=30)
                        continue
                    # Break comida: 13:00 a 14:00 (cubre 13:00-13:30 y 13:30-14:00)
                    if slot_inicio >= dt_time(13, 0) and slot_fin <= dt_time(14, 0):
                        current_time += timedelta(minutes=30)
                        continue

                slots_generados.append((slot_inicio, slot_fin))
                current_time += timedelta(minutes=30)

            # Consultar turnos ocupados
            with connections['sqlserver'].cursor() as cursor:
                cursor.execute("""
                    SELECT hora_inicio, hora_fin 
                    FROM TurnoReserva 
                    WHERE fecha = %s AND id_estado IN (1, 2, 3, 4, 5, 6, 7)
                """, [fecha_str])
                
                rows = cursor.fetchall()
                turnos_ocupados = []
                for row in rows:
                    h_ini = None
                    h_fin = None
                    if row[0]:
                        if hasattr(row[0], 'hour'):
                            h_ini = row[0]
                        else:
                            # Convertir string/datetime
                            h_ini = datetime.strptime(str(row[0])[:5], "%H:%M").time()
                    if row[1]:
                        if hasattr(row[1], 'hour'):
                            h_fin = row[1]
                        else:
                            h_fin = datetime.strptime(str(row[1])[:5], "%H:%M").time()
                    
                    if h_ini and h_fin:
                        turnos_ocupados.append((h_ini, h_fin))

                # Comprobar disponibilidad
                resultado = []
                for slot_inicio, slot_fin in slots_generados:
                    ocupado = False
                    for t_ini, t_fin in turnos_ocupados:
                        # Verificar superposición: no es cierto que finaliza antes del inicio o inicia después del fin
                        if not (slot_fin <= t_ini or slot_inicio >= t_fin):
                            ocupado = True
                            break

                    resultado.append({
                        'hora': slot_inicio.strftime('%H:%M'),
                        'disponible': not ocupado
                    })

                return Response(resultado)

        except Exception as e:
            return Response({'error': f'Error al calcular horarios disponibles: {str(e)}'}, status=500)

# --- Funciones de Formateo ---

def format_date_ddmmyyyy(value):
    """Formatea un valor de fecha a 'DD/MM/AAAA'."""
    if isinstance(value, (datetime, date)):
        # Si ya es un objeto date/datetime
        return value.strftime('%d/%m/%Y')
    elif isinstance(value, str):
        try:
            # Intentar parsear el formato YYYY-MM-DDTHH:MM:SS o YYYY-MM-DD
            # Eliminar la 'Z' si está presente y manejar la parte de la hora opcional
            value = value.replace('Z', '').split('.')[0] # Eliminar milisegundos si existen
            try:
                # Intentar como datetime completo
                dt_obj = datetime.fromisoformat(value)
            except ValueError:
                 # Si falla, intentar solo la parte de la fecha
                 dt_obj = datetime.strptime(value.split('T')[0], '%Y-%m-%d')

            return dt_obj.strftime('%d/%m/%Y')
        except (ValueError, TypeError):
            # Si el parseo falla, devolver el valor original
            return value
    else:
        # Si no es string ni objeto fecha, devolver tal cual
        return value

def format_currency_ars(value):
    """Formatea un valor numérico a formato de moneda ARS (miles con '.', decimales con ',')."""
    if value is None:
        return "0,00" # O el valor deseado para None
    try:
        # Convertir a Decimal para manejo preciso de decimales
        num = decimal.Decimal(value)
        # Redondear a 2 decimales
        num = num.quantize(decimal.Decimal('0.01'), rounding=decimal.ROUND_HALF_UP)

        # Convertir a string para formateo manual de miles y decimales
        num_str = str(num)

        # Separar parte entera y decimal
        if '.' in num_str:
            integer_part, decimal_part = num_str.split('.')
        else:
            integer_part = num_str
            decimal_part = '00' # Asegurar 2 decimales

        # Manejar signo negativo
        is_negative = integer_part.startswith('-')
        if is_negative:
            integer_part = integer_part[1:]

        # Formatear parte entera con separador de miles '.'
        formatted_integer_part = []
        n = len(integer_part)
        for i in range(n):
            formatted_integer_part.append(integer_part[i])
            # Añadir punto cada 3 dígitos desde la derecha, excepto al principio
            if (n - 1 - i) % 3 == 0 and (n - 1 - i) != 0:
                formatted_integer_part.append('.')

        formatted_integer_part_str = "".join(formatted_integer_part)

        # Combinar con separador de decimales ','
        final_formatted_value = f"{formatted_integer_part_str},{decimal_part}"

        # Añadir signo negativo de vuelta si es necesario
        if is_negative:
            final_formatted_value = f"-{final_formatted_value}"

        return final_formatted_value
    except (ValueError, TypeError, decimal.InvalidOperation):
        # Manejar casos donde el valor no es un número válido
        return str(value) # Devolver el valor original como string o un indicador de error

# --- Fin Funciones de Formateo ---


class ResumenCuentaProveedorView(APIView):
  """
  Endpoint para obtener el resumen de cuenta de un proveedor autenticado.
  Ejecuta el stored procedure dbo.EB_ConsultaResumenCuentaProveedor.
  """
  authentication_classes = [JWTAuthentication, SessionAuthentication] # Añadir explícitamente SessionAuthentication
  permission_classes = [IsAuthenticated]

  def get(self, request, *args, **kwargs):
    # --- Depuración: Verificar estado del usuario ---
    print(f"DEBUG: Accediendo a ResumenCuentaProveedorView")
    print(f"DEBUG: Objeto User: {request.user}")
    print(f"DEBUG: Usuario autenticado: {request.user.is_authenticated}")

    user = request.user

    if not user.is_authenticated:
         print("DEBUG: El usuario NO está autenticado dentro del método de la vista.")
         return Response({"error": "Usuario no autenticado dentro del método de la vista."}, status=status.HTTP_401_UNAUTHORIZED)

    print("DEBUG: El usuario SÍ está autenticado dentro del método de la vista. Procediendo...")

    try:
      # Obtener el proveedor asociado al usuario autenticado
      proveedor = Proveedor.objects.get(username_django=user)
      cod_provee = proveedor.cod_cpa01

      if not cod_provee:
         print("DEBUG: Proveedor encontrado pero cod_cpa01 es None.")
         return Response({"error": "Proveedor no tiene código CPA01 asociado."}, status=status.HTTP_400_BAD_REQUEST)

      # Calcular rango de fechas por defecto
      today = date.today()
      first_day_current_month = today.replace(day=1)
      last_day_previous_month = first_day_current_month - relativedelta(days=1)
      # fecha_hasta_default = last_day_previous_month.strftime('%Y-%m-%d')
      fecha_hasta_default = today.strftime('%Y-%m-%d')

      fecha_desde_obj = first_day_current_month - relativedelta(months=3)
      fecha_desde_default = fecha_desde_obj.strftime('%Y-%m-%d')

      # Usar parámetros de la request si se proveen, de lo contrario usar los calculados
      fecha_desde_sp = request.query_params.get('fecha_desde', fecha_desde_default)
      fecha_hasta_sp = request.query_params.get('fecha_hasta', fecha_hasta_default)

      print(f"DEBUG: Ejecutando SP con FechaDesde={fecha_desde_sp}, FechaHasta={fecha_hasta_sp}, Cod_Provee={cod_provee}")
      print(f"DEBUG: Conectando a la base de datos: {connections['sqlserver'].settings_dict['NAME']}")

      # Ejecutar stored procedure
      with connections['sqlserver'].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.EB_ConsultaResumenCuentaProveedor @FechaDesde=%s, @FechaHasta=%s, @Cod_Provee=%s",
            [fecha_desde_sp, fecha_hasta_sp, cod_provee]
        )

        # --- INICIO DE LA LÓGICA DE SANITIZACIÓN Y FORMATEO ---

        # 1. Obtener los nombres de columna originales de la base de datos
        original_columns = [col[0] for col in cursor.description]
        data = cursor.fetchall()

        print(f"DEBUG: Obtenidas {len(data)} filas del SP.")
        if original_columns:
            print(f"DEBUG: Nombres de columnas originales del SP: {original_columns}")

        # 2. Crear una versión "limpia" de cada nombre de columna para usarla como clave JSON.
        #    Reemplaza cualquier carácter que no sea letra, número o guion bajo por un guion bajo.
        sanitized_keys = [re.sub(r'[^a-zA-Z0-9_]', '_', col) for col in original_columns]

        if sanitized_keys:
            print(f"DEBUG: Nombres de columnas sanitizadas para JSON: {sanitized_keys}")

        # 3. Crear la lista de columnas para DataTables.
        #    'title' será el nombre original (lo que ve el usuario).
        #    'data' será la clave sanitizada (lo que usa JavaScript internamente).
        columns_for_datatables = [
            {"title": orig_col, "data": san_key}
            for orig_col, san_key in zip(original_columns, sanitized_keys)
        ]

        # 4. Formatear los datos de las filas, usando las claves sanitizadas y aplicando formato.
        resumen_data = []
        # Mapeo de nombres originales a claves sanitizadas para formateo
        date_fields_map = {
            'Fecha comprobante': 'Fecha_comprobante',
            'Fecha vto.': 'Fecha_vto_' # <-- CORREGIDO: Usar la clave sanitizada correcta
        }
        currency_fields_map = {
            'Importe': 'Importe',
            'Acumulado': 'Acumulado'
        }

        for row in data:
            row_dict = dict(zip(sanitized_keys, row))

            # Aplicar formato de fecha
            for original_col, sanitized_key in date_fields_map.items():
                # Verificar si la clave sanitizada existe en el diccionario de la fila
                if sanitized_key in row_dict:
                    row_dict[sanitized_key] = format_date_ddmmyyyy(row_dict[sanitized_key])

            # Aplicar formato de moneda
            for original_col, sanitized_key in currency_fields_map.items():
                 # Verificar si la clave sanitizada existe en el diccionario de la fila
                 if sanitized_key in row_dict:
                    row_dict[sanitized_key] = format_currency_ars(row_dict[sanitized_key])


            resumen_data.append(row_dict)

        # 5. Construir la respuesta final que se enviará al frontend
        response_payload = {
            "data": resumen_data,
            "columns": columns_for_datatables
        }

        # --- FIN DE LA LÓGICA DE SANITIZACIÓN Y FORMATEO ---

      return Response(response_payload, status=status.HTTP_200_OK)

    except Proveedor.DoesNotExist:
      print("DEBUG: Excepción Proveedor.DoesNotExist capturada.")
      return Response({"error": "Proveedor no encontrado para el usuario autenticado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
      print(f"DEBUG: Excepción general capturada en la vista ResumenCuentaProveedorView: {e}")
      # Imprimir el traceback completo en la consola del servidor para una depuración profunda
      traceback.print_exc()
      return Response({"error": "Ocurrió un error al obtener el resumen de cuenta."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
