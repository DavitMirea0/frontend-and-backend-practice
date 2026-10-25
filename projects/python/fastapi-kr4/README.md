# Контрольная работа №4 — Технологии разработки серверных приложений
### Студент: Хачатрян Давид Каренович, группа ЭФБО-18-24, ИПТИП, МИРЭА.
**Дисциплина:** Технологии разработки серверных приложений
**Преподаватель:** Дворецкий А. Г.
**Семестр:** 4, 2025/2026 уч. год
**Стек:** Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, pytest, pytest-asyncio, httpx, Faker.

Репозиторий объединяет 5 заданий контрольной в одно приложение с раздельными роутерами:

| Задание | Что реализовано                                                   | URL / файлы                              |
| ------- | ----------------------------------------------------------------- | ---------------------------------------- |
| 9.1     | Alembic + миграция таблицы `products` + миграция добавления поля `description` | `/products`, `alembic/versions/`         |
| 10.1    | Пользовательские исключения `CustomExceptionA` / `CustomExceptionB` + обработчики + Pydantic-модели ошибок | `/errors/*`, `app/exceptions.py`         |
| 10.2    | Pydantic-модель `User` с `conint`/`EmailStr`/`constr` + кастомный обработчик `RequestValidationError` | `/validation/users`, `app/schemas/user.py` |
| 11.1    | Модульные тесты на `pytest` + `TestClient`                        | `tests/test_users_inmemory_sync.py`      |
| 11.2    | Асинхронные тесты через `pytest-asyncio` + `httpx.AsyncClient` + `ASGITransport` + `Faker` | `tests/test_users_inmemory_async.py`     |

---

## 1. Установка зависимостей

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd fastapi_kr4

# 2. Создать виртуальное окружение (рекомендуется)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Установить зависимости
pip install -r requirements.txt

# 4. Скопировать пример .env
cp .env.example .env
```

По умолчанию используется SQLite (`sqlite:///./app.db`). При желании укажите другой `DATABASE_URL` в `.env`.

---

## 2. Запуск приложения

### Шаг 1. Применить миграции Alembic (задание 9.1)

Полный сценарий из задания:

```bash
# Применить ПЕРВУЮ миграцию (создание таблицы products)
alembic upgrade 4b210ba16f4f

# Добавить две записи в таблицу (шаг 5 задания 9.1)
python scripts/seed_two_products.py

# Применить ВТОРУЮ миграцию (добавление поля description)
alembic upgrade head
```

Или одной командой (без промежуточного seed):

```bash
alembic upgrade head
```

Откатить все миграции:

```bash
alembic downgrade base
```

### Шаг 2. Запустить веб-приложение

```bash
uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

---

## 3. Проверка функциональности

### Задание 9.1 — `/products` (БД + миграции)

```bash
# Список товаров
curl http://localhost:8000/products/

# Создать товар (после применения второй миграции description обязателен)
curl -X POST http://localhost:8000/products/ \
     -H "Content-Type: application/json" \
     -d '{"title": "Монитор", "price": 25000, "count": 5, "description": "27 дюймов, 144 Гц"}'

# Получить конкретный товар
curl http://localhost:8000/products/1
```

### Задание 10.1 — `/errors/*` (пользовательские исключения)

```bash
# CustomExceptionA — деление на ноль, status 418
curl "http://localhost:8000/errors/divide?a=10&b=0"

# CustomExceptionB — ресурс не найден, status 404
curl http://localhost:8000/errors/items/999

# Нормальный сценарий
curl "http://localhost:8000/errors/divide?a=10&b=2"
curl http://localhost:8000/errors/items/1
```

### Задание 10.2 — `/validation/users` (валидация Pydantic)

```bash
# Валидный запрос
curl -X POST http://localhost:8000/validation/users \
     -H "Content-Type: application/json" \
     -d '{"username":"kik","age":25,"email":"kik@example.com","password":"secret12","phone":"+79001112233"}'

# Невалидный (age <= 18, плохой email, короткий пароль) — 422 с кастомным форматом
curl -X POST http://localhost:8000/validation/users \
     -H "Content-Type: application/json" \
     -d '{"username":"x","age":15,"email":"bad","password":"123"}'
```

### Задания 11.1 / 11.2 — `/users` (in-memory CRUD)

```bash
curl -X POST http://localhost:8000/users \
     -H "Content-Type: application/json" \
     -d '{"username":"alice","age":30}'

curl http://localhost:8000/users/1
curl -X DELETE http://localhost:8000/users/1
```

---

## 4. Запуск тестов

```bash
# Все тесты (36 шт.)
pytest -v

# Только синхронные тесты (задание 11.1)
pytest tests/test_users_inmemory_sync.py -v

# Только асинхронные тесты (задание 11.2)
pytest tests/test_users_inmemory_async.py -v

# Тесты обработки ошибок (10.1) и валидации (10.2)
pytest tests/test_errors_demo.py tests/test_validation.py -v
```

**Ожидаемый результат:** 36 passed.

### Что покрывают тесты

| Файл                                     | Покрытие                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `tests/test_errors_demo.py`              | Оба пользовательских исключения, корректные статус-коды (418 и 404), формат `ErrorResponse`       |
| `tests/test_validation.py`               | Валидация email/age/password, отсутствующие поля, форма `ValidationErrorResponse`                 |
| `tests/test_users_inmemory_sync.py`      | CRUD `/users` через `TestClient`: 201/200/204/404, повторное удаление, изоляция состояния         |
| `tests/test_users_inmemory_async.py`     | Все сценарии из 11.2: `pytest-asyncio` + `httpx.AsyncClient` + `ASGITransport` + `Faker`, граничные значения |

Изоляция состояния in-memory словаря между тестами гарантируется `autouse`-фикстурой `_reset_inmemory_users` из `tests/conftest.py`.

---

## 5. Структура проекта

```
fastapi_kr4/
├── alembic/                              # Конфигурация и миграции Alembic
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 4b210ba16f4f_create_products_table.py        # Миграция 1 (задание 9.1)
│       └── 541bff4f6a2a_add_description_to_products.py  # Миграция 2 (задание 9.1)
├── alembic.ini
├── app/
│   ├── main.py                           # Точка входа FastAPI, регистрация обработчиков
│   ├── config.py                         # Чтение .env (DATABASE_URL)
│   ├── database.py                       # SQLAlchemy engine + сессии
│   ├── exceptions.py                     # CustomExceptionA / CustomExceptionB (10.1)
│   ├── models/
│   │   └── product.py                    # ORM-модель Product (9.1)
│   ├── schemas/
│   │   ├── product.py
│   │   ├── error.py                      # ErrorResponse / ValidationErrorResponse (10.1, 10.2)
│   │   └── user.py                       # User с Pydantic-валидацией (10.2)
│   └── routers/
│       ├── products.py                   # CRUD /products (9.1)
│       ├── errors_demo.py                # /errors/* (10.1)
│       ├── users_validation.py           # /validation/users (10.2)
│       └── users_inmemory.py             # /users (11.1, 11.2)
├── scripts/
│   └── seed_two_products.py              # Добавляет 2 записи между миграциями (шаг 5 в 9.1)
├── tests/
│   ├── conftest.py                       # Фикстура очистки состояния
│   ├── test_errors_demo.py
│   ├── test_validation.py
│   ├── test_users_inmemory_sync.py       # 11.1
│   └── test_users_inmemory_async.py      # 11.2
├── .env.example
├── .gitignore
├── pytest.ini
├── requirements.txt
└── README.md
```

---

## 6. Примечания по реализации

- **Миграция добавления `description NOT NULL`** написана так, чтобы корректно отрабатывать на непустой таблице: сначала колонка добавляется с `server_default=''`, затем default снимается. Это решает требование шага 7 задания 9.1 при наличии записей, вставленных на шаге 5.
- **Логирование ошибок** в обработчиках исключений сделано через `print(...)`, как разрешает примечание к заданию 10.1; в продакшене следует использовать `logging`.
- **Обработчик `RequestValidationError`** возвращает ответ строго по модели `ValidationErrorResponse` со списком ошибок, имеющих стабильную структуру `{loc, msg, type}`.
- **Изоляция состояния** в тестах in-memory CRUD обеспечивается `autouse`-фикстурой `_reset_inmemory_users`, которая очищает словарь и сбрасывает счётчик id до и после каждого теста.

---


