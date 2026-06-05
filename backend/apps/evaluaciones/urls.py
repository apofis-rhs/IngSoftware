from django.urls import path
from . import views

urlpatterns = [
    path('', views.crear_evaluacion, name='crear-evaluacion'),
]
