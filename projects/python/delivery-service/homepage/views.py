from django.shortcuts import render
from deliveries.db import fetch, database_errors
@database_errors
def home(request):
    return render(request, 'homepage/home.html', {'total': fetch('count')[0]['total']})
