from django.urls import path
from . import views

urlpatterns = [
    path('buscar/',                         views.buscar_productos,      name='buscar-productos'),
    path('comparar/',                       views.comparar_productos,    name='comparar-productos'),
    path('<int:id_producto>/alternativas/', views.alternativas_producto, name='alternativas-producto'),
    path('<int:id_producto>/clasificar/',   views.clasificar_producto,   name='clasificar-producto'),
    path('<int:id_producto>/',              views.detalle_producto,      name='detalle-producto'),
    path('',                                views.lista_productos,       name='lista-productos'),
]
