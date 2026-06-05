from django.urls import path
from . import views

urlpatterns = [
    path('registro/',           views.registro,           name='registro'),
    path('login/',              views.login,              name='login'),
    path('perfil/',             views.perfil,             name='perfil'),
    path('cambiar-contrasena/', views.cambiar_contrasena, name='cambiar-contrasena'),
    path('historial/',          views.historial,          name='historial'),
    path('favoritos/',          views.favoritos,          name='favoritos'),
]
