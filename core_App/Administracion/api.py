from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.db import connections
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import json
import os
from django.utils import timezone
import re
import traceback
import decimal

# Import models and serializers from the Proveedores app
from Proveedores.models import Proveedor, Comprobante, CpaContactosProveedorHabitual
from Proveedores.serializers import ProveedorSerializer, ComprobanteSerializer, CpaContactosProveedorHabitualSerializer, ProveedorRegistroSerializer # Keep ProveedorRegistroSerializer if needed for admin creation
from consultasTango.models import Cpa57 # Assuming this model is needed and accessible

# --- Custom Authentication Check ---
_ADMIN_CREDENTIALS = None

def _load_admin_credentials():
    """Load admin credentials from JSON file defined in settings."""
    global _ADMIN_CREDENTIALS
    if _ADMIN_CREDENTIALS is None:
        creds_path = settings.ADMIN_CREDENTIALS_FILE
        try:
            with open(creds_path, 'r') as f:
                _ADMIN_CREDENTIALS = json.load(f)
        except FileNotFoundError:
            # Bubble this up so check_admin_auth can return a clear response
            raise FileNotFoundError(
                f"Admin credentials file not found at '{creds_path}'. "
                "Create it from admin_credentials.example.json or set the "
                "ADMIN_CREDENTIALS_FILE environment variable."
            )
    return _ADMIN_CREDENTIALS

def check_admin_auth(request):
    """Validate credentials provided in each request against config file."""
    username = request.data.get('username') or request.query_params.get('username')
    password = request.data.get('password') or request.query_params.get('password')

    if not username or not password:
        return False, Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        creds = _load_admin_credentials()
    except FileNotFoundError as e:
        return False, Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    if username != creds.get('username') or password != creds.get('password'):
        return False, Response({'detail': 'Invalid username/password.'}, status=status.HTTP_401_UNAUTHORIZED)

    return True, None

# --- Replicated and Adapted API Views ---

class AdministracionProveedorViewSet(viewsets.ModelViewSet):
    """
    Replicated ProveedorViewSet with custom admin authentication.
    """
    queryset = Proveedor.objects.all() # Still uses Proveedores model
    serializer_class = ProveedorSerializer
    parser_classes = [MultiPartParser, FormParser]

    def dispatch(self, request, *args, **kwargs):
        # Apply custom authentication check before any http method handler
        ok, response = check_admin_auth(request)
        if not ok:
            return response
        return super().dispatch(request, *args, **kwargs)

    # Override methods to ensure custom auth is checked (dispatch handles this, but explicit is clearer)
    def list(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        print(f"DEBUG: Entering AdministracionProveedorViewSet retrieve method.")
        print(f"DEBUG: Received PK: {kwargs.get('pk')}")
        try:
            instance = self.get_object()
            print(f"DEBUG: Successfully retrieved object: {instance}")
            serializer = self.get_serializer(instance)
            print(f"DEBUG: Serializer data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            print(f"DEBUG: Error in retrieve method: {e}")
            traceback.print_exc() # Print full traceback
            return Response({"error": "Error retrieving provider data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def create(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Do not link to a Django user; admin credentials are external
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    def update(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        instance = self.get_object()
        # Optional: Add check if the provider is linked to the admin user if needed
        # if instance.username_django != request.user:
        #     return Response({'detail': 'No tiene permiso para modificar este proveedor.'}, status=status.HTTP_403_FORBIDDEN)

        # Handle file uploads manually as in the original Proveedores API
        file_field_map = {
            'cuitFile': 'cuit_file',
            'ingBrutosFile': 'ing_brutos_file',
            'exclGananciasFile': 'excl_ganancias_file',
            'cm05File': 'cm05_file',
            'noRetGananciasFile': 'no_ret_ganancias_file',
            'exclIIBBFile': 'excl_iibb_file',
            'cbuFile': 'cbu_file', # Corrected mapping based on mis_datos.html and Proveedores/api.py
        }

        data_for_serializer = request.data.copy()
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

                data_for_serializer[model_field_name] = uploaded_file
                # Assuming you have corresponding _updated_at fields in the model
                if hasattr(instance, f'{model_field_name}_updated_at'):
                    data_for_serializer[f'{model_field_name}_updated_at'] = now

                # Remove the frontend key from data_for_serializer if it exists,
                # as the file is handled via request.FILES
                if frontend_key in data_for_serializer:
                     del data_for_serializer[frontend_key]

        serializer = self.get_serializer(instance, data=data_for_serializer, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        updated_instance = self.get_object()
        response_serializer = self.get_serializer(updated_instance)

        return Response(response_serializer.data)


    def partial_update(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        return self.update(request, *args, **kwargs) # partial_update uses the same logic as update here

    def destroy(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        # Data preservation requirement: FORBIDDEN: Destructive operations (DROP, DELETE)
        return Response({'detail': 'Delete operations are not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class AdministracionCpaContactosProveedorHabitualViewSet(viewsets.ModelViewSet):
    """
    Replicated CpaContactosProveedorHabitualViewSet with custom admin authentication.
    """
    queryset = CpaContactosProveedorHabitual.objects.all() # Still uses Proveedores model
    serializer_class = CpaContactosProveedorHabitualSerializer

    def dispatch(self, request, *args, **kwargs):
        ok, response = check_admin_auth(request)
        if not ok:
            return response
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        # Filter contacts only by the selected provider id
        # For admin, we might want to see ALL contacts or contacts for a SELECTED provider.
        # Based on the dashboard requirement, the frontend will select a provider.
        # We need to get the provider ID from the request (e.g., query param or body)
        # and filter contacts for that provider.
        # Let's assume provider_id is passed as a query parameter for GET list/retrieve
        # and in the request body for POST/PUT/PATCH/DELETE.

        provider_id = self.request.query_params.get('proveedor_id') or self.request.data.get('proveedor_id')

        if not provider_id:
             # If no provider_id is provided, return an empty queryset or error
             # Returning empty queryset is safer
             return CpaContactosProveedorHabitual.objects.none()

        try:
            # Find the Proveedor instance based on the provided ID
            proveedor_instance = Proveedor.objects.get(id=provider_id)
            # Filter contacts for this specific provider
            return CpaContactosProveedorHabitual.objects.filter(cod_provee=proveedor_instance.cod_cpa01)
        except Proveedor.DoesNotExist:
            return CpaContactosProveedorHabitual.objects.none() # Provider not found

    def perform_create(self, serializer):
        # check_admin_auth is called in dispatch
        # Need to link the contact to the correct provider based on the request
        provider_id = self.request.data.get('proveedor_id')
        if not provider_id:
             raise serializers.ValidationError({"proveedor_id": "Proveedor ID is required."})

        try:
            proveedor_instance = Proveedor.objects.get(id=provider_id)
            # Link the contact only to the provider
            serializer.save(cod_provee=proveedor_instance.cod_cpa01)
        except Proveedor.DoesNotExist:
             raise serializers.ValidationError({"proveedor_id": "Invalid Proveedor ID."})


    def perform_update(self, serializer):
        # check_admin_auth is called in dispatch
        # Ensure the contact belongs to a provider accessible by the admin (optional, get_queryset handles filtering)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        # Data preservation requirement: FORBIDDEN: Destructive operations (DROP, DELETE)
        return Response({'detail': 'Delete operations are not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class AdministracionComprobanteViewSet(viewsets.ModelViewSet):
    """
    Replicated ComprobanteViewSet with custom admin authentication.
    """
    queryset = Comprobante.objects.all() # Still uses Proveedores model
    serializer_class = ComprobanteSerializer
    parser_classes = [MultiPartParser, FormParser]

    def dispatch(self, request, *args, **kwargs):
        ok, response = check_admin_auth(request)
        if not ok:
            return response
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        # Filter comprobantes by the selected provider ID from the request
        provider_id = self.request.query_params.get('proveedor_id') or self.request.data.get('proveedor_id')

        if not provider_id:
             return Comprobante.objects.none()

        try:
            proveedor_instance = Proveedor.objects.get(id=provider_id)
            # Filter comprobantes for this specific provider
            return Comprobante.objects.filter(proveedor=proveedor_instance)
        except Proveedor.DoesNotExist:
            return Comprobante.objects.none() # Provider not found

    def perform_create(self, serializer):
        # check_admin_auth is called in dispatch
        # Need to link the comprobante to the correct provider based on the request
        provider_id = self.request.data.get('proveedor_id')
        if not provider_id:
             raise serializers.ValidationError({"proveedor_id": "Proveedor ID is required."})

        try:
            proveedor_instance = Proveedor.objects.get(id=provider_id)
            serializer.save(proveedor=proveedor_instance)
        except Proveedor.DoesNotExist:
             raise serializers.ValidationError({"proveedor_id": "Invalid Proveedor ID."})

    def perform_update(self, serializer):
        # check_admin_auth is called in dispatch
        # Ensure the comprobante belongs to a provider accessible by the admin (optional, get_queryset handles filtering)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        # check_admin_auth is called in dispatch
        # Data preservation requirement: FORBIDDEN: Destructive operations (DROP, DELETE)
        return Response({'detail': 'Delete operations are not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


# --- New API for Provider Search ---
class AdministracionProveedorSearchView(APIView):
    """
    API to search for Proveedores with custom admin authentication.
    """
    def post(self, request, *args, **kwargs):
        ok, response = check_admin_auth(request)
        if not ok:
            return response

        query = request.data.get('query', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)

        # Search providers by nom_provee or n_cuit
        # Using __icontains for case-insensitive search
        providers = Proveedor.objects.filter(
            Q(nom_provee__icontains=query) | Q(n_cuit__icontains=query)
        ).values('id', 'nom_provee', 'n_cuit')[:20] # Limit results

        # Format results for the frontend
        results = [{"id": p['id'], "display": f"{p['nom_provee']} ({p['n_cuit']})"} for p in providers]

        return Response(results, status=status.HTTP_200_OK)

# --- Replicated Utility Views (with custom auth) ---

class AdministracionProvinciaListView(APIView):
  """
  Replicated ProvinciaListView with custom admin authentication.
  """
  def dispatch(self, request, *args, **kwargs):
      ok, response = check_admin_auth(request)
      if not ok:
          return response
      return super().dispatch(request, *args, **kwargs)

  def get(self, request):
    query = request.GET.get('q', '')
    # Assuming Cpa57 is accessible and has the required fields
    provincias = Cpa57.objects.filter(nom_provin__icontains=query).values('id_cpa57', 'cod_provin', 'nom_provin')[:50] # Limit results
    data = [{'id': p['id_cpa57'], 'display': f"{p['nom_provin']}"} for p in provincias]
    return Response(data, status=status.HTTP_200_OK)

class AdministracionCategoriaIVAListView(APIView):
  """
  Replicated CategoriaIVAListView with custom admin authentication.
  """
  def dispatch(self, request, *args, **kwargs):
      ok, response = check_admin_auth(request)
      if not ok:
          return response
      return super().dispatch(request, *args, **kwargs)

  def get(self, request):
    try:
      # Assuming 'sqlserver' connection is configured and accessible
      with connections['sqlserver'].cursor() as cursor:
        cursor.execute("SELECT ID_CATEGORIA_IVA, COD_CATEGORIA_IVA, DESC_CATEGORIA_IVA FROM CATEGORIA_IVA")
        rows = cursor.fetchall()
        data = [{"id_categoria_iva": row[0], "cod_categoria_iva": row[1], "desc_categoria_iva": row[2]} for row in rows]
      return Response(data)
    except Exception as e:
      traceback.print_exc() # Log the error
      return Response({"error": f"Error al obtener categorías de IVA: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdministracionIngresosBrutosListView(APIView):
  """
  Replicated IngresosBrutosListView with custom admin authentication.
  """
  def dispatch(self, request, *args, **kwargs):
      ok, response = check_admin_auth(request)
      if not ok:
          return response
      return super().dispatch(request, *args, **kwargs)

  def get(self, request):
    # Using the same dictionary as in Proveedores API
    Ingresos_brutos = {
      '': '',
      'L': 'Local',
      'M': 'Multilateral',
      'S': 'Reg. simplificado',
    }
    data = [{'Cod_Ingresos_brutos': key, 'Desc_Ingresos_brutos': value} for key, value in Ingresos_brutos.items()]
    return Response(data, status=status.HTTP_200_OK)

class AdministracionResumenCuentaProveedorView(APIView):
  """
  Replicated ResumenCuentaProveedorView with custom admin authentication.
  Requires 'proveedor_id' in query params or body.
  """
  def dispatch(self, request, *args, **kwargs):
      ok, response = check_admin_auth(request)
      if not ok:
          return response
      return super().dispatch(request, *args, **kwargs)

  def get(self, request, *args, **kwargs):

    # Get the selected provider ID from the request
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
# are not strictly needed for the *replication* of existing provider/comprobante/contact management for an admin user.
# If the admin needs to *create* new providers via this decoupled frontend, ProveedorRegistroView would need to be adapted
# with the custom authentication check. For now, I'll omit them to focus on the core replication task.
# If needed, they can be added back with the check_admin_auth applied.

# Need Q object for search view
from django.db.models import Q
