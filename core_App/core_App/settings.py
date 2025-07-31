import os

# Choose settings module based on DJANGO_ENV
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'production')

if ENVIRONMENT == 'production':
    from .settings_production import *
elif ENVIRONMENT == 'test':
    from .settings_test import *
else:
    from .settings_local import *
