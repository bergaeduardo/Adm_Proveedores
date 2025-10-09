from django.utils.deprecation import MiddlewareMixin
from .models import Proveedor
from django.conf import settings
from django.http import HttpResponseForbidden
from ipaddress import ip_address, ip_network

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



class IPWhitelistMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_networks = [ip_network(str(ip), strict=False) for ip in settings.ALLOWED_ADMIN_IPS]

    def __call__(self, request):
        if request.path.startswith('/administracion/'):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

            if ip:
                print(f"Request from IP: {ip} to {request.path}") # Log the IP
                client_ip = ip_address(ip)
                is_allowed = any(client_ip in net for net in self.allowed_networks)

                if not is_allowed:
                    return HttpResponseForbidden(f"Acceso denegado. Su dirección IP ({request.META['REMOTE_ADDR']} - {ip}) no está permitida para acceder a esta sección.")
            else:
                return HttpResponseForbidden("Acceso denegado. No se pudo determinar su dirección IP.")

        response = self.get_response(request)
        return response
