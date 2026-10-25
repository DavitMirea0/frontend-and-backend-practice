from django.http import Http404
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from .db import (
    connect_db, prepare_deliveries, fetch, database_errors, number, SORTS,
    STATUSES, update_status,
)

@database_errors
def delivery_list(request):
    context = {'sorts': SORTS, 'sort': request.GET.get('sort', 'date'), 'boxes': request.GET.get('boxes', ''), 'limit': request.GET.get('limit', '')}
    try:
        boxes = number(request, 'boxes', 0)
        limit = number(request, 'limit', -1, 1, 1000)
        if context['sort'] not in SORTS:
            raise ValueError('Выберите сортировку из списка.')
    except ValueError as exc:
        context.update(error=str(exc), deliveries=[])
        return render(request, 'deliveries/delivery_list.html', context, status=400)
    # Имя поля берём только из разрешённых вариантов сортировки.
    order_by = SORTS[context['sort']][0]
    conn = connect_db()
    try:
        deliveries_data = conn.execute(f"""
            SELECT
                d.id,
                d.title,
                d.slug,
                d.goods_type,
                d.delivery_date,
                d.duration,
                d.boxes,
                d.status,
                z.name AS zone_name,
                z.capacity,
                z.zone_type
            FROM deliveries AS d
            LEFT JOIN zones AS z ON d.zone_id = z.id
            WHERE d.boxes >= ?
            ORDER BY {order_by}
            LIMIT ?
        """, (boxes, limit)).fetchall()
    finally:
        conn.close()

    context['deliveries'] = prepare_deliveries(deliveries_data)
    return render(request, 'deliveries/delivery_list.html', context)

@require_http_methods(['GET', 'POST'])
@database_errors
def detail(request, slug):
    rows = fetch('detail', (slug,))
    if not rows:
        raise Http404('Доставка не найдена')
    context = {'delivery': rows[0], 'statuses': STATUSES}
    if request.method == 'POST':
        status = request.POST.get('status', '')
        if status not in STATUSES:
            context['error'] = 'Выберите допустимый статус доставки.'
            return render(request, 'deliveries/delivery_detail.html', context, status=400)
        if not update_status(slug, status):
            raise Http404('Доставка не найдена')
        # После POST перенаправляем на GET: обновление страницы не повторит запись.
        return redirect('deliveries:detail', slug=slug)
    return render(request, 'deliveries/delivery_detail.html', context)

@database_errors
def statistics(request):
    try:
        minimum = number(request, 'minimum', 2, 1)
    except ValueError as exc:
        return render(request, 'deliveries/statistics.html', {'error': str(exc)}, status=400)
    return render(request, 'deliveries/statistics.html', {'statistics': fetch('statistics', (minimum,)), 'minimum': minimum})
