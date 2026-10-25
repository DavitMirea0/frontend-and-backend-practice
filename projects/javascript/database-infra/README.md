# Практические работы 19–23 — Базы данных, кэширование и контейнеризация
Хачатрян Давид ЭФБО-18-24

Серия практических работ по работе с реляционными и документоориентированными СУБД, Redis-кэшированием, балансировкой нагрузки и контейнеризацией приложений.

## Структура проекта

```
kr4_2sem/
├── pr19-20/                        # Практики 19–20 — PostgreSQL + MongoDB CRUD API
│   └── src/
│       ├── config/
│       │   ├── postgres.js         # Подключение Sequelize к PostgreSQL
│       │   └── mongo.js            # Подключение Mongoose к MongoDB
│       ├── models/
│       │   ├── PgUser.js           # Sequelize-модель пользователя
│       │   └── MongoUser.js        # Mongoose-модель пользователя
│       ├── controllers/
│       │   ├── pgUsersController.js
│       │   └── mongoUsersController.js
│       ├── routes/
│       │   ├── pgUsers.js
│       │   └── mongoUsers.js
│       ├── index.js
│       └── package.json
├── pr21-22/                        # Практики 21–22 — Redis-кэширование + балансировка
│   └── src/
│       ├── config/
│       │   ├── postgres.js
│       │   ├── mongo.js
│       │   └── redis.js            # Redis-клиент
│       ├── middleware/
│       │   └── cache.js            # cacheMiddleware, saveToCache, invalidateUsersCache
│       ├── models/
│       │   ├── PgUser.js
│       │   └── MongoUser.js
│       ├── controllers/
│       │   ├── pgUsersController.js
│       │   └── mongoUsersController.js
│       ├── routes/
│       │   ├── pgUsers.js
│       │   └── mongoUsers.js
│       ├── index.js
│       └── package.json
│   ├── nginx/
│   │   └── nginx.conf              # Балансировщик Nginx
│   └── haproxy/
│       └── haproxy.cfg             # Альтернативный балансировщик HAProxy
└── pr23/                           # Практика 23 — Docker + Docker Compose
    ├── backend/
    │   ├── server.js               # Express-сервер с SERVER_ID
    │   ├── Dockerfile
    │   ├── package.json
    │   └── .dockerignore
    ├── nginx.conf                  # Nginx внутри Docker-сети
    └── docker-compose.yml          # Стек: nginx + backend1 + backend2 + backend3
```

## Запуск

### Пр19–20 (PostgreSQL + MongoDB)

```bash
cd pr19-20
npm install
npm start
```

PostgreSQL API: http://localhost:3000/api/pg/users  
MongoDB API: http://localhost:3000/api/mongo/users

### Пр21–22 (Redis + балансировка)

```bash
# Запустить Redis
docker run -d --name redis-cache -p 6379:6379 redis

cd pr21-22
npm install

# Один сервер
npm start

# Три инстанса для балансировки (три терминала)
npm run start:3000
npm run start:3001
npm run start:3002
```

Nginx (порт 80): `sudo nginx -c $(pwd)/nginx/nginx.conf`  
HAProxy (порт 8080): `docker run -d --network host -v $(pwd)/haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg haproxy:2.8`

# Процесс установки Docker если он отсуствует
## Обновляем индекс пакетов
sudo apt update
## Устанавливаем необходимые пакеты для работы с репозиториями по HTTPS
sudo apt install -y ca-certificates curl
## Создаем директорию для ключей и добавляем официальный GPG-ключ Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o
/etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
### Добавляем репозиторий Docker в источники APT
echo \
"deb [arch=$(dpkg --print-architecture) signedby=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \ $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
### Снова обновляем индекс пакетов
sudo apt update
### Устанавливаем Docker Engine, Containerd и Docker Compose Plugin
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
docker-compose-plugin
# Пр23 (Docker Compose)
### Запуск
```bash
cd pr23
docker compose up --build
```

Приложение: curl http://localhost/ && echo "" - для Windows Subsystem for Linux(WSL)
## Что реализовано

### Пр19 — PostgreSQL + Sequelize
- Подключение к PostgreSQL через Sequelize ORM
- Модель `User`: id, first_name, last_name, age, created_at, updated_at (unix timestamp)
- Полный CRUD: `POST /api/pg/users`, `GET /api/pg/users`, `GET /api/pg/users/:id`, `PATCH /api/pg/users/:id`, `DELETE /api/pg/users/:id`
- Автоматическое создание таблицы через `sequelize.sync()`

### Пр20 — MongoDB + Mongoose
- Подключение к MongoDB через Mongoose ODM
- Схема `User` с теми же полями, `created_at` и `updated_at` устанавливаются через pre-хуки
- Полный CRUD по тем же маршрутам: `/api/mongo/users`
- Валидация обязательных полей на уровне схемы

### Пр21 — Redis-кэширование
- Redis-клиент (`redis` v4) с подключением через `createClient`
- `cacheMiddleware(keyBuilder, ttl)` — проверяет кэш перед обращением к БД, возвращает `{ source: "cache", data }` или `{ source: "server", data }`
- `saveToCache(key, data, ttl)` — сохраняет ответ в Redis с TTL
- `invalidateUsersCache(prefix, id)` — очищает кэш при write-операциях (POST, PATCH, DELETE)
- Кэш 60 секунд для всех GET-маршрутов пользователей (pg и mongo)

### Пр22 — Балансировка нагрузки
- **Nginx**: алгоритм Round Robin, три инстанса приложения на портах 3000/3001/3002, `max_fails=2 fail_timeout=30s`, порт 3002 — резервный (backup)
- **HAProxy**: аналогичная конфигурация на порту 8080, health check через `GET /health`, алгоритм `roundrobin`
- Эндпоинт `/health` возвращает `{ status, port, pid }` для идентификации инстанса

### Пр23 — Контейнеризация с Docker
- `Dockerfile`: образ `node:18-alpine`, двухэтапное копирование (`package*.json` → `npm install` → исходники) для кэширования слоёв
- `docker-compose.yml`: три backend-контейнера из одного образа, Nginx-балансировщик, единая сеть `app-network`
- Каждый контейнер получает уникальный `SERVER_ID` через переменную окружения
- `nginx.conf`: имена сервисов вместо IP-адресов (`backend1:3000`, `backend2:3000`), `backend3` — резервный, `max_fails=1 fail_timeout=5s`, `proxy_connect_timeout 2s`
- Проверка балансировки: `curl http://localhost/` поочерёдно возвращает ответы от разных контейнеров

## Технологии

Node.js, Express, PostgreSQL, Sequelize, MongoDB, Mongoose, Redis, Nginx, HAProxy, Docker, Docker Compose, WSL
