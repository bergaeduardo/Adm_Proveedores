from rest_framework import serializers
from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual
from Proveedores.serializers import (
    ProveedorSerializer as BaseProveedorSerializer,
    ComprobanteSerializer as BaseComprobanteSerializer,
)

class ProveedorSerializer(BaseProveedorSerializer):
    class Meta(BaseProveedorSerializer.Meta):
        model = Proveedor

class ComprobanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comprobante
        fields = ['id', 'tipo', 'numero', 'fecha_emision', 'monto_total',
                  'Num_Oc', 'archivo', 'estado', 'creado_en', 'proveedor']
        

class CpaContactosProveedorHabitualSerializer(serializers.ModelSerializer):
    username_django = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = CpaContactosProveedorHabitual
        fields = [
            'id', 'id_cpa_contactos_proveedor_habitual_sql',
            'cargo', 'defecto', 'cod_provee', 'nombre', 'telefono', 'telefono_movil', 'email',
            'direccion', 'observacion', 'tipo_documento', 'numero_documento',
            'envia_pdf_oc', 'envia_pdf_op', 'username_django'
        ]
        read_only_fields = ['id', 'cod_provee', 'username_django']
        extra_kwargs = {
            'cargo': {'required': False, 'allow_null': True, 'allow_blank': True},
            'defecto': {'required': False, 'allow_null': True, 'allow_blank': True},
            'nombre': {'required': False, 'allow_null': True, 'allow_blank': True},
            'telefono': {'required': False, 'allow_null': True, 'allow_blank': True},
            'telefono_movil': {'required': False, 'allow_null': True, 'allow_blank': True},
            'email': {'required': False, 'allow_null': True, 'allow_blank': True},
            'direccion': {'required': False, 'allow_null': True, 'allow_blank': True},
            'observacion': {'required': False, 'allow_null': True, 'allow_blank': True},
            'tipo_documento': {'required': False, 'allow_null': True},
            'numero_documento': {'required': False, 'allow_null': True, 'allow_blank': True},
            'envia_pdf_oc': {'required': False, 'allow_null': True, 'allow_blank': True},
            'envia_pdf_op': {'required': False, 'allow_null': True, 'allow_blank': True},
        }