const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API управления товарами',
            version: '1.0.0',
            description: 'API для интернет-магазина с товарами'
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер разработки',
            },
        ],
        tags: [
            {
                name: 'Товары',
                description: 'Управление товарами в магазине'
            }
        ],
        components: {
            schemas: {
                Unit: {
                    type: 'object',
                    required: ['name', 'category', 'description', 'cost', 'quantity'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Уникальный идентификатор товара',
                            example: 'abc123'
                        },
                        name: {
                            type: 'string',
                            description: 'Название товара',
                            example: 'iPhone 15 Pro'
                        },
                        category: {
                            type: 'string',
                            description: 'Категория товара',
                            example: 'Смартфоны'
                        },
                        description: {
                            type: 'string',
                            description: 'Описание товара',
                            example: 'Флагманский смартфон Apple с титановым корпусом'
                        },
                        cost: {
                            type: 'number',
                            description: 'Цена товара в рублях',
                            example: 99990
                        },
                        quantity: {
                            type: 'integer',
                            description: 'Количество на складе',
                            example: 15
                        }
                    }
                }
            }
        }
    },
    apis: ['./app.js'], // путь к файлу с аннотациями
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/*
npm i express nanoid
npm i -D swagger-jsdoc swagger-ui-express
*/

let units = [
    {
        id: nanoid(6),
        name: 'iPhone 15 Pro',
        category: 'Смартфоны',
        description: 'Флагманский смартфон Apple с титановым корпусом и камерой 48 МП',
        cost: 99990,
        quantity: 15
    },
    {
        id: nanoid(6),
        name: 'Samsung Galaxy S24 Ultra',
        category: 'Смартфоны',
        description: 'Смартфон с поддержкой S Pen и 200 МП камерой',
        cost: 89990,
        quantity: 8
    },
    {
        id: nanoid(6),
        name: 'MacBook Pro 14"',
        category: 'Ноутбуки',
        description: 'Ноутбук с чипом M3 Pro, 18 ГБ памяти и 512 ГБ SSD',
        cost: 199990,
        quantity: 5
    },
    {
        id: nanoid(6),
        name: 'Dyson V15 Detect',
        category: 'Бытовая техника',
        description: 'Беспроводной пылесос с лазерной подсветкой и датчиком пыли',
        cost: 69990,
        quantity: 12
    },
    {
        id: nanoid(6),
        name: 'Xiaomi Mi Robot Vacuum S10',
        category: 'Бытовая техника',
        description: 'Робот-пылесос с лазерной навигацией и влажной уборкой',
        cost: 24990,
        quantity: 25
    },
    {
        id: nanoid(6),
        name: 'Sony WH-1000XM5',
        category: 'Аудиотехника',
        description: 'Беспроводные наушники с активным шумоподавлением',
        cost: 29990,
        quantity: 20
    },
    {
        id: nanoid(6),
        name: 'Apple Watch Series 9',
        category: 'Гаджеты',
        description: 'Умные часы с измерением ЭКГ и кислорода в крови',
        cost: 39990,
        quantity: 18
    },
    {
        id: nanoid(6),
        name: 'iPad Air M1',
        category: 'Планшеты',
        description: '11-дюймовый планшет с чипом M1 и поддержкой Apple Pencil',
        cost: 55990,
        quantity: 10
    },
    {
        id: nanoid(6),
        name: 'Nintendo Switch OLED',
        category: 'Игровые консоли',
        description: 'Портативная игровая консоль с OLED-экраном 7"',
        cost: 32990,
        quantity: 7
    },
    {
        id: nanoid(6),
        name: 'Canon EOS R10',
        category: 'Фототехника',
        description: 'Беззеркальный фотоаппарат с 24.2 МП и 4K видео',
        cost: 84990,
        quantity: 4
    }
];

app.use(express.json());

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

function findUnitOr404(id, res) {
    const unit = units.find(u => u.id == id);

    if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return null;
    }

    return unit;
}

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Получить все товары
 *     description: Возвращает список всех товаров в магазине
 *     tags: [Товары]
 *     responses:
 *       200:
 *         description: Успешный ответ со списком товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 */
app.get("/api/units", (req, res) => {
    res.json(units);
});

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     description: Возвращает товар по его уникальному идентификатору
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID товара
 *         schema:
 *           type: string
 *           example: "abc123"
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unit'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unit not found"
 */
app.get("/api/units/:id", (req, res) => {
    const id = req.params.id;
    const unit = findUnitOr404(id, res);
    if (!unit) return;
    res.json(unit);
});

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Создать новый товар
 *     description: Добавляет новый товар в магазин
 *     tags: [Товары]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - cost
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Новый товар"
 *               category:
 *                 type: string
 *                 example: "Электроника"
 *               description:
 *                 type: string
 *                 example: "Описание нового товара"
 *               cost:
 *                 type: number
 *                 example: 9990
 *               quantity:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unit'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Name is required"
 */
app.post("/api/units", (req, res) => {
    const { name, category, description, cost, quantity } = req.body;

    const newUnit = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        cost: Number(cost),
        quantity: Number(quantity)
    };

    units.push(newUnit);
    res.status(201).json(newUnit);
});

/**
 * @swagger
 * /api/units/{id}:
 *   patch:
 *     summary: Обновить товар
 *     description: Частичное обновление информации о товаре
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID товара
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Обновленное название"
 *               category:
 *                 type: string
 *                 example: "Новая категория"
 *               description:
 *                 type: string
 *                 example: "Обновленное описание"
 *               cost:
 *                 type: number
 *                 example: 12990
 *               quantity:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unit'
 *       400:
 *         description: Нечего обновлять
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Nothing to update"
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unit not found"
 */
app.patch("/api/units/:id", (req, res) => {
    const id = req.params.id;
    const unit = findUnitOr404(id, res);

    if (!unit) return;
    
    if (req.body?.name === undefined && 
        req.body?.category === undefined && 
        req.body?.description === undefined &&
        req.body?.cost === undefined && 
        req.body?.quantity === undefined) {
        return res.status(400).json({error: "Nothing to update"});
    }
    
    const { name, category, description, cost, quantity } = req.body;
    
    if (name !== undefined) unit.name = name.trim();
    if (category !== undefined) unit.category = category.trim();
    if (description !== undefined) unit.description = description.trim();
    if (cost !== undefined) unit.cost = Number(cost);
    if (quantity !== undefined) unit.quantity = Number(quantity);
    
    res.json(unit);
});

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     summary: Удалить товар
 *     description: Удаляет товар по его ID
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID товара для удаления
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unit not found"
 */
app.delete("/api/units/:id", (req, res) => {
    const id = req.params.id;
    const exists = units.some((u) => u.id === id);

    if (!exists) return res.status(404).json({ error: "Unit not found" });

    units.splice(units.findIndex(u => u.id == id), 1);
    res.status(204).send();
});


app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
