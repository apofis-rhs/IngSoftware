"""
Configuración de Django usada SOLO al correr pruebas (pytest / manage.py test).

Por qué existe este archivo:
  Todos los modelos de LUMIKA (Usuario, Producto, Favorito, etc.) tienen
  `managed = False` porque las tablas ya existen en PostgreSQL (Railway) y
  Django no debe tocar su esquema en producción.

  Pero para pruebas necesitamos que Django SÍ pueda crear y destruir tablas
  en una base de datos descartable. Por eso:
    1. Usamos SQLite en memoria (rápida, no requiere red, se descarta sola).
    2. Forzamos managed=True en cada modelo de las apps de LUMIKA, pero
       SOLO en este settings — settings.py normal queda intacto.

Uso:
    python manage.py test --settings=lumika.settings_test
    pytest  (ya configurado en pytest.ini para usar este settings)
"""
from .settings import *  # noqa: F401,F403  — heredamos todo lo demás

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Acelera los tests: el hasher real (PBKDF2) es deliberadamente lento.
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# NOTA IMPORTANTE sobre managed=False:
# No podemos recorrer django_apps.get_models() en este archivo, porque
# settings_test.py se importa como SETTINGS_MODULE *antes* de que Django
# termine de inicializar el registro de apps (lanzaría AppRegistryNotReady).
#
# La forma oficial de Django para correr código justo cuando todos los
# modelos ya están cargados es AppConfig.ready(). Por eso el override de
# managed=True para las apps de LUMIKA vive en:
#     apps/testing_overrides.py  (AppConfig.ready)
# y aquí solo lo registramos agregándolo a INSTALLED_APPS. Al ser el último
# en la lista, su ready() corre después de que usuarios/productos/articulos/
# evaluaciones ya registraron sus modelos.
INSTALLED_APPS = INSTALLED_APPS + ['apps.testing_overrides']
