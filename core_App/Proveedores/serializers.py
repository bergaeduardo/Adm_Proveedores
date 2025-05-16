"""
Serializador para el modelo Proveedor y creación de usuario.
Incluye validaciones personalizadas y mensajes en español.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Proveedor

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
      'nom_fant'
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
    if not value.isdigit() or len(value) != 11:
      raise serializers.ValidationError("El CUIL/CUIT debe tener 11 dígitos numéricos.")
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
