from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/usuarios/',    include('apps.usuarios.urls')),
    path('api/productos/',   include('apps.productos.urls')),
    path('api/articulos/',   include('apps.articulos.urls')),
    path('api/evaluaciones/', include('apps.evaluaciones.urls')),

    #path('', RedirectView.as_view(url='/auth/inicio/inicio.html')),

]
