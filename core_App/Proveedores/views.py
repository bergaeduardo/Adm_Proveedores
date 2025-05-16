from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from Proveedores.models import Proveedor
from rest_framework.authtoken.models import Token

def register(request):
  # Renderiza la plantilla de registro, la lógica de registro se maneja vía API RESTful
  return render(request, 'registro.html')

def login_view(request):
  return render(request, 'login.html')

def mis_datos_view(request):
  # Solo renderiza el template, los datos se obtienen vía JS usando JWT
  return render(request, 'mis_datos.html')

def login_view(request):
  if request.method == 'POST':
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(request, username=username, password=password)
    if user is not None:
      login(request, user)
      return redirect('home')
    else:
      return render(request, 'login.html', {'error': 'Credenciales inválidas'})

  return render(request, 'login.html')
