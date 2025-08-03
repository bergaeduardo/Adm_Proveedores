from Proveedores.serializers import (
    ProveedorSerializer as BaseProveedorSerializer,
    ComprobanteSerializer as BaseComprobanteSerializer,
    CpaContactosProveedorHabitualSerializer as BaseCpaContactosProveedorHabitualSerializer,
)
from .models import Proveedor, Comprobante, CpaContactosProveedorHabitual


class ProveedorSerializer(BaseProveedorSerializer):
    class Meta(BaseProveedorSerializer.Meta):
        model = Proveedor


class ComprobanteSerializer(BaseComprobanteSerializer):
    class Meta(BaseComprobanteSerializer.Meta):
        model = Comprobante


class CpaContactosProveedorHabitualSerializer(BaseCpaContactosProveedorHabitualSerializer):
    class Meta(BaseCpaContactosProveedorHabitualSerializer.Meta):
        model = CpaContactosProveedorHabitual

