from contextlib import closing
import shutil
import sqlite3
import uuid
from pathlib import Path
from django.conf import settings
from django.test import SimpleTestCase, override_settings, Client
from .db import fetch

class DeliveryTests(SimpleTestCase):
    def setUp(self):
        self.path = settings.BASE_DIR / 'data' / ('test-' + uuid.uuid4().hex + '.db')
        shutil.copyfile(settings.DELIVERY_DB, self.path)
        self.override = override_settings(DELIVERY_DB=self.path)
        self.override.enable()

    def tearDown(self):
        self.override.disable()
        self.path.unlink(missing_ok=True)

    def test_pages_and_join(self):
        for url in ['/', '/zones/', '/deliveries/', '/deliveries/statistics/', '/deliveries/food-box/']:
            self.assertEqual(self.client.get(url).status_code, 200, url)
        response = self.client.get('/deliveries/food-box/')
        self.assertContains(response, 'Центральный район')
        self.assertContains(response, '21.10.2026 10:00')
        self.assertEqual(self.client.get('/deliveries/missing/').status_code, 404)

    def test_filter_sort_limit(self):
        for boxes in [3, 10, 999]:
            response = self.client.get('/deliveries/', {'boxes': boxes})
            actual = response.context['deliveries']
            with closing(sqlite3.connect(self.path)) as con, con:
                expected = con.execute('SELECT COUNT(*) FROM deliveries WHERE boxes >= ?', (boxes,)).fetchone()[0]
            self.assertEqual(len(actual), expected)
            self.assertTrue(all(row['boxes'] >= boxes for row in actual))
        response = self.client.get('/deliveries/', {'sort': 'boxes_desc', 'limit': 2})
        self.assertEqual([row['boxes'] for row in response.context['deliveries']], [25, 20])
        self.assertContains(self.client.get('/deliveries/?boxes=999'), 'доставки не найдены')

    def test_invalid_parameters(self):
        for query in ['boxes=abc', 'boxes=-1', 'boxes=99999999999999999999999', 'limit=0', 'limit=bad', 'sort=DROP%20TABLE', 'boxes=1%20OR%201=1']:
            self.assertEqual(self.client.get('/deliveries/?' + query).status_code, 400)
        self.assertEqual(self.client.get('/deliveries/statistics/?minimum=no').status_code, 400)

    def test_updates_and_statistics(self):
        before = self.client.get('/').context['total']
        with closing(sqlite3.connect(self.path)) as con, con:
            con.execute("UPDATE zones SET name='Новое имя зоны' WHERE id=1")
            con.execute("INSERT INTO deliveries SELECT 9, 'Новый заказ', 'new-order', goods_type, delivery_date, duration, boxes, status, zone_id FROM deliveries WHERE id=1")
        self.assertContains(self.client.get('/zones/'), 'Новое имя зоны')
        self.assertContains(self.client.get('/deliveries/food-box/'), 'Новое имя зоны')
        self.assertEqual(self.client.get('/').context['total'], before + 1)
        rows = self.client.get('/deliveries/statistics/?minimum=4').context['statistics']
        self.assertEqual([(r['goods_type'], r['total']) for r in rows], [('продукты', 4)])

    def test_database_error_and_empty(self):
        with override_settings(DELIVERY_DB=self.path.with_name('missing-test.db')):
            for url in ['/', '/zones/', '/deliveries/', '/deliveries/statistics/', '/deliveries/food-box/']:
                response = self.client.get(url)
                self.assertEqual(response.status_code, 503)
                self.assertNotContains(response, 'Traceback', status_code=503)
        with closing(sqlite3.connect(self.path)) as con, con:
            con.execute('DELETE FROM deliveries')
            con.execute('DELETE FROM zones')
        self.assertContains(self.client.get('/zones/'), 'Зоны пока не добавлены')
        self.assertEqual(self.client.get('/').context['total'], 0)


    def test_status_update_persists_and_is_visible(self):
        url = '/deliveries/food-box/'
        for status, label in [('в пути', 'Курьер в пути'), ('доставлен', 'Вручено получателю'), ('принят', 'Ожидает курьера')]:
            response = self.client.post(url, {'status': status})
            self.assertRedirects(response, url)
            self.assertEqual(fetch('detail', ('food-box',))[0]['status'], status)
            self.assertContains(self.client.get(url), label)
            self.assertContains(self.client.get('/deliveries/'), label)
        self.assertEqual(fetch('detail', ('office-documents',))[0]['status'], 'в пути')

    def test_invalid_status_does_not_change_database(self):
        url = '/deliveries/food-box/'
        for data in [{}, {'status': ''}, {'status': 'отменён'}, {'status': "доставлен'; DROP TABLE deliveries;--"}]:
            self.assertEqual(self.client.post(url, data).status_code, 400)
            self.assertEqual(fetch('detail', ('food-box',))[0]['status'], 'принят')
        self.assertEqual(self.client.post('/deliveries/missing/', {'status': 'в пути'}).status_code, 404)
        self.assertEqual(self.client.put(url).status_code, 405)
        with override_settings(DELIVERY_DB=self.path.with_name('missing-test.db')):
            self.assertEqual(self.client.post(url, {'status': 'в пути'}).status_code, 503)

    def test_status_requires_csrf_token(self):
        client = Client(enforce_csrf_checks=True)
        url = '/deliveries/food-box/'
        self.assertEqual(client.post(url, {'status': 'в пути'}).status_code, 403)
        client.get(url)
        token = client.cookies['csrftoken'].value
        self.assertEqual(client.post(url, {'status': 'в пути', 'csrfmiddlewaretoken': token}).status_code, 302)
        self.assertEqual(fetch('detail', ('food-box',))[0]['status'], 'в пути')
