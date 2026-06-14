from django.urls import path
from . import views

urlpatterns = [
    # Esto responderá a: /api/productos/
    path('', views.lista_productos, name='lista_productos'), 
    
    path('gestion/', views.lista_productos, name='gestion_productos'),
    # Esto responderá a: /api/productos/<id>/
    path('<int:id_producto>/', views.detalle_producto, name='detalle_producto'),
    
    # Esto responderá a: /api/productos/<id>/clasificar/
    path('<int:id_producto>/clasificar/', views.clasificar_producto, name='clasificar_producto'),
    
    # Esto responderá a: /api/productos/<id>/alternativas/
    path('<int:id_producto>/alternativas/', views.alternativas_producto, name='alternativas_producto'),
    
    # Esto responderá a: /api/productos/buscar/
    path('buscar/', views.buscar_productos, name='buscar_productos'),
]