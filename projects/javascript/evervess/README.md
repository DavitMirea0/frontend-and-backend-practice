# Evervess — Docker Compose

> Учебное full-stack банковское приложение: карты, переводы, накопительные счета, оплата услуг и панель администратора.

## Стек технологий

| Слой     | Технологии                                        |
|----------|---------------------------------------------------|
| Frontend | React, React Router, JWT (localStorage)           |
| Backend  | Node.js, Express, bcryptjs, jsonwebtoken, Swagger |
| Database | PostgreSQL 15                                     |
| Infra    | Docker, Docker Compose, nginx                     |

---

## Структура проекта

```
evervess/
├── docker-compose.yml          ← оркестрация сервисов
├── .env                        ← переменные окружения (не коммитить!)
│
├── initdb/
│   └── 00_init.sh              ← запускает init.sql при первом старте БД
│
├── server/                     ← Node.js / Express API
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── entrypoint.sh           ← запускает fix-admin.js, затем index.js
│   ├── index.js
│   ├── fix-admin.js            ← создаёт учётную запись администратора
│   ├── init.sql                ← схема БД
│   └── routes/
│       ├── auth.js
│       ├── cards.js
│       ├── scores.js
│       ├── transactions.js
│       ├── payments.js
│       └── admin.js
│
└── client/                     ← React SPA
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    └── src/
```

---

## Быстрый старт

```bash
# Первый запуск — собрать образы и поднять все сервисы
docker compose up --build

# В фоне
docker compose up --build -d
```

После запуска:

| Сервис     | URL                        |
|------------|----------------------------|
| Фронтенд   | http://localhost:3000      |
| REST API   | http://localhost:5000      |
| Swagger UI | http://localhost:5000/docs |
| PostgreSQL | localhost:5432             |

### Учётная запись администратора

```
Логин:  admin@evervess.com
Пароль: admin123
```

---

## Переменные окружения (.env)

| Переменная             | По умолчанию                   | Описание                       |
|------------------------|--------------------------------|--------------------------------|
| `DB_USER`              | `postgres`                     | Пользователь PostgreSQL        |
| `DB_PASSWORD`          | `postgres`                     | Пароль PostgreSQL              |
| `DB_NAME`              | `bankapp`                      | Имя базы данных                |
| `JWT_SECRET`           | `evervess_secret_key_2026`     | Секрет access-токена (30 мин)  |
| `JWT_REFRESH_SECRET`   | `evervess_refresh_secret_2026` | Секрет refresh-токена (7 дней) |
| `REACT_APP_API_URL`    | `http://localhost:5000`        | Адрес API для сборки фронта    |

> ⚠️ Смени пароли и JWT-секреты перед деплоем!

---

## Полезные команды

```bash
# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f server
docker compose logs -f postgres

# Остановить без удаления данных
docker compose down

# Полный сброс — удалить контейнеры И том с данными БД
docker compose down -v

# Пересобрать один сервис
docker compose up --build server
```

> После любого изменения `init.sql` обязательно выполни `docker compose down -v`
> перед следующим `up --build` — иначе PostgreSQL увидит существующий том
> и пропустит инициализацию.

---

## Как устроена инфраструктура

### Порядок запуска

```
1. postgres    — стартует, healthcheck ждёт готовности
2. 00_init.sh  — фильтрует CREATE DATABASE из init.sql, применяет схему
3. server      — ждёт healthy postgres, запускает fix-admin.js → index.js
4. client      — nginx раздаёт React-билд, проксирует /api/* на server:5000
```

### Почему init.sql не монтируется напрямую в initdb/

PostgreSQL автоматически выполняет `.sql`-файлы из `docker-entrypoint-initdb.d/`.
Проблема: `init.sql` содержит `CREATE DATABASE bankapp`, но Docker уже создал БД
через `POSTGRES_DB=bankapp`. Повторный `CREATE DATABASE` вызывает ошибку и
контейнер падает.

Решение: `00_init.sh` читает `init.sql` из `/tmp/`, убирает строку `CREATE DATABASE`
через `grep` и передаёт чистый SQL в `psql`. Файл `init.sql` не кладётся в `initdb/`
напрямую — только shell-скрипт.

### nginx и маршрутизация

```
Браузер → nginx :3000
              ├── /        → React SPA (index.html, SPA-fallback)
              ├── /api/*   → server:5000
              └── /docs    → server:5000  (Swagger UI)
```

Все запросы идут на один origin (`localhost:3000`) — CORS не нужен.

### Схема базы данных

| Таблица              | Описание                                              |
|----------------------|-------------------------------------------------------|
| `role`               | Роли: Superadmin (1), Client (2), Admin (3)           |
| `users`              | Пользователи, `password_hash`, `is_blocked`           |
| `category`           | Типы карт: Дебетовая (1), Кредитная (2), Виртуальная (3) |
| `card`               | Карты: `owner_id`, `number_card`, `category_id`, `cvc`, `date_finish` |
| `score_type`         | Типы счетов с полем `percent` (0%, 7%, 10.5%)         |
| `score`              | Накопительные счета: `owner_id`, `number_score`       |
| `transaction_status` | Статусы: В обработке (1), Выполнено (2), Отклонено (3)|
| `transaction`        | `id_card_sender`, `id_card_address`, `id_score_sender`, `id_score_adress`, `sum` |
