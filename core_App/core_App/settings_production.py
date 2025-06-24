from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import timedelta # Importar timedelta


BASE_DIR = Path(__file__).resolve().parent.parent
CORE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, '.env')

# print(f"La ruta completa del archivo .env es: {env_path}")
# Intenta con dotenv_path
load_dotenv(dotenv_path=env_path, verbose=True)

# print("POSTGRES_DB:", os.environ.get("POSTGRES_DB"))
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'S#perS3crEt_1122')
DEBUG = True
# ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
ALLOWED_HOSTS = ['*']


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
                'django.template.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core_App.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST'),
        'PORT': os.environ.get('POSTGRES_PORT'),
    },
    'sqlserver': {
        'ENGINE': 'mssql',
        'NAME': os.environ.get('MSSQL_DB'),
        'USER': os.environ.get('MSSQL_USER'),
        'PASSWORD': os.environ.get('MSSQL_PASSWORD'),
        'HOST': os.environ.get('MSSQL_HOST'),
        'PORT': os.environ.get('MSSQL_PORT'),
        'OPTIONS': {
            'driver': 'ODBC Driver 13 for SQL Server',
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
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# Extra places for collectstatic to find static files.
STATICFILES_DIRS = [CORE_DIR + '/Proveedores/static']
print("STATICFILES_DIRS:", STATICFILES_DIRS)
print('STATIC_ROOT: ',STATIC_ROOT)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

X_FRAME_OPTIONS = 'SAMEORIGIN'
# X_FRAME_OPTIONS = ALLOWED_HOSTS

# Cierra la sesión al cerrar el navegador
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
# Para que las sesiones duren 1 día:
SESSION_COOKIE_AGE = 12 * 60 * 60

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
