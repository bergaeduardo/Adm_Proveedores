from rest_framework import serializers

class RequireProveedorMixin:
  def _get_proveedor_or_400(self, request):
    proveedor = getattr(request, 'proveedor', None)
    if proveedor is None:
      pid = request.query_params.get('proveedor_id') or request.data.get('proveedor_id')
      raise serializers.ValidationError({'proveedor_id': 'Requerido. No se detectó proveedor en sesión ni en la solicitud.' if not pid else 'Proveedor inválido.'})
    return proveedor