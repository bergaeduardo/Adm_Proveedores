import os

# Elige settings_local.py o settings_production.py según la variable de entorno
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'production')

if ENVIRONMENT == 'production':
    from .settings_production import *
else:
    from .settings_local import *
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'proveedores_xl',
        'USER': 'postgres',
        'PASSWORD': 'P3RTU$',
        'HOST': 'localhost',
        'PORT': '5432',
    },
    'sqlserver': {
        'ENGINE': 'mssql',
        'NAME': 'LAKER_SA',
        'USER': 'sa',
        'PASSWORD': 'Axoft1988',
        'HOST': 'XL-TANGO',
        'PORT': '1433',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
        },
    },
    'sistemas_db': {
        'ENGINE': 'mssql',
        'NAME': 'sistemas',
        'USER': 'sa',
        'PASSWORD': 'Axoft1988',
        'HOST': 'XL-APPS',
        'PORT': '1433',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
        },
    },
}