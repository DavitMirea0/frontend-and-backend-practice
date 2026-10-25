const express = require('express');
const { nanoid } = require("nanoid");

const cors = require("cors");

const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerUi = require('swagger-ui-express');
const app = express();
const jwt = require("jsonwebtoken");

const JWT_SECRET = "access_secret";
const ACCESS_EXPIRES_IN = "15m";

const port = 3000;
const swaggerOptions = {
definition: {
openapi: '3.0.0',
info: {
title: 'API AUTH',
version: '1.0.0',
description: 'Простое API для изучения авторизации',
},
servers: [
{
url: `http://localhost:${port}`,
description: 'Локальный сервер',
},
],
},
apis: ['./app.js'],
};

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

let users = [];

function findUserOr404(email, res) {
    const user = users.find(u => u.email == email);
    if (!user) {
        res.status(404).json({ error: "user not found" });
        return null;
    }
    return user;
}

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}

app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;

    const user = users.find(u => u.id === userId);

    if (!user) 
        return res.status(404).json({
            error: "User not found",
        });
    
    res.json({
        id: user.id,
        username: user.username,
    });
});

app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !password || !first_name || !last_name) 
        return res.status(400).json({ error: "all params are required" });
    

    const newUser = {
        id: nanoid(),
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: await hashPassword(password)
    };

    users.push(newUser);
    res.status(201).json({
        email: email
    });
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "email and password are required" });
    

    const user = findUserOr404(email, res);
    if (!user) return;

    isAuthentethicated = await verifyPassword(password, user.password);

    if (isAuthentethicated){
        const accessToken = jwt.sign(
            {
            sub: user.id,
            username: user.username,
            },
            JWT_SECRET,
            {
            expiresIn: ACCESS_EXPIRES_IN,
            }
        );

        res.status(200).json({
            accessToken,
        });
    }
    else
        res.status(401).json({ error: "not authentethicated" })
});

products = []

app.post("/products", (req, res) => {
    const { title, category, description, price } = req.body;

    const item = {
        id: nanoid(),
        title: title,
        category: category,
        description: description,
        price: price
    }

    products.push(item);

    res.status(201).json(item);
});

app.get("/products/:id", authMiddleware, (req, res) => {
    res.send(products.filter(item => item.id == req.params.id));
});

app.get("/products", (req, res) => {
    res.send(JSON.stringify(products));
});

app.delete("/products/:id", authMiddleware, (req, res) => {
    products.splice(products.findIndex(item => item.id == req.params.id), 1);
});

app.put("/products/:id", authMiddleware, (req, res) => {
    const item = products.find(item => item.id == req.params.id);

    if(!item){
        res.status(404).json({message: "Такого товара нет."});
        return;
    }

    const { title, category, description, price } = req.body;

    if (!title || !category || !description || !price) 
        return res.status(400).json({ error: "all params are required" });


    item.title = title;
    item.category = category;
    item.description = description;
    item.price = price;

    res.json(item);
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID пользователя
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *         first_name:
 *           type: string
 *           description: Имя
 *         last_name:
 *           type: string
 *           description: Фамилия
 *         password:
 *           type: string
 *           description: Хэш пароля
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID пользователя
 *         username:
 *           type: string
 *           description: Имя пользователя (email)
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *         title:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: secret123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT токен для доступа к защищённым ресурсам
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email зарегистрированного пользователя
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 *     Message:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Информационное сообщение
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   security:
 *     - BearerAuth: []
 * 
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Аутентификация и регистрация
 *   - name: Products
 *     description: Управление товарами
 *   - name: Profile
 *     description: Профиль пользователя
 * 
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Отсутствуют обязательные параметры
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Отсутствуют email или password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Неверный пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Отсутствует или недействителен токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @swagger
 * /products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: Ноутбук
 *               category:
 *                 type: string
 *                 example: Электроника
 *               description:
 *                 type: string
 *                 example: Мощный игровой ноутбук
 *               price:
 *                 type: number
 *                 example: 999.99
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Отсутствуют обязательные параметры
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 * 
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар удален
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   put:
 *     summary: Обновить товар по ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: Новый ноутбук
 *               category:
 *                 type: string
 *                 example: Электроника
 *               description:
 *                 type: string
 *                 example: Обновленное описание
 *               price:
 *                 type: number
 *                 example: 1099.99
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Отсутствуют обязательные параметры
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */