"""
Serializador para el modelo Proveedor y creación de usuario.
Incluye validaciones personalizadas y mensajes en español.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Proveedor, Comprobante
import re

class ComprobanteSerializer(serializers.ModelSerializer):
  archivo = serializers.FileField(write_only=True)
  archivo_url = serializers.SerializerMethodField(read_only=True)

  class Meta:
    model = Comprobante
    fields = ['id', 'tipo', 'numero', 'fecha_emision', 'monto_total', 'archivo', 'archivo_url', 'estado', 'creado_en']
    read_only_fields = ['estado', 'creado_en', 'archivo_url']

  def get_archivo_url(self, obj):
    request = self.context.get('request')
    if obj.archivo and request:
      return request.build_absolute_uri(obj.archivo.url)
    return None

  def validate_tipo(self, value):
    tipos_validos = [choice[0] for choice in Comprobante.TipoComprobante.choices]
    if value not in tipos_validos:
      raise serializers.ValidationError("Tipo de comprobante inválido.")
    return value

  def validate_archivo(self, value):
    valid_mime_types = ['application/pdf', 'image/jpeg', 'image/png']
    if value.content_type not in valid_mime_types:
      raise serializers.ValidationError("Formato de archivo no permitido. Solo PDF, JPEG y PNG.")
    if value.size > 10 * 1024 * 1024:  # 10MB max
      raise serializers.ValidationError("El archivo es demasiado grande. Máximo 10MB.")
    return value

  def create(self, validated_data):
    proveedor = self.context['request'].user.proveedores.first()
    if not proveedor:
      raise serializers.ValidationError("Proveedor no asociado al usuario.")
    validated_data['proveedor'] = proveedor
    return super().create(validated_data)

class ProveedorRegistroSerializer(serializers.ModelSerializer):
  usuario = serializers.CharField(write_only=True, required=True)
  contrasena = serializers.CharField(write_only=True, required=True, min_length=6)

  class Meta:
    model = Proveedor
    fields = [
      'usuario',
      'contrasena',
      'nom_provee',
      'n_cuit',
      'e_mail',
      'nom_fant',
      'cod_pais',
      'nom_pais'
    ]

  def validate_usuario(self, value):
    if User.objects.filter(username=value).exists():
      raise serializers.ValidationError("El nombre de usuario ya está en uso.")
    if not value or len(value.strip()) == 0:
      raise serializers.ValidationError("El nombre de usuario es obligatorio.")
    return value

  def validate_contrasena(self, value):
    if not value or len(value) < 6:
      raise serializers.ValidationError("La contraseña debe tener al menos 6 caracteres.")
    return value

  def validate_nom_provee(self, value):
    if not value or len(value.strip()) == 0:
      raise serializers.ValidationError("El nombre comercial es obligatorio.")
    return value

  def validate_n_cuit(self, value):
    if not value or len(value.strip()) == 0:
      raise serializers.ValidationError("El CUIL/CUIT es obligatorio.")
    # Validar formato: XX-XXXXXXXX-X (ej: 20-31441849-3)
    cuit_pattern = r'^\d{2}-\d{8}-\d{1}$'
    if not re.match(cuit_pattern, value):
      raise serializers.ValidationError("El CUIL/CUIT debe tener el formato XX-XXXXXXXX-X (ejemplo: 20-31441849-3).")
    return value

  def validate_e_mail(self, value):
    if Proveedor.objects.filter(e_mail=value).exists():
      raise serializers.ValidationError("El email ya está registrado como proveedor.")
    return value

  def create(self, validated_data):
    usuario = validated_data.pop('usuario')
    contrasena = validated_data.pop('contrasena')
    # Crear usuario Django
    user = User.objects.create_user(username=usuario, password=contrasena)
    # Crear proveedor y asociar el usuario
    proveedor = Proveedor.objects.create(username_django=user, **validated_data)
     # DEBUG: imprime la relación
    print(f"Proveedor creado: {proveedor.id}, username_django={proveedor.username_django_id}, user.id={user.id}")
    return {'user': user, 'proveedor': proveedor}

# --- AGREGADO: Serializador clásico para el CRUD de proveedores ---
class ProveedorSerializer(serializers.ModelSerializer):
  class Meta:
    model = Proveedor
    fields = '__all__'
