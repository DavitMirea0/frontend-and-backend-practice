# Исходники проектов

Каталог разделён по основному языку. Полный стек указан у каждого проекта. Это архив исходников, а не единая запускаемая система.

Не включены зависимости, сборки, локальные базы, секреты, установщики, отчёты и повторные поставки тех же проектов. Выводы Jupyter очищены; обнаруженные ключи заменены на `REPLACE_ME`.


## Go

- [Task API](go/taskapi/PORTFOLIO.md) — REST API личного списка задач: регистрация, JWT-аутентификация и CRUD с проверкой владельца. Слои handler, service и repository, graceful shutdown и тесты бизнес-логики.


## Java

- [Student Hub](java/student-hub/PORTFOLIO.md) — Система управления данными студентов с веб-интерфейсом и JavaFX-клиентом. REST backend, аутентификация и миграции базы данных.

- [IT-оборудование — консоль](java/it-equipment-console/PORTFOLIO.md) — Учёт заявок на выдачу оборудования: сотрудники, статусы и бизнес-правила. Сохранение в PostgreSQL через JDBC и экспорт в Excel.

- [IT-оборудование — JavaFX](java/it-equipment-fx/PORTFOLIO.md) — Настольное приложение для заявок и сотрудников: поиск, фильтры, статистика, проверка переходов статусов и экспорт показанных данных в Excel.


## Python

- [Order Processing Service](python/order-processing/PORTFOLIO.md) — Сервис обработки заказов с transactional outbox. Идемпотентность API и consumer, очереди повторных попыток с задержкой и DLQ.

- [Community Manager](python/community-manager/PORTFOLIO.md) — Telegram-бот и admin API для сообществ, публикаций и событий. Роли участников, RSVP, FSM в Redis и миграции Alembic.

- [Парковка университета](python/parking/PORTFOLIO.md) — Веб-приложение с ролями пользователя, охраны и администратора. Регистрация автомобилей, въезд и выезд, бронирование и прогноз загрузки по часам.

- [Служба доставки](python/delivery-service/PORTFOLIO.md) — Учебное приложение для зон и доставок: фильтрация, сортировка, статистика SQL и изменение статуса заказа через POST с CSRF-защитой.

- [API вакансий Selectel](python/selectel-vacancies/PORTFOLIO.md) — Доработка тестового проекта: парсинг публичных вакансий, хранение в PostgreSQL и CRUD API. Периодический запуск парсинга через APScheduler.

- [FastAPI — КР 1](python/fastapi-kr1/PORTFOLIO.md) — Первые HTTP-маршруты FastAPI и шаблон HTML. Учебная работа по разработке серверных приложений.

- [FastAPI — КР 2](python/fastapi-kr2/PORTFOLIO.md) — Модели запросов и валидация пользовательских данных с Pydantic.

- [FastAPI — КР 3](python/fastapi-kr3/PORTFOLIO.md) — Аутентификация, авторизация и RBAC с хранением данных в SQLite.

- [FastAPI — КР 4](python/fastapi-kr4/PORTFOLIO.md) — Миграции Alembic, обработка исключений, валидация и синхронные и асинхронные тесты API.

- [FastAPI — КР 5](python/fastapi-kr5/PORTFOLIO.md) — API задач, фильтрация, интеграционные тесты и упражнения с WebSockets.

- [Алгоритмы и анализ данных](python/algorithms/PORTFOLIO.md) — Учебные ноутбуки Jupyter по алгоритмам и анализу данных. Выводы ячеек и метаданные очищены в опубликованной копии.

- [Счётчик Flask + Redis](python/flask-redis/PORTFOLIO.md) — Учебный сервис-счётчик на Flask с Redis и конфигурацией Docker Compose.


## JavaScript

- [Warehouse-66](javascript/warehouse-66/PORTFOLIO.md) — Складская система: поступления, перемещение между складами, инвентаризация и аналитика поставщиков. JWT и три роли; бизнес-логика на PL/pgSQL.

- [Evervess](javascript/evervess/PORTFOLIO.md) — Учебное банковское приложение: карты, переводы, накопительные счета, оплата услуг и панель администратора.

- [Everessbank — прототип](javascript/everessbank/PORTFOLIO.md) — Ранний учебный прототип банковского веб-приложения: сервер Express, HTML-шаблоны и SQL-схема базы.

- [Roadmap Tracker](javascript/roadmap-tracker/PORTFOLIO.md) — Трекер изучения технологий: статусы тем, общий прогресс, поиск, редактирование дорожной карты, импорт и экспорт данных.

- [Учебное веб-портфолио](javascript/web-portfolio/PORTFOLIO.md) — Многостраничное портфолио с семантической HTML-разметкой и адаптивными стилями.

- [React + REST API](javascript/react-rest/PORTFOLIO.md) — Учебная серия: карточка товара, CRUD на Express, REST API, React-клиент и авторизация.

- [Клиент и сервер — практикум](javascript/web-practice-2/PORTFOLIO.md) — Сборник исходников практик клиент-серверной веб-разработки за второй семестр.

- [SoftShop — заметки PWA](javascript/softshop-notes/PORTFOLIO.md) — Офлайн-приложение заметок: Service Worker, манифест PWA, напоминания, Socket.IO и Web Push.

- [Базы данных и инфраструктура](javascript/database-infra/PORTFOLIO.md) — CRUD с PostgreSQL и MongoDB, кеширование Redis, балансировка нагрузки и контейнеризация.

- [GraphQL и очереди задач](javascript/graphql-queues/PORTFOLIO.md) — React-клиент и GraphQL API для книг и задач; RabbitMQ consumer с повторными попытками и DLQ.

- [Практики веб-разработки](javascript/web-practices/PORTFOLIO.md) — Подборка учебных приложений по frontend и backend: React-клиенты и серверная часть.

- [React + Express — демо](javascript/frontend-backend-demo/PORTFOLIO.md) — Учебный пример с раздельными frontend и backend для практики HTTP API.

- [Формула / Матрица](javascript/physics-quiz/PORTFOLIO.md) — Квиз по физике с анализом ошибок по темам через матрицу принадлежности вопросов. Рекомендации по повторению и демонстрационный сценарий.

- [Лаборатория Монте-Карло](javascript/monte-carlo/PORTFOLIO.md) — Симуляция задачи случайной встречи. Настройка времени ожидания, сравнение эмпирической вероятности с теорией и воспроизводимые опыты с seed.

- [Бильярд: математика движения](javascript/billiard/PORTFOLIO.md) — Интерактивное исследование движения и отражений в прямоугольном бильярде: траектории, период и метод развёртки.

- [Множества Жюлиа](javascript/julia-sets/PORTFOLIO.md) — Визуализация комплексных итераций на Canvas. Изменение параметров, палитры и лимита итераций; исследование орбиты точки.

- [Погодное приложение](javascript/weather-app/PORTFOLIO.md) — React-интерфейс выбора города и отображения погоды с состояниями загрузки, ошибки и демонстрационными данными.


## TypeScript

- [Экспериментальный календарь](typescript/calendar-experiment/PORTFOLIO.md) — Эксперимент с интерфейсом календаря: сетка месяца, список встреч, локальное хранение и панель метрик взаимодействия.


## C#

- [Вечный календарь](csharp/calendar/PORTFOLIO.md) — Настольный календарь с событиями, категориями, недельным представлением, поиском, напоминаниями и статистикой.

- [Library Manager](csharp/library-manager/PORTFOLIO.md) — Управление книгами, авторами и жанрами: CRUD, поиск, фильтрация и связи сущностей.

- [HTTP Monitor](csharp/http-monitor/PORTFOLIO.md) — Встроенные HTTP-сервер и клиент, журнал запросов, фильтрация, статистика и график нагрузки по минутам.

- [Network Analyzer](csharp/network-analyzer/PORTFOLIO.md) — Учебное WPF-приложение для анализа сети. Исходники разделены на модели и сервисы.

- [Путеводитель и производство](csharp/tourist-production/PORTFOLIO.md) — Два учебных приложения: города и достопримечательности; материалы, производственные линии и расчёт времени изготовления.

- [Blazor Shop](csharp/blazor-shop/PORTFOLIO.md) — Управление товарами магазина: API, браузерный клиент на C#, поиск, фильтры и формы с валидацией.

- [Заказы ресторана](csharp/restaurant-orders/PORTFOLIO.md) — Консольная система заказов ресторана: блюда, категории и работа с коллекциями объектов.


## C / C++

- [STM32 — управление светодиодами](cpp/stm32-led/PORTFOLIO.md) — Учебные прошивки STM32 для работы с GPIO и последовательностями светодиодов.

- [STM32 — семисегментный индикатор](cpp/stm32-display/PORTFOLIO.md) — Управление четырёхразрядным индикатором через CMSIS: статическая и динамическая индикация, кнопка и счётчик секунд.

- [Практикум C++](cpp/cpp-practice/PORTFOLIO.md) — Подборка исходников учебных программ на C++ по технологиям индустриального программирования.

- [Qt — учебная заготовка](cpp/qt-project/PORTFOLIO.md) — Заготовка настольного приложения: главное окно Qt, UI-файл и конфигурация CMake. Сохранена как учебный исходник.


## SQL

- [SQL-практикум](sql/sql-practice/PORTFOLIO.md) — SQL-исходники учебной работы по базам данных для индустриальных задач.


## Shell / DevOps

- [DevOps — учебный репозиторий](devops/devops-course/PORTFOLIO.md) — Учебные скрипты, документация и статический сайт для практики инструментов DevOps.
