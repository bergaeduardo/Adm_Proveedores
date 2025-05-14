from django.apps import AppConfig

class DynamicApiEngineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dynamic_api_engine' 
    # Django will look for this app in 'core_App/dynamic_api_engine' 
    # if 'core_App' is the project root.
    # When adding to INSTALLED_APPS, you will use 'dynamic_api_engine'
    # or 'dynamic_api_engine.apps.DynamicApiEngineConfig'
    verbose_name = "Dynamic API Engine"
