from django.urls import path
from . import views
app_name = 'zones'
urlpatterns = [path('', views.zone_list, name='list')]
