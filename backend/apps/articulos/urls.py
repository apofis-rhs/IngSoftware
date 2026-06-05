from django.urls import path
from . import views

urlpatterns = [
    path('buscar/',                          views.buscar_articulos,   name='buscar-articulos'),
    path('<int:id_articulo>/alternativas/',  views.alternativas_articulo, name='alternativas-articulo'),
    path('<int:id_articulo>/',               views.detalle_articulo,   name='detalle-articulo'),
]
