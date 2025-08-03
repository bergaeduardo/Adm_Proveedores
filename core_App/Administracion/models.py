from django.db import models
from Proveedores.models import (
    Proveedor as BaseProveedor,
    Comprobante as BaseComprobante,
    CpaContactosProveedorHabitual as BaseCpaContactosProveedorHabitual,
)


class Proveedor(BaseProveedor):
    class Meta:
        proxy = True


class Comprobante(BaseComprobante):
    class Meta:
        proxy = True


class CpaContactosProveedorHabitual(BaseCpaContactosProveedorHabitual):
    class Meta:
        proxy = True
