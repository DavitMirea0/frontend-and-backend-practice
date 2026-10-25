import sqlite3
from contextlib import closing
from datetime import datetime
from functools import wraps
from django.conf import settings
from django.shortcuts import render

SORTS = {'date': ('d.delivery_date ASC, d.id ASC', 'Сначала ближайшие'), 'date_desc': ('d.delivery_date DESC, d.id DESC', 'Сначала поздние'), 'boxes': ('d.boxes ASC, d.id ASC', 'Посылки: по возрастанию'), 'boxes_desc': ('d.boxes DESC, d.id ASC', 'Посылки: по убыванию'), 'title': ('d.title ASC, d.id ASC', 'По названию')}

def queries():
    text = (settings.BASE_DIR / 'sql' / 'queries.sql').read_text(encoding='utf-8')
    return {block.split('\n', 1)[0].strip(): block.split('\n', 1)[1].strip() for block in text.split('-- name: ')[1:]}

def connect_db():
    """Открыть существующую SQLite-базу и получать строки по именам полей."""
    uri = settings.DELIVERY_DB.resolve().as_uri() + '?mode=rw'
    conn = sqlite3.connect(uri, uri=True, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def prepare_deliveries(rows):
    """Преобразовать строки SQLite и даты для вывода в Django-шаблонах."""
    result = [dict(row) for row in rows]
    for row in result:
        if 'delivery_date' in row:
            row['delivery_date'] = datetime.fromisoformat(row['delivery_date'])
    return result


def fetch(name, params=(), order=None):
    sql = queries()[name]
    if name == 'list':
        sql = sql.format(order=SORTS.get(order, SORTS['date'])[0])
    with closing(connect_db()) as conn:
        rows = conn.execute(sql, params).fetchall()
    return prepare_deliveries(rows)


def database_errors(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        try:
            return view(request, *args, **kwargs)
        except sqlite3.Error:
            return render(request, 'database_error.html', status=503)
    return wrapped

def number(request, key, default, minimum=0, maximum=1000000):
    raw = request.GET.get(key, '')
    if raw == '':
        return default
    try:
        value = int(raw)
        if not minimum <= value <= maximum:
            raise ValueError
        return value
    except ValueError:
        raise ValueError(f'Параметр «{key}»: введите целое число от {minimum} до {maximum}.')


STATUSES = ('принят', 'в пути', 'доставлен')


def update_status(slug, status):
    """Сохранить допустимый статус и вернуть, найдена ли доставка."""
    if status not in STATUSES:
        raise ValueError('Выберите допустимый статус доставки.')
    with closing(connect_db()) as conn, conn:
        cursor = conn.execute(queries()['update_status'], (status, slug))
        return cursor.rowcount > 0
