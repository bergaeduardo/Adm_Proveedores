import os

# Elige settings_local.py o settings_production.py según la variable de entorno
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'production')

if ENVIRONMENT == 'production':
    from .settings_production import *
else:
    from .settings_local import *
