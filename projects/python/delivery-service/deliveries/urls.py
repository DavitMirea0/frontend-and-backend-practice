from django.urls import path
from . import views
app_name = 'deliveries'
urlpatterns = [path('', views.delivery_list, name='list'), path('statistics/', views.statistics, name='statistics'), path('<slug:slug>/', views.detail, name='detail')]
