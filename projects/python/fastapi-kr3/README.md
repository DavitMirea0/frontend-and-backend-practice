# Контрольная работа №3 — FastAPI: Технологии разработки серверных приложений
**Студент:** [Хачатрян Давид Каренович]  
**Группа:** [ЭФБО-18-24]

Полное решение контрольной работы по FastAPI с реализацией аутентификации, авторизации, RBAC и работы с базой данных SQLite.

## Структура проекта

fastapi-kr3/
├── main.py              # Основное приложение FastAPI
├── database.py          # Работа с SQLite (Задания 8.1, 8.2)
├── models.py            # Pydantic модели данных
├── rbac.py              # Role-Based Access Control (Задание 7.1)
├── requirements.txt     # Зависимости проекта
├── .env.example         # Пример переменных окружения
├── app.db               # SQLite база данных (создается автоматически)
└── README.md            # Документация проекта

## Запуск
# Создание виртуального окружения
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows

# Установка зависимостей
pip install -r requirements.txt

# Копирование .env файла
cp .env.example .env

# Запуск приложения
uvicorn main:app --reload

## Задачи
# Задание 6.1–6.2 — Базовая аутентификация
Модели UserBase, User, UserInDB с наследованием Pydantic
Хеширование паролей с PassLib(bcrypt)
Защита от тайминг-атак через secrets.compare_digest()
GET-эндпоинт /login с HTTP Basic Authentication
Dependency auth_user для проверки учетных данных
Заголовок WWW-Authenticate: Basic для повторного вызова окна браузера
# Задание 6.3 — Управление документацией (DEV/PROD)
Переменная окружения MODE (DEV/PROD)
В DEV-режиме: /docs и /openapi.json защищены базовой аутентификацией, /redoc скрыт
В PROD-режиме: все маршруты документации возвращают 404 Not Found
Эндпоинты документации исключены из OpenAPI схемы (include_in_schema=False)
Безопасная проверка credentials через secrets.compare_digest()
# Задание 6.4 — JWT аутентификация
POST-эндпоинт /login для получения JWT токена
Использование PyJWT для генерации и валидации токенов
Защищенный эндпоинт /protected_resource с проверкой JWT
Dependency get_current_jwt_user для извлечения пользователя из токена
Payload содержит {"sub": username} с установленным сроком действия
# Задание 6.5 — Rate Limiting и улучшенная регистрация
POST-эндпоинт /register с хешированием паролей
Интеграция slowapi для ограничения запросов:
/register: 1 запрос в минуту (защита от спама)
/login: 5 запросов в минуту (ограничение попыток входа)
Возврат статуса 429 при превышении лимита
In-memory хранилище пользователей fake_users_db
# Задание 7.1 — Role-Based Access Control (RBAC)
Три роли: admin, user, guest с иерархией привилегий
Разрешения: read, write, update, delete, admin
Factory-функции require_role() и require_permission() для создания зависимостей
Примеры эндпоинтов с разной степенью доступа:
/rbac/public — доступно всем (guest+)
/rbac/user-area — только user и admin
/rbac/admin-panel — только admin
Эндпоинт для тестового назначения ролей /rbac/assign-role/{username}/{role}
# Задание 8.1 — SQLite интеграция (Users)
Создание таблицы users с полями: id, username, password
Контекстный менеджер get_db_connection() для безопасной работы с БД
POST-эндпоинт /db/register для регистрации пользователей в SQLite
Использование IF NOT EXISTS при создании таблицы
Пароли хранятся в открытом виде (согласно требованиям задания)
# Задание 8.2 — CRUD операции (Todo)
Создание таблицы todos с полями: id, title, description, completed
Полный набор CRUD-эндпоинтов:
POST /todos — создание нового элемента
GET /todos — получение всех элементов
GET /todos/{id} — получение элемента по ID
PUT /todos/{id} — обновление элемента
DELETE /todos/{id} — удаление элемента
Pydantic модели TodoCreate, TodoUpdate, Todo для валидации данных
По умолчанию completed: false для новых элементов