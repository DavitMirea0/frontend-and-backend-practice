const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

let products = [
  {
    id: nanoid(6), name: 'Adobe Photoshop 2025', category: 'Графика и дизайн',
    description: 'Профессиональный редактор растровой графики. Ретушь, монтаж, создание иллюстраций и веб-графики.',
    price: 3990, stock: 999, rating: 4.8,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Photoshop'
  },
  {
    id: nanoid(6), name: 'Microsoft Office 2024', category: 'Офис и продуктивность',
    description: 'Пакет офисных приложений: Word, Excel, PowerPoint, Outlook. Лицензия на 1 ПК.',
    price: 6990, stock: 500, rating: 4.6,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=MS+Office'
  },
  {
    id: nanoid(6), name: 'JetBrains All Products Pack', category: 'Разработка',
    description: 'Подписка на все IDE JetBrains: IntelliJ IDEA, WebStorm, PyCharm, GoLand и другие.',
    price: 24990, stock: 200, rating: 4.9,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=JetBrains'
  },
  {
    id: nanoid(6), name: 'Kaspersky Total Security', category: 'Безопасность',
    description: 'Комплексная защита от вирусов, шифровальщиков, фишинга. 3 устройства, 1 год.',
    price: 2490, stock: 300, rating: 4.5,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Kaspersky'
  },
  {
    id: nanoid(6), name: 'Vegas Pro 21', category: 'Видеомонтаж',
    description: 'Профессиональный нелинейный видеоредактор с поддержкой 8K, HDR и GPU-ускорением.',
    price: 14990, stock: 80, rating: 4.4,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Vegas+Pro'
  },
  {
    id: nanoid(6), name: 'Notion Business', category: 'Офис и продуктивность',
    description: 'Единое рабочее пространство: заметки, задачи, базы данных, вики. Подписка на 1 год.',
    price: 4990, stock: 999, rating: 4.7,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Notion'
  },
  {
    id: nanoid(6), name: 'Blender Studio', category: 'Графика и дизайн',
    description: '3D-редактор и пакет для анимации. Подписка на облачные активы Blender Studio.',
    price: 990, stock: 999, rating: 4.8,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Blender'
  },
  {
    id: nanoid(6), name: 'GitHub Copilot', category: 'Разработка',
    description: 'AI-ассистент для программирования. Автодополнение кода, генерация тестов, code review.',
    price: 1990, stock: 999, rating: 4.7,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Copilot'
  },
  {
    id: nanoid(6), name: 'Acronis Cyber Protect', category: 'Безопасность',
    description: 'Резервное копирование и киберзащита. 1 ТБ облачного хранилища, 5 устройств.',
    price: 3490, stock: 150, rating: 4.3,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Acronis'
  },
  {
    id: nanoid(6), name: 'DaVinci Resolve Studio', category: 'Видеомонтаж',
    description: 'Профессиональный монтаж, цветокоррекция, VFX и аудиопостпродакшн в одном пакете.',
    price: 29900, stock: 60, rating: 4.9,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=DaVinci'
  },
  {
    id: nanoid(6), name: 'Figma Professional', category: 'Графика и дизайн',
    description: 'Инструмент для UI/UX-дизайна и прототипирования. Совместная работа в реальном времени.',
    price: 5990, stock: 999, rating: 4.8,
    image: 'https://placehold.co/300x180/0f172a/6366f1?text=Figma'
  },
];

// ── Swagger config ───────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина ПО',
      version: '1.0.0',
      description: 'REST API для управления каталогом программного обеспечения',
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

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Swagger schemas ──────────────────────────────────────────────────────────
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *         name:
 *           type: string
 *           description: Название программного продукта
 *         category:
 *           type: string
 *           description: Категория продукта
 *           enum: [Разработка, Графика и дизайн, Видеомонтаж, Офис и продуктивность, Безопасность, Образование, Другое]
 *         description:
 *           type: string
 *           description: Описание продукта
 *         price:
 *           type: number
 *           description: Цена в рублях за год
 *         stock:
 *           type: integer
 *           description: Количество доступных лицензий
 *         rating:
 *           type: number
 *           nullable: true
 *           minimum: 0
 *           maximum: 5
 *           description: Рейтинг продукта от 0 до 5
 *         image:
 *           type: string
 *           nullable: true
 *           description: URL изображения продукта
 *       example:
 *         id: "abc123"
 *         name: "Adobe Photoshop 2025"
 *         category: "Графика и дизайн"
 *         description: "Профессиональный редактор растровой графики"
 *         price: 3990
 *         stock: 999
 *         rating: 4.8
 *         image: "https://example.com/photoshop.png"
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         rating:
 *           type: number
 *           nullable: true
 *         image:
 *           type: string
 *           nullable: true
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 */

// ── Helper ───────────────────────────────────────────────────────────────────
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех продуктов
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех программных продуктов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает продукт по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID продукта
 *     responses:
 *       200:
 *         description: Данные продукта
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создаёт новый программный продукт
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Продукт успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Отсутствуют обязательные поля
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;
  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    rating: rating != null ? Number(rating) : null,
    image: image || null,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные продукта
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID продукта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Обновлённый продукт
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const fields = ['name', 'category', 'description', 'price', 'stock', 'rating', 'image'];
  if (!fields.some(f => req.body[f] !== undefined)) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { name, category, description, price, stock, rating, image } = req.body;
  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = Number(rating);
  if (image !== undefined) product.image = image;

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет продукт
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID продукта
 *     responses:
 *       204:
 *         description: Продукт успешно удалён (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});