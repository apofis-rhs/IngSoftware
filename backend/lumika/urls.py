from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from pathlib import Path

# frontend/ está al mismo nivel que backend/
FRONTEND_DIR = str(Path(__file__).resolve().parent.parent.parent / 'frontend')

urlpatterns = [
    # Django admin — ruta diferente para no chocar con carpeta admin/ del frontend
    path('django-admin/', admin.site.urls),

    # APIs
    path('api/usuarios/',     include('apps.usuarios.urls')),
    path('api/productos/',    include('apps.productos.urls')),
    path('api/articulos/',    include('apps.articulos.urls')),
    path('api/evaluaciones/', include('apps.evaluaciones.urls')),

    # Raíz → página de inicio del sistema
    path('', lambda req: HttpResponseRedirect('/inicio/inicio.html')),

    # Sirve todos los archivos estáticos del frontend
    re_path(r'^(?P<path>.+)$', serve, {'document_root': FRONTEND_DIR}),
]
