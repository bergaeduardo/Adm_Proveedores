from django.shortcuts import render

# Simple views to render the HTML templates
# These are needed for Django's URL resolution, even if the frontend is decoupled.
# The actual logic will be in the frontend JavaScript consuming the APIs.

def dashboard_view(request):
    return render(request, 'Administracion/dashboard.html')

def mis_datos_view(request):
    return render(request, 'Administracion/mis_datos.html')

def comprobantes_view(request):
    return render(request, 'Administracion/comprobantes.html')

def resumen_cuenta_view(request):
    # Assuming you have a template for resumen_cuenta
    return render(request, 'Administracion/resumen_cuenta.html')

def administrar_usuarios_view(request):
    return render(request, 'Administracion/administrar_usuarios.html')

def reporte_proveedores_view(request):
    """Vista para el reporte de proveedores con comprobantes"""
    return render(request, 'Administracion/reporte_proveedores.html')

def comprobantes_proveedor_view(request):
    """Vista para mostrar comprobantes filtrados de un proveedor"""
    return render(request, 'Administracion/comprobantes_proveedor.html')
