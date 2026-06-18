"""
App auxiliar que SOLO se activa en settings_test.py (no en settings.py de
producción). Su único propósito es forzar managed=True en los modelos de
LUMIKA para que el test runner pueda crear sus tablas en SQLite.

Por qué es una app y no una función suelta:
    AppConfig.ready() es el hook oficial de Django para correr código
    justo después de que TODAS las apps ya registraron sus modelos
    (se llama una vez por cada app, en el orden de INSTALLED_APPS).
    Como esta app está al final de INSTALLED_APPS en settings_test.py,
    su ready() se ejecuta después de usuarios/productos/articulos/
    evaluaciones, así que get_models() ya puede iterarlos sin riesgo
    de AppRegistryNotReady.
"""
from django.apps import AppConfig


class TestingOverridesConfig(AppConfig):
    name = 'apps.testing_overrides'
    label = 'testing_overrides'

    def ready(self):
        from django.apps import apps as django_apps

        apps_lumika = {'usuarios', 'productos', 'articulos', 'evaluaciones'}

        for model in django_apps.get_models():
            if model._meta.app_label in apps_lumika:
                model._meta.managed = True
