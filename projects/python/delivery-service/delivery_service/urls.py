from django.urls import include, path
urlpatterns = [path('', include('homepage.urls')), path('zones/', include('zones.urls')), path('deliveries/', include('deliveries.urls'))]
