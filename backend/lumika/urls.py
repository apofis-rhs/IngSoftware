from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponseRedirect

urlpatterns = [
    # Django admin
    path('django-admin/', admin.site.urls),

    # APIs
    path('api/usuarios/',     include('apps.usuarios.urls')),
    path('api/productos/',    include('apps.productos.urls')),
    path('api/articulos/',    include('apps.articulos.urls')),
    path('api/evaluaciones/', include('apps.evaluaciones.urls')),
]

# En desarrollo local el backend también sirve el frontend.
# En producción (Railway) el frontend vive en Firebase — no se necesita aquí.
if settings.DEBUG:
    from pathlib import Path
    from django.views.static import serve
    FRONTEND_DIR = str(Path(__file__).resolve().parent.parent.parent / 'frontend')
    urlpatterns += [
        path('', lambda req: HttpResponseRedirect('http://127.0.0.1:8000/inicio/inicio.html')),
        re_path(r'^(?P<path>.+)$', serve, {'document_root': FRONTEND_DIR}),
    ]
