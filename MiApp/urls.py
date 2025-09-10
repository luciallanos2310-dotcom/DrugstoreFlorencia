from django.urls import path
from MiApp import views

urlpatterns = [
   path('', views.mi_vista, name='inicio'),
]