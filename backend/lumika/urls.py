from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Enrutadores maestros hacia tus 4 apps distribuidas
    path('api/usuarios/',     include('apps.usuarios.urls')),
    path('api/productos/',    include('apps.productos.urls')),
    path('api/articulos/',    include('apps.articulos.urls')),
    path('api/evaluaciones/', include('apps.evaluaciones.urls')),

    # La raíz limpia (/) la puedes dejar para redirigir al inicio de tu frontend
    path('', RedirectView.as_view(url='/static/inicio/inicio.html')),
]