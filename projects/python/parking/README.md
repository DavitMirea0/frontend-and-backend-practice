# Система парковки университета

Учебный проект по дисциплине «Создание программного обеспечения» (РТУ МИРЭА).
Монолитное веб-приложение: Python + FastAPI + SQLite, frontend на HTML/JavaScript.

Что умеет:
- вход по почте и паролю, роли пользователя, охраны и администратора;
- показывает свободные, занятые и забронированные места (сводка и карта мест);
- регистрация автомобилей;
- въезд и выезд (место выбирается автоматически);
- бронирование мест на время и отмена брони;
- **прогноз загрузки по часам и рекомендация, во сколько лучше приехать**.

## Как запустить

Нужен Python 3.10 или новее (проверить: `python --version`).

```bash
# 1. перейти в папку проекта
cd parking

# 2. (по желанию) создать виртуальное окружение
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# 3. установить библиотеки
pip install -r requirements.txt

# 4. заполнить базу тестовыми данными (зоны, места, машины, история за 8 недель)
python seed.py

# 5. запустить сервер
python -m uvicorn app.main:app --reload
```

Открыть в браузере:
- http://127.0.0.1:8000/ - сама страница парковки;
- http://127.0.0.1:8000/docs - автоматическая документация API (Swagger), там можно пробовать запросы.

Остановить сервер: `Ctrl + C`.
Если на Windows команда `python` не находится, попробуйте `py` вместо `python`.

## Учётные записи

Новый посетитель регистрируется в форме на странице с паролем от 10 символов.
После входа можно добавлять свои автомобили и оформлять свои брони.
Демонстрационные пользователи из seed не имеют паролей по умолчанию.
Создать служебную учётную запись или назначить пароль существующей:

```bash
python manage.py account admin@example.org --role admin
python manage.py account guard@example.org --role operator
```

Пароль вводится интерактивно. В Docker добавить `docker compose exec parking`
перед `python`. Охрана оформляет въезд/выезд; администратор дополнительно
создаёт зоны и имеет доступ к справочнику пользователей. Пользователь видит
свои автомобили, брони и стоянки. В Swagger после входа скопируйте `access_token`
в кнопку Authorize (HTTP Bearer). Выход отзывает токен.

Прогноз кэшируется на 30 секунд; данные на карте обновляются без этого кэша.
Проверка HTTP-нагрузки: `python tools/load_test.py --requests 200 --workers 10`.

## Запуск через Docker Compose

Нужен Docker с плагином Compose (например, Docker Desktop в режиме Linux-контейнеров).
В папке проекта выполните:

```bash
docker compose up --build -d
```

Приложение: http://127.0.0.1:8000/, документация API: http://127.0.0.1:8000/docs.
При первом запуске база автоматически заполняется тестовыми данными.
SQLite хранится в отдельном томе `parking_data`: данные сохраняются после
пересборки образа и `docker compose down`. Локальный файл `parking.db` не используется.

```bash
docker compose logs -f parking   # посмотреть логи (выход: Ctrl + C)
docker compose down             # остановить и удалить контейнер
```

Чтобы удалить текущие данные Docker и заново заполнить базу тестовыми данными:

```bash
docker compose down
docker compose run --rm parking python seed.py --reset
docker compose up -d
```

Команда `docker compose down -v` также удаляет том с базой данных.

## Как запустить тесты

```bash
python -m pytest -v
```

Тесты используют отдельную временную базу, основная `parking.db` не портится.

## Как сбросить данные

```bash
python seed.py --reset
```

## Структура

```
parking/
├── app/
│   ├── main.py        - маршруты REST API
│   ├── services.py    - бизнес-логика (въезд, брони, прогноз)
│   ├── models.py      - таблицы базы данных
│   ├── schemas.py     - проверка входных и выходных данных
│   ├── database.py    - подключение к БД
│   └── static/index.html - страница (frontend)
├── tests/             - автотесты (pytest)
├── seed.py            - тестовые данные
└── requirements.txt
```

## Переход на PostgreSQL

Инструкция по серверному окружению, HTTPS, мониторингу и восстановлению: [DEPLOYMENT.md](DEPLOYMENT.md).

В `app/database.py` адрес базы берётся из переменной окружения `DATABASE_URL`:

```bash
pip install psycopg2-binary
set DATABASE_URL=postgresql://user:password@localhost/parking   # Windows
export DATABASE_URL=postgresql://user:password@localhost/parking  # macOS / Linux
```
