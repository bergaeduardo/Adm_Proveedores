import os
import datetime # Importar datetime para isinstance checks
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models # Importar models para isinstance checks
from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual # Asegúrate que tus modelos estén aquí
import re
from django.utils.text import get_valid_filename # Para limpiar nombres de archivo
from django.db import connections # Import connections
from django.utils import timezone # Import timezone utilities

# Define the mapping from SQL Server column names to Django model field names
# This mapping is based on the db_column names defined in Proveedores/models.py
# REMOVED columns reported as invalid by SQL Server:
# 'NOM_PROV', 'COD_DESCRIP', 'PROVEEDOR_CM_JURISDICCION', 'RETENCIONES',
# 'ARTICULOS', 'CONCEPTOS', 'CONTACTOS', 'SUCURSALES', 'COD_PAIS',
# 'NOM_PAIS', 'DESC_CATEGORIA_IVA'
SQL_TO_MODEL_MAPPING = {
    'N_CUIT': 'n_cuit',
    'NOM_PROVEE': 'nom_provee',
    'COD_CPA01': 'cod_cpa01',
    'DOMICILIO': 'domicilio',
    'LOCALIDAD': 'localidad',
    'C_POSTAL': 'c_postal',
    'ID_CPA57': 'id_cpa57',
    # 'NOM_PROV': 'nom_prov', # REMOVED
    'TELEFONO_1': 'telefono_1',
    'TELEFONO_2': 'telefono_2',
    'TELEFONO_MOVIL': 'telefono_movil',
    'E_MAIL': 'e_mail',
    'WEB': 'web',
    'NOM_FANT': 'nom_fant',
    'DOMICILIO_COMERCIAL': 'domicilio_comercial',
    'ID_GVA151': 'id_gva151',
    'N_IVA': 'n_iva',
    'FECHA_ALTA': 'fecha_alta', # Incluido nuevamente, ya que el error era de naive datetime, no de columna inválida
    'FECHA_INHA': 'fecha_inha', # Incluido nuevamente
    'OBSERVACIO': 'observacio',
    'OBSERVAC_2': 'observac_2',
    'ID_CATEGORIA_IVA_COND_IVA': 'id_categoria_iva_cond_iva',
    'TIPO': 'tipo',
    'N_ING_BRUT': 'n_ing_brut',
    'CM_VIGENCIA_COEFICIENTE': 'cm_vigencia_coeficiente',
    'IVA_L': 'iva_l',
    'IVA_S': 'iva_s',
    'II_L': 'ii_l',
    'II_S': 'ii_s',
    'CALCU_RET': 'calcu_ret',
    'TEXTO_IB_1': 'texto_ib_1',
    'TEXTO_IB_2': 'texto_ib_2',
    'TEXTO_IB_3': 'texto_ib_3',
    'TEXTO_IB_4': 'texto_ib_4',
    'ID_OPERACION_AFIP_RG_3685_TIPO_OPERACION_COMPRAS': 'id_operacion_afip_rg_3685_tipo_operacion_compras',
    'ID_TIPO_COMPROBANTE_AFIP_RG_3685_COMPROBANTE_COMPRAS': 'id_tipo_compte_afip_rg_3685_compra',
    'RG_3685_GENERA_INFORMACION': 'rg_3685_genera_informacion',
    'RG_3572_EMPRESA_VINCULADA_PROVEEDOR': 'rg_3572_empr_vinc_proveedor',
    'ID_RG_3572_TIPO_OPERACION_HABITUAL_PROVEEDOR': 'id_rg_3572_tipo_operacion_habitual_proveedor',
    'CONTFISCAL': 'contfiscal',
    'T_FORM': 't_form',
    'CAI': 'cai',
    'FECHA_VTO': 'fecha_vto', # Incluido nuevamente
    'CITI_OPERA': 'citi_opera',
    'CITI_TIPO': 'citi_tipo',
    'ID_IVA_CLASIFICACION_SIAP_CLAS_SIAP': 'id_iva_clasificacion_siap_clas_siap',
    'LIM_CREDIT': 'lim_credit',
    'MONEDA_LIMITE_CREDITO_CTE': 'moneda_limite_credito_cte',
    'CLAUSULA': 'clausula',
    'INF_IVA': 'inf_iva',
    'NUM_AUTOMA': 'num_automa',
    'LETRA_HABI': 'letra_habi',
    'ID_CONDICION_COMPRA': 'id_condicion_compra',
    'PORC_DESC': 'porc_desc',
    'MON_CTE_HA': 'mon_cte_ha',
    'INC_IVA_LI': 'inc_iva_li',
    'INC_II_LIS': 'inc_ii_lis',
    'EDITA_COMPROBANTE_REFERENCIA_REMITO': 'edita_comprobante_referencia_remito',
    'DEFECTO_COMPROBANTE_REFERENCIA_REMITO': 'defecto_compra_referencia_remito',
    'EDITA_COMPROBANTE_REFERENCIA_FACTURA_REMITO': 'edita_comprobante_referencia_factura_remito',
    'DEFECTO_COMPROBANTE_REFERENCIA_FACTURA_REMITO': 'defecto_compra_referencia_factura_remito',
    'INGRESA_FACTURA_SIN_REMITO_ASOCIADO': 'ingresa_factura_sin_remito_asociado',
    'EDITA_COMPROBANTE_REFERENCIA_FACTURA': 'edita_comprobante_referencia_factura',
    'DEFECTO_COMPROBANTE_REFERENCIA_FACTURA': 'defecto_compra_referencia_factura',
    'EXPORTA': 'exporta',
    'ID_SUCURSAL_DESTINO': 'id_sucursal_destino',
    'ID_SBA01_CFONDO_PM': 'id_sba01_cfondo_pm',
    'ID_SBA01_CFUNICA_PM': 'id_sba01_cfunica_pm',
    'PAGO_CHE': 'pago_che',
    'DIAS_CH_PM': 'dias_ch_pm',
    'CBU': 'cbu',
    'DESCRIPCION_CBU': 'descripcion_cbu',
    'CBU_2': 'cbu_2',
    'DESCRIPCION_CBU_2': 'descripcion_cbu_2',
    'CBU_3': 'cbu_3',
    'DESCRIPCION_CBU_3': 'descripcion_cbu_3',
    'ORDEN': 'orden',
    'HABIL_PM': 'habil_pm',
    'OBSERVACIONES': 'observaciones',
    'TEXTO': 'texto',
    'TIPO_DOC': 'tipo_doc',
    'SALDO_CC_UNIDADES': 'saldo_cc_unidades',
    # 'COD_DESCRIP': 'cod_descript', # REMOVED
    # 'PROVEEDOR_CM_JURISDICCION': 'proveedor_cm_jurisdiccion', # REMOVED
    # 'RETENCIONES': 'retenciones', # REMOVED
    # 'ARTICULOS': 'articulos', # REMOVED
    # 'CONCEPTOS': 'conceptos', # REMOVED
    # 'CONTACTOS': 'contactos', # REMOVED
    # 'SUCURSALES': 'sucursales', # REMOVED
    # 'COD_PAIS': 'cod_pais', # REMOVED
    'COND_IVA': 'cond_iva', # This one was not in the error list, keeping it
    # 'NOM_PAIS': 'nom_pais', # REMOVED
    # 'DESC_CATEGORIA_IVA': 'desc_categoria_iva', # REMOVED
}

# List of columns to select from CPA01 based on the mapping keys
SQL_SELECT_COLUMNS = ', '.join(SQL_TO_MODEL_MAPPING.keys())

# Convert the function to be synchronous
def query_and_map_proveedor_data_sync(n_cuit, proveedor_instance):
    """
    Queries the external SQL Server database for provider data synchronously
    and maps the results to the given Proveedor instance.
    """
    try:
        # Get the database connection for the 'sqlserver' alias
        db_conn = connections['sqlserver']

        # Use a cursor within a 'with' statement for proper resource management
        with db_conn.cursor() as cursor:
            # Define the SQL query using positional placeholder '%s'
            # Use proper parameterization to prevent SQL injection
            sql_query = f"""
                SELECT {SQL_SELECT_COLUMNS}
                FROM CPA01
                WHERE N_CUIT = %s
            """
            # print("""SQL Query Template: """, sql_query) # Print the query template
            # print("""SQL Parameter: """, (n_cuit,)) # Print the parameter for debugging

            # Execute the query with the n_cuit as a parameter tuple
            # THIS IS THE CORRECT WAY TO PASS PARAMETERS
            cursor.execute(sql_query, (n_cuit,)) # <-- Synchronous execute with parameter

            # Fetch one row
            row = cursor.fetchone() # <-- Synchronous fetch

            if row:
                # Map the row data to the Proveedor instance
                # Get column names from cursor description
                columns = [col[0] for col in cursor.description]
                row_data = dict(zip(columns, row))

                # Get model fields for validation
                model_fields = {f.name: f for f in Proveedor._meta.get_fields()}

                for sql_col, model_field_name in SQL_TO_MODEL_MAPPING.items():
                    if sql_col in row_data:
                        value = row_data[sql_col]
                        model_field = model_fields.get(model_field_name)

                        if model_field:
                            # Handle None values explicitly
                            if value is None:
                                # Only set if the model field allows null/blank
                                if model_field.null or model_field.blank:
                                     setattr(proveedor_instance, model_field_name, None)
                                else:
                                     # Log a warning if a non-nullable field receives None
                                     print(f"Warning: Field '{model_field_name}' ({sql_col}) is not nullable but received None from SQL Server. Skipping field.")
                                continue # Skip further processing for this field

                            # Handle specific field types and potential data issues
                            if isinstance(model_field, models.BooleanField):
                                # Convert 0/1 or other truthy/falsy values to boolean
                                # Ensure value is not None before converting
                                setattr(proveedor_instance, model_field_name, bool(value))

                            elif isinstance(model_field, (models.DateTimeField, models.DateField)):
                                # Handle datetime/date fields
                                if isinstance(value, (datetime.datetime, datetime.date)):
                                    if isinstance(value, datetime.datetime) and timezone.is_naive(value):
                                        # Make naive datetimes aware
                                        try:
                                            # Use the current timezone from settings
                                            value = timezone.make_aware(value, timezone.get_current_timezone())
                                        except Exception as tz_e:
                                            print(f"Warning: Could not make naive datetime aware for field '{model_field_name}' ({sql_col}) with value {value}: {tz_e}. Skipping field.")
                                            # Optionally skip setting the field if timezone conversion fails
                                            continue
                                    setattr(proveedor_instance, model_field_name, value)
                                else:
                                    # Log if the value is not a datetime/date type but expected to be
                                    print(f"Warning: Field '{model_field_name}' ({sql_col}) expected datetime/date but received type {type(value)} with value {value}. Skipping field.")


                            elif isinstance(model_field, models.CharField):
                                # Handle CharFields, check max_length
                                if model_field.max_length is not None and isinstance(value, str):
                                    if len(value) > model_field.max_length:
                                        print(f"Warning: Value for field '{model_field_name}' ({sql_col}) is too long (length {len(value)}, max_length {model_field.max_length}). Value: '{value}'. Truncating value.")
                                        # Truncate the value to fit the max_length
                                        setattr(proveedor_instance, model_field_name, value[:model_field.max_length])
                                    else:
                                        # Value fits, assign it
                                        setattr(proveedor_instance, model_field_name, value)
                                elif isinstance(value, str):
                                     # CharField with no max_length or value is not a string (shouldn't happen if SQL data is correct)
                                     setattr(proveedor_instance, model_field_name, value)
                                else:
                                     print(f"Warning: Field '{model_field_name}' ({sql_col}) expected string but received type {type(value)} with value {value}. Skipping field.")


                            # Add other type handling as needed (DecimalField, IntegerField, etc.)
                            else:
                                # For other field types, attempt to set directly
                                try:
                                    setattr(proveedor_instance, model_field_name, value)
                                except Exception as set_e:
                                    print(f"Warning: Could not set value for field '{model_field_name}' ({sql_col}) with value {value} (type {type(value)}): {set_e}. Skipping field.")


                # Save the updated Proveedor instance
                proveedor_instance.save() # <-- Synchronous save
                print(f"Proveedor {proveedor_instance.n_cuit} updated with data from SQL Server.")
            else:
                print(f"No data found in SQL Server for CUIT: {n_cuit}")

    except Exception as e:
        # Log the error or handle it appropriately
        print(f"Error querying SQL Server or mapping data: {e}")
        # Depending on requirements, you might want to raise the exception
        # or ensure the transaction (if any) is rolled back.
        # Since this is happening after the Proveedor is created,
        # failing here means the Proveedor exists but wasn't updated.


class ComprobanteSerializer(serializers.ModelSerializer):
  archivo_url = serializers.SerializerMethodField(read_only=True)
  Num_Oc = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  # Quitar write_only de archivo si quieres que el serializador lo maneje en create/update
  # archivo = serializers.FileField()

  class Meta:
    model = Comprobante
    fields = ['id', 'tipo', 'numero', 'fecha_emision', 'monto_total', 'archivo', 'archivo_url', 'estado', 'creado_en', 'Num_Oc']
    read_only_fields = ['estado', 'creado_en', 'archivo_url']
    # Si el archivo se maneja en la vista (como en ProveedorViewSet), puede ser read_only aquí también
    # o excluido de fields si solo se usa para la subida y no se devuelve su data binaria.

  def get_archivo_url(self, obj):
    request = self.context.get('request')
    if obj.archivo and hasattr(obj.archivo, 'url') and request:
      return request.build_absolute_uri(obj.archivo.url)
    return None

  def validate_tipo(self, value):
    tipos_validos = [choice[0] for choice in Comprobante.TipoComprobante.choices]
    if value not in tipos_validos:
      raise serializers.ValidationError("Tipo de comprobante inválido.")
    return value

  def validate_archivo(self, value): # Esta validación se aplicará si 'archivo' no es write_only
    valid_mime_types = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if value.content_type not in valid_mime_types:
      raise serializers.ValidationError("Formato de archivo no permitido. Solo PDF, JPEG, PNG, DOC, DOCX.")
    if value.size > 10 * 1024 * 1024:  # 10MB max
      raise serializers.ValidationError("El archivo es demasiado grande. Máximo 10MB.")

    # Limpiar nombre de archivo
    value.name = get_valid_filename(value.name)
    return value

  def create(self, validated_data):
    # Esto asume que el usuario autenticado está creando un comprobante para su propio perfil de proveedor
    user = self.context['request'].user
    try:
      proveedor_instance = Proveedor.objects.get(username_django=user)
      validated_data['proveedor'] = proveedor_instance
    except Proveedor.DoesNotExist:
      raise serializers.ValidationError("Proveedor no asociado al usuario autenticado.")
    return super().create(validated_data)


class ProveedorRegistroSerializer(serializers.ModelSerializer):
  usuario = serializers.CharField(write_only=True, required=True)
  contrasena = serializers.CharField(write_only=True, required=True, min_length=6)

  class Meta:
    model = Proveedor
    fields = [
      'usuario', 'contrasena', 'nom_provee', 'n_cuit', 'e_mail',
      'nom_fant', 'cod_pais', 'nom_pais'
      # No incluir campos FileField aquí para el registro inicial, se cargan después.
    ]

  def validate_usuario(self, value):
    if User.objects.filter(username=value).exists():
      raise serializers.ValidationError("El nombre de usuario ya está en uso.")
    if not value or len(value.strip()) == 0:
      raise serializers.ValidationError("El nombre de usuario es obligatorio.")
    return value

  def validate_contrasena(self, value):
    # Puedes añadir más validaciones de complejidad de contraseña aquí
    if not value or len(value) < 6:
      raise serializers.ValidationError("La contraseña debe tener al menos 6 caracteres.")
    return value

  def validate_nom_provee(self, value):
    if not value or len(value.strip()) == 0:
      raise serializers.ValidationError("El nombre del proveedor es obligatorio.")
    return value

  def validate_n_cuit(self, value):
    if not value or len(value.strip()) == 0:
      raise serializers.ValidationError("El CUIL/CUIT es obligatorio.")
    cuit_pattern = r'^\d{2}-\d{8}-\d{1}$'
    if not re.match(cuit_pattern, value):
      raise serializers.ValidationError("El CUIL/CUIT debe tener el formato XX-XXXXXXXX-X.")
    # Opcional: validar si el CUIT ya existe en Proveedor
    # if Proveedor.objects.filter(n_cuit=value).exists():
    #   raise serializers.ValidationError("Este CUIT ya está registrado.")
    return value

  def validate_e_mail(self, value):
    # Opcional: validar si el email ya existe en User o Proveedor
    if User.objects.filter(email=value).exists():
        raise serializers.ValidationError("Este email ya está en uso por otro usuario.")
    # if Proveedor.objects.filter(e_mail=value).exists():
    #   raise serializers.ValidationError("Este email ya está registrado como proveedor.")
    return value

  def create(self, validated_data):
    usuario_data = validated_data.pop('usuario')
    contrasena_data = validated_data.pop('contrasena')
    email_data = validated_data.get('e_mail') # Usar el email del proveedor para el usuario
    n_cuit_data = validated_data.get('n_cuit') # Get n_cuit for the sync query

    user = User.objects.create_user(username=usuario_data, password=contrasena_data, email=email_data)
    proveedor = Proveedor.objects.create(username_django=user, **validated_data)

    # --- Start Sync SQL Query ---
    # Call the synchronous function to query SQL Server and update the provider
    if n_cuit_data:
        try:
            # Call the synchronous function directly
            query_and_map_proveedor_data_sync(n_cuit_data, proveedor)
        except Exception as e:
            # Handle potential errors during the sync operation
            print(f"Failed to run sync SQL query for CUIT {n_cuit_data}: {e}")
            # Decide how to handle this failure: log, raise, ignore?
            # For now, we just print and continue. The provider is still created.
    # --- End Sync SQL Query ---


    return {'user': user, 'proveedor': proveedor}


class ProveedorSerializer(serializers.ModelSerializer):
    # SerializerMethodFields para devolver URLs e información de archivos
    documentos_data = serializers.SerializerMethodField()

    class Meta:
        model = Proveedor
        fields = '__all__' # Incluir todos los campos del modelo
        read_only_fields = ['username_django', 'cod_cpa01', 'fecha_alta', 'fecha_inha']
        # Los campos FileField se manejarán para escritura en la vista (partial_update)
        # pero se pueden leer aquí.

    def get_documentos_data(self, obj):
        request = self.context.get('request')
        data = {}
        file_fields_info = [
            ('cuitFile', obj.cuit_file), ('ingBrutosFile', obj.ing_brutos_file),
            ('exclGananciasFile', obj.excl_ganancias_file), ('cm05File', obj.cm05_file),
            ('noRetGananciasFile', obj.no_ret_ganancias_file), ('exclIIBBFile', obj.excl_iibb_file),
            ('noRetIIBBFile', obj.no_ret_iibb_file), ('cbuFile', obj.cbu_file), # Añadido 'cbuFile'
        ]
        for key_frontend, field_instance in file_fields_info:
            if field_instance and hasattr(field_instance, 'name') and field_instance.name:
                url = None
                if hasattr(field_instance, 'url') and request:
                    url = request.build_absolute_uri(field_instance.url)
                data[key_frontend] = {
                    'name': os.path.basename(field_instance.name),
                    'url': url,
                    # Podrías añadir la fecha de última actualización si es relevante
                    # 'updated_at': getattr(obj, field_instance.field.name + '_updated_at', None)
                }
            else:
                data[key_frontend] = None
        return data

    def update(self, instance, validated_data):
        # Manejar la actualización de archivos (si se reciben) y otros campos
        # Los archivos se asignan directamente a la instancia en la vista antes de llamar a serializer.save()
        # Aquí solo se guardan los campos que no son FileInput

        # Quitar campos de archivo de validated_data si el serializador no debe manejarlos directamente
        file_field_names = [
            'cuit_file', 'ing_brutos_file', 'excl_ganancias_file', 'cm05_file',
            'no_ret_ganancias_file', 'excl_iibb_file', 'no_ret_iibb_file', 'cbu_file' # Añadido 'cbu_file'
        ]
        for field_name in file_field_names:
            if field_name in validated_data and isinstance(validated_data[field_name], str):
                # If it's a string (filename from a previous PATCH without a new file),
                # don't update it unless the file is also being updated.
                # File handling is done in the view.
                pass # The file is updated in the view if a new one is provided
            elif field_name in validated_data: # If it's an UploadedFile object
                 # The serializer will handle it or it was already handled in the view
                 pass


        return super().update(instance, validated_data)

class CpaContactosProveedorHabitualSerializer(serializers.ModelSerializer):
    # Si quieres que el frontend envíe booleanos y el serializer convierta a S/N y viceversa:
    # defecto = serializers.BooleanField(source='get_defecto_bool', required=False)
    # envia_pdf_oc = serializers.BooleanField(source='get_envia_pdf_oc_bool', required=False)
    # envia_pdf_op = serializers.BooleanField(source='get_envia_pdf_op_bool', required=False)
    # Sin embargo, es más simple si el frontend envía 'S' o 'N' directamente para estos CharFields.

    class Meta:
        model = CpaContactosProveedorHabitual # Este modelo ahora apunta a tu tabla de staging en PostgreSQL
        fields = [
            'id', # Este es el id de PostgreSQL, usado para CRUD vía API
            'nombre', 'cargo',
            'telefono', 'telefono_movil', 'email', 'observacion',
            'defecto', 'envia_pdf_oc', 'envia_pdf_op',
            'cod_provee',
            'id_cpa_contactos_proveedor_habitual_sql', # Lo incluimos para lectura, si es relevante para el frontend
        ]
        read_only_fields = [
            'id', # El id de PostgreSQL es PK y autoincremental
            'cod_provee', # Se establece en el backend
            'id_cpa_contactos_proveedor_habitual_sql' # Este campo no lo modifica el usuario directamente vía API
        ]

    def validate_nombre(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El nombre del contacto es obligatorio.")
        return value

    def validate_email(self, value):
        if value: # Opcional, si se requiere
            try:
                serializers.EmailField().run_validation(value)
            except serializers.ValidationError:
                raise serializers.ValidationError("El formato del email no es válido.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        try:
            # Asumimos que el modelo Proveedor apunta a la tabla de Proveedores en PostgreSQL (o default)
            proveedor_instance = Proveedor.objects.get(username_django=user)
        except Proveedor.DoesNotExist:
            # Si Proveedor también es una tabla de SQL Server y no está en la BD default/Postgres,
            # necesitarás una forma de obtener el cod_provee.
            # Podrías, por ejemplo, tener el cod_provee almacenado en el perfil de usuario Django,
            # o hacer una consulta a SQL Server aquí (menos ideal para el flujo de staging).
            # Por ahora, asumimos que Proveedor está accesible desde la conexión default.
            raise serializers.ValidationError({
                "detail": "No se encontró un proveedor principal asociado a este usuario en la base de datos de la aplicación."
            })

        validated_data['username_django'] = user
        validated_data['cod_provee'] = proveedor_instance.cod_cpa01
        # Note: The id_cpa_contactos_proveedor_habitual_sql field is read-only in the serializer
        # and is intended to be populated after synchronization, not during creation via API.
        # If you need to set it here based on SQL Server data, you'd need to query SQL Server
        # for the contact data as well, similar to the Proveedor data query.
        # For now, we assume this field is populated by a separate sync process.


        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Similar a create para la conversión S/N si es necesario
        # if 'defecto' in validated_data:
        #     validated_data['defecto'] = 'S' if validated_data.pop('defecto') else 'N'
        # if 'envia_pdf_oc' in validated_data:
        #     validated_data['envia_pdf_oc'] = 'S' if validated_data.pop('envia_pdf_oc') else 'N'
        # if 'envia_pdf_op' in validated_data:
        #     validated_data['envia_pdf_op'] = 'S' if validated_data.pop('envia_pdf_op') else 'N'
        return super().update(instance, validated_data)
