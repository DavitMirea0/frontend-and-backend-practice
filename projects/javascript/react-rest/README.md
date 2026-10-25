# DavitMirea0 
Хачатрян Давид ЭФБО-18-24

Репозитории с проектом за 2 семестр дисциплины «Фронтенд и бэкенд разработка»

## Структура проекта

...
kr1_2sem/
├── pr1/          # Задание 1 — Вёрстка страница карточки
├── pr2/          # Задание 2 — CRUD-интерфейс
├── pr3/          # Задание 3 — Работа с Postman
├── pr4-5/          # Задание 4–5 — REST API + React-клиент + Задание 7-11 - Авторизация и токены
│   ├── backend/     # Express + Node.js  (бэкенд)
│   └── frontend/     # React (фронтенд)
...




## Практическая работа 1 - Картoчка товара
Технологии: React/SASS, БЭМ
Файлы: pr1/src/index.js

## Практическая работа 2 - CRUD-интерфейс на Express

Технологии: HTML, Express, SASS/CSS
Файлы: pr2/index.js

## Практическая работа 3 - Работа с Postman

Технологии: Express
Файлы: pr3/server.js


## Практические работы 4-5 - REST API сервер и React

Express-сервер с CRUD-операциями для сущностей Product и User, хранение данных в памяти.

API эндпоинты
Метод	URL	Описание
GET	/api/products	Список всех продуктов
POST	/api/products	Создать продукт
GET	/api/products/:id	Получить продукт по ID
PATCH	/api/products/:id	Обновить продукт
DELETE	/api/products/:id	Удалить продукт
GET	/api/users	Список всех пользователей
POST	/api/users	Создать пользователя
GET	/api/users/:id	Получить пользователя по ID
PATCH	/api/users/:id	Обновить пользователя
DELETE	/api/users/:id	Удалить пользователя
Swagger-документация
Интерактивная документация доступна по адресу /api-docs (swagger-jsdoc + swagger-ui-express).
Также реализован PWA-приложения(или сайт с ПО) на React

Технологии: Node.js, Express, nanoid, cors, swagger-jsdoc, swagger-ui-express, React

## Практические работы 7-11 - Node.js, JWT-авторизация, Refresh-токены и RBAC

Было это все реализовано на базе практик 4-5, теперь появился node.js, авторизация на основ JSON Web Token, возможность обновить токены через swagger, также были добавлен RBAC(user, seller и админ)
Технологии: Node.js, Express, swagger-ui-express, React
Файлы: Backend(pr4-5/backend/app.js), Frontend(pr4-5/frontend/src/pages/..Там все файлы для разный страниц)


Приложение откроется на http://localhost:.

