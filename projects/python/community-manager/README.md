# Система управления сообществом (Telegram)
Проект: Telegram-бот + admin API для управления сообществами. Сущности:
**сообщество, пользователь, публикация, событие**.

## Стек

- **Бот:** aiogram 3 (async), FSM-хранилище состояний в Redis
- **API:** FastAPI + JWT-аутентификация (для админки/интеграций)
- **БД:** PostgreSQL 16, SQLAlchemy 2.0 (async), Alembic-миграции
- **Инфраструктура:** Docker Compose

## Функциональность

### Сообщество
- Создание сообщества (создатель становится владельцем — `owner`)
- Список всех сообществ / список сообществ пользователя
- Вступление в сообщество (роли: owner / admin / member)

### Пользователь
- Автоматическая регистрация при `/start`
- Хранение telegram_id, username, имени

### Публикация
- Создание текстового поста (с опциональным фото) внутри сообщества
- Просмотр последних публикаций сообщества

### Событие
- Создание события (название, описание, дата, место)
- Список ближайших событий
- RSVP: «пойду / возможно / не пойду»

## Запуск

1. Скопируй `.env.example` в `.env` и заполни `BOT_TOKEN` (получить у @BotFather),
   `JWT_SECRET`, `ADMIN_PASSWORD`.
2. `docker compose up --build`

Сервис `migrate` применяет Alembic-миграции перед стартом бота и API.

- Бот сразу начнёт поллинг Telegram.
- Admin API поднимется на `http://localhost:8000` (Swagger: `/docs`).
  Авторизация: `POST /auth/login` (form-data: username/password из `.env`) → JWT-токен
  в заголовке `Authorization: Bearer <token>` для остальных эндпоинтов.

## Структура проекта

```
bot/            — Telegram-бот (aiogram)
  handlers/     — обработчики команд/колбэков по сущностям
  keyboards/    — inline-клавиатуры
  states/       — FSM-состояния форм
  middlewares/  — прокидывание сессии БД
api/            — admin REST API (FastAPI)
  routers/      — CRUD-эндпоинты по сущностям
db/             — модели SQLAlchemy, репозиторий, конфиг, подключение к БД
alembic/        — миграции
```

## Локальная разработка без Docker

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m bot.main        # бот
uvicorn api.main:app --reload   # API
```

## Возможные доработки

- Публикация постов в связанный Telegram-канал/чат сообщества (`telegram_chat_id`)
- Напоминания о событиях (планировщик, например APScheduler)
- Роли admin внутри сообщества (модерация публикаций)
- Пагинация списков вместо `limit`
