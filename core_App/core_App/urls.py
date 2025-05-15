"""core_App URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from Proveedores.api import ProveedorViewSet

# Registrar el router global para exponer /api/proveedores/
router = DefaultRouter()
router.register(r'api/listar_proveedores', ProveedorViewSet, basename='proveedor')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('Proveedores/', include('Proveedores.urls')),
    # path('', include(router.urls)),  # Esto expone /api/proveedores/ en la raíz
]
