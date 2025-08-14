from django.utils.deprecation import MiddlewareMixin
from .models import Proveedor

class ProveedorContextMiddleware(MiddlewareMixin):
  def process_request(self, request):
    pid = request.GET.get('proveedor_id') or request.POST.get('proveedor_id')
    if pid:
      request.session['proveedor_id'] = pid
    pid = request.session.get('proveedor_id')
    request.proveedor = None
    if pid:
      try:
        request.proveedor = Proveedor.objects.select_related('username_django').get(pk=pid)
      except Proveedor.DoesNotExist:
        request.session.pop('proveedor_id', None)