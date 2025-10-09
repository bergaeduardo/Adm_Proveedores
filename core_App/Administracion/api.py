from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import connections
from django.db.models import Q
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from .api_mixins import RequireProveedorMixin
import re
import traceback
import decimal
from django.conf import settings

from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual
from .serializers import ProveedorSerializer, ComprobanteSerializer, CpaContactosProveedorHabitualSerializer
from consultasTango.models import Cpa57

# --- API Views ---

class AdministracionProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    parser_classes = [MultiPartParser, FormParser]

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception:
            traceback.print_exc()
            return Response({"error": "Error retrieving provider data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        file_field_map = {
            'cuitFile': 'cuit_file',
            'ingBrutosFile': 'ing_brutos_file',
            'exclGananciasFile': 'excl_ganancias_file',
            'cm05File': 'cm05_file',
            'noRetGananciasFile': 'no_ret_ganancias_file',
            'exclIIBBFile': 'excl_iibb_file',
            'cbuFile': 'cbu_file',
        }

        data_for_serializer = request.data.copy()
        now = timezone.now()

        # --- Saneado de payload para FileFields ---
        file_boolean_like = {'s', 'n', 'true', 'false', '1', '0', 'on', 'off', '', 'none', 'null'}
        for model_field_name in file_field_map.values():
            # Si llega un valor string para un campo de archivo y NO hay archivo en request.FILES, descartar
            if model_field_name in data_for_serializer and model_field_name not in request.FILES:
                val = str(data_for_serializer.get(model_field_name)).strip().lower()
                if val in file_boolean_like:
                    data_for_serializer.pop(model_field_name, None)

            # Por las dudas, limpiar también la clave *frontend* si viniera como string
            # (los archivos válidos entran por request.FILES)
            frontend_key = [k for k, v in file_field_map.items() if v == model_field_name][0]
            if frontend_key in data_for_serializer and frontend_key not in request.FILES:
                data_for_serializer.pop(frontend_key, None)

        max_file_size = 5 * 1024 * 1024  # 5MB
        allowed_content_types = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

        for frontend_key, model_field_name in file_field_map.items():
            uploaded_file = request.FILES.get(frontend_key)
            if uploaded_file:
                if uploaded_file.size > max_file_size:
                    return Response({frontend_key: f'El archivo es demasiado grande (máx. {max_file_size // (1024*1024)}MB).'}, status=status.HTTP_400_BAD_REQUEST)
                if uploaded_file.content_type not in allowed_content_types:
                    return Response({frontend_key: f'Tipo de archivo no permitido ({uploaded_file.content_type}). Permitidos: PDF, JPG, PNG, DOC, DOCX.'}, status=status.HTTP_400_BAD_REQUEST)

                data_for_serializer[model_field_name] = uploaded_file
                if hasattr(instance, f'{model_field_name}_updated_at'):
                    data_for_serializer[f'{model_field_name}_updated_at'] = now

                if frontend_key in data_for_serializer:
                    del data_for_serializer[frontend_key]

        serializer = self.get_serializer(instance, data=data_for_serializer, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        updated_instance = self.get_object()
        response_serializer = self.get_serializer(updated_instance)
        return Response(response_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response({'detail': 'Delete operations are not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class AdministracionCpaContactosProveedorHabitualViewSet(RequireProveedorMixin, viewsets.ModelViewSet):
    queryset = CpaContactosProveedorHabitual.objects.all()
    serializer_class = CpaContactosProveedorHabitualSerializer

    def get_queryset(self):
        # Para acciones de detalle, devolver todos (DRF filtrará por pk)
        if getattr(self, 'action', None) in ['retrieve', 'update', 'partial_update', 'destroy']:
            return CpaContactosProveedorHabitual.objects.all()
        proveedor = self._get_proveedor_or_400(self.request)
        return CpaContactosProveedorHabitual.objects.filter(cod_provee=proveedor.cod_cpa01)

    def create(self, request, *args, **kwargs):
        proveedor = self._get_proveedor_or_400(request)
        data = request.data.copy()
        # No permitimos que el front setee cod_provee/username_django
        if 'cod_provee' in data: data.pop('cod_provee')
        if 'username_django' in data: data.pop('username_django')
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(cod_provee=proveedor.cod_cpa01, username_django=proveedor.username_django)
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        proveedor = self._get_proveedor_or_400(request)
        if instance.cod_provee != proveedor.cod_cpa01:
            return Response({'detail': 'El contacto no pertenece al proveedor indicado.'}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdministracionComprobanteViewSet(viewsets.ModelViewSet):
    queryset = Comprobante.objects.all()
    serializer_class = ComprobanteSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        provider_id = self.request.query_params.get('proveedor_id') or self.request.data.get('proveedor_id')
        if not provider_id:
            return Comprobante.objects.none()
        try:
            proveedor = Proveedor.objects.get(id=provider_id)
            return Comprobante.objects.filter(proveedor=proveedor)
        except Proveedor.DoesNotExist:
            return Comprobante.objects.none()

    def create(self, request, *args, **kwargs):
        # El frontend envía el ID del proveedor en el campo 'proveedor'.
        # El ComprobanteSerializer ya espera este campo, por lo que podemos
        # delegarle la validación directamente.
        
        # Primero, verificamos que el proveedor exista.
        provider_id = request.data.get('proveedor')
        if not provider_id:
            return Response({"proveedor": ["Este campo es requerido."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            Proveedor.objects.get(id=provider_id)
        except Proveedor.DoesNotExist:
            return Response({"proveedor": ["ID de Proveedor inválido."]}, status=status.HTTP_400_BAD_REQUEST)

        # Pasamos los datos al serializador para que los valide y cree el objeto.
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        self.perform_create(ser) # Usamos perform_create para guardar la instancia
        
        headers = self.get_success_headers(ser.data)
        return Response(ser.data, status=status.HTTP_201_CREATED, headers=headers)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


# --- New API for Provider Search ---
class AdministracionProveedorSearchView(APIView):
    def post(self, request, *args, **kwargs):
        query = request.data.get('query', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)

        providers = Proveedor.objects.filter(
            Q(nom_provee__icontains=query) | Q(n_cuit__icontains=query)
        ).values('id', 'nom_provee', 'n_cuit', 'cod_pais')[:20]

        results = [{"id": p['id'], "display": f"{p['nom_provee']} ({p['n_cuit']})", "cod_pais": p['cod_pais']} for p in providers]
        return Response(results, status=status.HTTP_200_OK)

# --- Replicated Utility Views (with custom auth) ---

class AdministracionProvinciaListView(APIView):
  def get(self, request):
    query = request.GET.get('q', '')
    provincias = Cpa57.objects.using('sqlserver').filter(nom_provin__icontains=query).values('id_cpa57', 'cod_provin', 'nom_provin')[:50]
    data = [{'id': p['id_cpa57'], 'display': f"{p['nom_provin']}"} for p in provincias]
    return Response(data, status=status.HTTP_200_OK)

class AdministracionCategoriaIVAListView(APIView):
  def get(self, request):
    try:
      with connections['sqlserver'].cursor() as cursor:
        cursor.execute("SELECT ID_CATEGORIA_IVA, COD_CATEGORIA_IVA, DESC_CATEGORIA_IVA FROM CATEGORIA_IVA")
        rows = cursor.fetchall()
        data = [{"id_categoria_iva": row[0], "cod_categoria_iva": row[1], "desc_categoria_iva": row[2]} for row in rows]
      return Response(data)
    except Exception as e:
      traceback.print_exc()
      return Response({"error": f"Error al obtener categorías de IVA: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdministracionIngresosBrutosListView(APIView):
  def get(self, request):
    Ingresos_brutos = {
      '': '',
      'L': 'Local',
      'M': 'Multilateral',
      'S': 'Reg. simplificado',
    }
    data = [{'Cod_Ingresos_brutos': key, 'Desc_Ingresos_brutos': value} for key, value in Ingresos_brutos.items()]
    return Response(data, status=status.HTTP_200_OK)

def cambiar_conexion_db(alias_db, nombre_db_nuevo):
  try:
    if alias_db in settings.DATABASES:
        settings.DATABASES[alias_db]['NAME'] = nombre_db_nuevo
        connections[alias_db].close() 
        print(f'Cambiando base de datos para la conexión "{alias_db}" a "{nombre_db_nuevo}"')
        return True
    else:
        print(f'Alias de conexión "{alias_db}" no encontrado en settings.DATABASES.')
        return False
  except Exception as e:
    print(f"Error al cambiar la conexión {alias_db} a {nombre_db_nuevo}: {e}")
    return False

class CambiarConexionAdministracionView(APIView):
  def post(self, request):
    cod_pais = request.data.get('cod_pais', 'AR')
    connection_alias = 'sqlserver'
    
    db_name = 'LAKER_SA'
    if cod_pais == 'UR':
      db_name = 'TASKY_SA'
    
    if cambiar_conexion_db(connection_alias, db_name):
      return Response({'msg': f'Conexión para {connection_alias} cambiada a {db_name} correctamente.'}, status=status.HTTP_200_OK)
    else:
      return Response({'error': f'No se pudo cambiar la conexión para {connection_alias}.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdministracionResumenCuentaProveedorView(APIView):
  """
  Requires 'proveedor_id' in query params or body.
  """
  def get(self, request, *args, **kwargs):
    provider_id = request.query_params.get('proveedor_id')

    if not provider_id:
         return Response({"error": "Proveedor ID is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
      # Get the Proveedor instance based on the provided ID
      proveedor = Proveedor.objects.get(id=provider_id)
      cod_provee = proveedor.cod_cpa01

      if not cod_provee:
         return Response({"error": "Proveedor seleccionado no tiene código CPA01 asociado."}, status=status.HTTP_400_BAD_REQUEST)

      # Calculate default date range (same logic as original)
      today = date.today()
      first_day_current_month = today.replace(day=1)
      last_day_previous_month = first_day_current_month - relativedelta(days=1)
      fecha_hasta_default = last_day_previous_month.strftime('%Y-%m-%d')

      fecha_desde_obj = first_day_current_month - relativedelta(months=3)
      fecha_desde_default = fecha_desde_obj.strftime('%Y-%m-%d')

      # Use parameters from the request if provided, otherwise use defaults
      fecha_desde_sp = request.query_params.get('fecha_desde', fecha_desde_default)
      fecha_hasta_sp = request.query_params.get('fecha_hasta', fecha_hasta_default)

      # Execute stored procedure (assuming 'sqlserver' connection)
      with connections['sqlserver'].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.EB_ConsultaResumenCuentaProveedor @FechaDesde=%s, @FechaHasta=%s, @Cod_Provee=%s",
            [fecha_desde_sp, fecha_hasta_sp, cod_provee]
        )

        # --- Sanitization and Formatting Logic (copied from original) ---
        original_columns = [col[0] for col in cursor.description]
        data = cursor.fetchall()

        sanitized_keys = [re.sub(r'[^a-zA-Z0-9_]', '_', col) for col in original_columns]

        columns_for_datatables = [
            {"title": orig_col, "data": san_key}
            for orig_col, san_key in zip(original_columns, sanitized_keys)
        ]

        resumen_data = []
        date_fields_map = {
            'Fecha comprobante': 'Fecha_comprobante',
            'Fecha vto.': 'Fecha_vto_'
        }
        currency_fields_map = {
            'Importe': 'Importe',
            'Acumulado': 'Acumulado'
        }

        for row in data:
            row_dict = dict(zip(sanitized_keys, row))

            for original_col, sanitized_key in date_fields_map.items():
                if sanitized_key in row_dict:
                    row_dict[sanitized_key] = format_date_ddmmyyyy(row_dict[sanitized_key])

            for original_col, sanitized_key in currency_fields_map.items():
                 if sanitized_key in row_dict:
                    row_dict[sanitized_key] = format_currency_ars(row_dict[sanitized_key])

            resumen_data.append(row_dict)

        response_payload = {
            "data": resumen_data,
            "columns": columns_for_datatables
        }
        # --- End Sanitization and Formatting Logic ---

      return Response(response_payload, status=status.HTTP_200_OK)

    except Proveedor.DoesNotExist:
      return Response({"error": "Proveedor no encontrado para el ID proporcionado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
      traceback.print_exc() # Log the error
      return Response({"error": "Ocurrió un error al obtener el resumen de cuenta."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Helper functions (copied from original) ---
def format_date_ddmmyyyy(value):
    """Formatea un valor de fecha a 'DD/MM/AAAA'."""
    if isinstance(value, (datetime, date)):
        return value.strftime('%d/%m/%Y')
    elif isinstance(value, str):
        try:
            value = value.replace('Z', '').split('.')[0]
            try:
                dt_obj = datetime.fromisoformat(value)
            except ValueError:
                 dt_obj = datetime.strptime(value.split('T')[0], '%Y-%m-%d')
            return dt_obj.strftime('%d/%m/%Y')
        except (ValueError, TypeError):
            return value
    else:
        return value

def format_currency_ars(value):
    """Formatea un valor numérico a formato de moneda ARS (miles con '.', decimales con ',')."""
    if value is None:
        return "0,00"
    try:
        num = decimal.Decimal(value)
        num = num.quantize(decimal.Decimal('0.01'), rounding=decimal.ROUND_HALF_UP)
        num_str = str(num)
        if '.' in num_str:
            integer_part, decimal_part = num_str.split('.')
        else:
            integer_part = num_str
            decimal_part = '00'
        is_negative = integer_part.startswith('-')
        if is_negative:
            integer_part = integer_part[1:]
        formatted_integer_part = []
        n = len(integer_part)
        for i in range(n):
            formatted_integer_part.append(integer_part[i])
            if (n - 1 - i) % 3 == 0 and (n - 1 - i) != 0:
                formatted_integer_part.append('.')
        formatted_integer_part_str = "".join(formatted_integer_part)
        final_formatted_value = f"{formatted_integer_part_str},{decimal_part}"
        if is_negative:
            final_formatted_value = f"-{final_formatted_value}"
        return final_formatted_value
    except (ValueError, TypeError, decimal.InvalidOperation):
        return str(value)

# Note: The original ProveedorRegistroView and related functions (validar_cuit, cambiar_conexion_db, CambiarConexionView)
# are not strictly needed for the replication of existing provider/comprobante/contact management for this app.
# If the admin needs to create new providers via this decoupled frontend, ProveedorRegistroView would need to be adapted.
# If needed, authentication checks can be added in the future.
