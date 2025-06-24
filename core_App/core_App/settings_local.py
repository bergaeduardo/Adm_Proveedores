import os
from pathlib import Path
from datetime import timedelta # Importar timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key'
DEBUG = True
ALLOWED_HOSTS = ['*']
# ALLOWED_HOSTS = ['example.com', 'www.example.com']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'Proveedores',
    'consultasTango',  # <--- App renombrada
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core_App.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core_App.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'proveedores_xl',
        'USER': 'postgres',
        'PASSWORD': 'extra,123',
        'HOST': 'localhost',
        'PORT': '5432',
    },
    'sqlserver': {
        'ENGINE': 'mssql',
        'NAME': 'LAKER_SA',
        'USER': 'sa',
        'PASSWORD': 'Axoft1988',
        'HOST': 'SERVIDOR',
        'PORT': '1433',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
        },
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Configuración para extender la duración del token JWT
    'SIMPLE_JWT': {
        'ACCESS_TOKEN_LIFETIME': timedelta(days=1), # Token de acceso válido por 24 horas
        'REFRESH_TOKEN_LIFETIME': timedelta(days=7), # Opcional: Token de refresco válido por 7 días
        'ROTATE_REFRESH_TOKENS': False,
        'BLACKLIST_AFTER_ROTATION': False,
        'UPDATE_LAST_LOGIN': False,

        'ALGORITHM': 'HS256',
        'SIGNING_KEY': SECRET_KEY,
        'VERIFYING_KEY': '',
        'AUDIENCE': None,
        'ISSUER': None,
        'JSON_ENCODER': None,
        'JWK_URL': None,
        'LEEWAY': 0,

        'AUTH_HEADER_TYPES': ('Bearer',),
        'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
        'USER_ID_FIELD': 'id',
        'USER_ID_CLAIM': 'user_id',
        'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

        'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
        'TOKEN_TYPE_CLAIM': 'token_type',
        'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

        'JTI_CLAIM': 'jti',

        'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
        'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
        'SLIDING_TOKEN_OBTAIN_PAIR_CLASS': 'rest_framework_simplejwt.tokens.SlidingToken',
        'SLIDING_TOKEN_REFRESH_PAIR_CLASS': 'rest_framework_simplejwt.tokens.SlidingToken',
    }
}

DATABASE_ROUTERS = ['core_App.db_routers.DatabaseRouter']
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

X_FRAME_OPTIONS = 'SAMEORIGIN'
# X_FRAME_OPTIONS = ALLOWED_HOSTS

# Cierra la sesión al cerrar el navegador
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
# Para que las sesiones duren 1 Hora:
SESSION_COOKIE_AGE = 12 * 60 * 60

"""
La expresión 12 * 60 * 60 se refiere a la cantidad de segundos que representa la duración de la sesión.

Aquí te explico la lógica detrás de esta expresión:

60 segundos son 1 minuto
60 minutos son 1 hora
12 horas son... ¡12 horas!
Entonces, 12 * 60 * 60 es igual a 12 horas x 60 minutos/hora x 60 segundos/minuto = 43200 segundos

Por lo tanto, SESSION_COOKIE_AGE = 12 * 60 * 60 representa una duración de sesión de 12 horas.
"""
