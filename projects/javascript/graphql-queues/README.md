# Практические работы 25–27 — Сборка, GraphQL и брокеры сообщений
Хачатрян Давид ЭФБО-18-24
Серия практических работ по современным инструментам сборки фронтенда, GraphQL API и асинхронной обработке сообщений через RabbitMQ.

## Структура проекта
KR5_2SEM/
├── backend/                         # Бэкенд (GraphQL + RabbitMQ)
│   ├── data/
│   │   └── db.js                    # In-memory БД (книги, авторы, задачи)
│   ├── graphql/
│   │   ├── resolvers.js             # Резолверы GraphQL
│   │   └── schema.js                # Схема GraphQL (типы, query, mutation)
│   ├── rabbitmq/
│   │   ├── consumer.js              # Воркер с retry logic и DLQ
│   │   ├── producer.js              # Отправка задач в очередь
│   │   └── setup.js                 # Настройка очередей и DLX
│   ├── Dockerfile                   # Docker-образ бэкенда
│   ├── package.json                 # Зависимости бэкенда
│   └── server.js                    # Apollo Server + Express
│
├── frontend/                        # Фронтенд (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── BooksPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── App.jsx                  # Корневой компонент с lazy loading
│   │   ├── index.css                # Глобальные стили
│   │   └── main.jsx                 # Входная точка React
│   ├── Dockerfile                   # Docker-образ фронтенда
│   ├── index.html                   # HTML-шаблон
│   ├── package.json                 # Зависимости фронтенда
│   └── vite.config.js               # Конфигурация Vite
│
├── .env                             # Переменные окружения
├── .gitignore                       # Игнорируемые файлы
├── docker-compose.yaml              # Полный стек (RabbitMQ + Backend + Workers + Frontend)
└── README.md                        # Документация

## Запуск
## Быстрый запуск (Docker Compose) — рекомендованный способ
cd KR5_2SEM
docker compose up --build

### Доступно:

Сервис	Порт	Адрес
Frontend (React + Vite)	3000	http://localhost:3000
Backend (GraphQL API)	4000	http://localhost:4000/graphql
RabbitMQ Management	15672	http://localhost:15672 (guest/guest)
Worker 1	-	Автоматический запуск
Worker 2	-	Автоматический запуск
Worker 3	-	Автоматический запуск

## Что реализовано
### Пр25 — Vite и оптимизация бандла
Создание React-приложения на Vite вместо Create React App
Настройка vite.config.js с плагином rollup-plugin-visualizer
React Router с двумя маршрутами: "/" (HomePage) и "/heavy" (HeavyPage)
Lazy loading компонента HeavyPage через React.lazy() и Suspense
Code splitting: компонент выносится в отдельный чанк HeavyPage.[hash].js
Production-сборка с генерацией отчёта bundle-report.html
Tree-shaking автоматически удаляет неиспользуемый код
### Пр26 — GraphQL API с Apollo Server
Apollo Server v5 с standalone режимом
Схема GraphQL с типами:
Author: id, name, books (связь один-ко-многим)
Book: id, title, authorId, author (обратная связь)
Query тип:
books: [Book!]! — все книги
book(id: ID!): Book — книга по ID
authors: [Author!]! — все авторы
Mutation тип:
createAuthor(name: String!): Author!
createBook(title: String!, authorId: ID!): Book!
Вложенные резолверы:
Author.books — фильтрация книг по authorId
Book.author — поиск автора по id
In-memory хранилище (массивы authors и books)
Apollo Sandbox для интерактивного тестирования запросов
### Пр27 — RabbitMQ Message Queue
Producer (Express API):
POST /tasks эндпоинт для приёма задач
Интеграция с RabbitMQ через amqplib
Persistent сообщения ({ persistent: true })
Настройка Dead Letter Exchange (DLX) и Dead Letter Queue (DLQ)
Consumer (Worker):
Pattern Worker с channel.prefetch(1) — обработка по одному сообщению
Retry Logic с экспоненциальной задержкой:
Максимум 3 попытки (MAX_RETRIES = 3)
Экспоненциальный backoff: delay = baseDelay * 2^(attempt-1)
Jitter (случайная добавка) для предотвращения thundering herd
Максимальная задержка 5-10 секунд
Dead Letter Queue:
Основная очередь task_queue с аргументами DLX
При исчерпании попыток сообщение автоматически попадает в dead_letter_queue
Счётчик попыток хранится в заголовках x-retry-count
Уникальный WORKER_ID из переменной окружения
Параллельный запуск нескольких воркеров для балансировки нагрузки
Docker Compose:
Сервис rabbitmq с health check
Сервис producer (порт 3000)
Сервисы worker-1 и worker-2 с разными WORKER_ID
Единая сеть app-network
Переменные окружения RABBITMQ_URL=amqp://guest:guest@rabbitmq
Технологии
Frontend: React 19, Vite 8, React Router DOM 7, Rollup
Backend: Node.js, Express, Apollo Server 5, GraphQL 16
Message Queue: RabbitMQ 3, amqplib
DevOps: Docker, Docker Compose, ESLint
Optimization: rollup-plugin-visualizer, code splitting, tree-shaking, lazy loading


# Результат работы
После запуска через docker compose up --build:

Frontend открывается на http://localhost:3000

Вкладка "Books" — CRUD операции с книгами и авторами

Вкладка "Tasks" — создание email/notification задач

GraphQL Playground на http://localhost:4000/graphql

Тестирование всех query и mutation

RabbitMQ Management на http://localhost:15672 (guest/guest)

Мониторинг очередей: main_queue и dead_letter_queue

3 воркера обрабатывают задачи параллельно

При ошибке — retry с экспоненциальной задержкой

После 3 неудач — сообщение в DLQ