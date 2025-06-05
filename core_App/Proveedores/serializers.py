import os
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual # Asegúrate que tus modelos estén aquí
import re
from django.utils.text import get_valid_filename # Para limpiar nombres de archivo

class ComprobanteSerializer(serializers.ModelSerializer):
  archivo_url = serializers.SerializerMethodField(read_only=True)
  # Quitar write_only de archivo si quieres que el serializador lo maneje en create/update
  # archivo = serializers.FileField() 

  class Meta:
    model = Comprobante
    fields = ['id', 'tipo', 'numero', 'fecha_emision', 'monto_total', 'archivo', 'archivo_url', 'estado', 'creado_en']
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

    user = User.objects.create_user(username=usuario_data, password=contrasena_data, email=email_data)
    proveedor = Proveedor.objects.create(username_django=user, **validated_data)
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
            ('noRetIIBBFile', obj.no_ret_iibb_file),
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
            'no_ret_ganancias_file', 'excl_iibb_file', 'no_ret_iibb_file'
        ]
        for field_name in file_field_names:
            if field_name in validated_data and isinstance(validated_data[field_name], str):
                # Si es un string (nombre de archivo de un PATCH anterior sin archivo nuevo),
                # no lo actualices a menos que el archivo también se esté actualizando.
                # El manejo de archivos se hace en la vista.
                pass # El archivo se actualiza en la vista si se proporciona uno nuevo
            elif field_name in validated_data: # Si es un objeto UploadedFile
                 # El serializador lo manejará o ya fue manejado en la vista
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
