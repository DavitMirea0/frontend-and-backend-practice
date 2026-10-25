from django.shortcuts import render
from deliveries.db import fetch, database_errors
@database_errors
def zone_list(request):
    return render(request, 'zones/zone_list.html', {'zones': fetch('zones')})
