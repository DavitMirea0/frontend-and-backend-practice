const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3001;

const ACCESS_SECRET  = 'softshop_access_secret';
const REFRESH_SECRET = 'softshop_refresh_secret';
const ACCESS_EXPIRES_IN  = '15m';
const REFRESH_EXPIRES_IN = '7d';

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) console.log('Body:', req.body);
  });
  next();
});

const refreshTokens = new Set();

// ── Users (role: 'user' | 'seller' | 'admin') ─────────────────────────────
let users = [
  { id: nanoid(6), email: 'ivan@mail.ru',      first_name: 'Иван',          last_name: 'Петров',   role: 'user',   hashedPassword: '$2b$10$N26J0xwiqcUpPz6gvRvPp.rkiPi1COZ5Bt7IcTjKw/1CYxnA4E6jW' },
  { id: nanoid(6), email: 'maria@mail.ru',     first_name: 'Мария',         last_name: 'Сидорова', role: 'seller', hashedPassword: '$2b$10$pOAHYpuU8AqIoXuMsVoI5.xQdm9SENpXgr7sMYI8s5IUhBEAasgmm' },
  { id: nanoid(6), email: 'admin@softshop.ru', first_name: 'Администратор', last_name: 'SoftShop', role: 'admin',  hashedPassword: '$2b$10$9gFw6Gx.6xD1GPQoxqAf/.oBM57mTacdcjTfQTjoTSAC3dMG9o.7W' },
];

// ── Products ──────────────────────────────────────────────────────────────
let products = [
  { id: nanoid(6), title: 'Adobe Photoshop 2025',        category: 'Графика и дизайн', description: 'Профессиональный редактор растровой графики',         price: 3990  },
  { id: nanoid(6), title: 'Microsoft Office 2024',       category: 'Офис',             description: 'Word, Excel, PowerPoint, Outlook. Лицензия на 1 ПК', price: 6990  },
  { id: nanoid(6), title: 'JetBrains All Products Pack', category: 'Разработка',       description: 'Подписка на все IDE JetBrains',                      price: 24990 },
  { id: nanoid(6), title: 'Kaspersky Total Security',    category: 'Безопасность',     description: 'Защита от вирусов и шифровальщиков, 3 устройства',   price: 2490  },
  { id: nanoid(6), title: 'Vegas Pro 21',                category: 'Видеомонтаж',      description: 'Нелинейный видеоредактор с поддержкой 8K и HDR',      price: 14990 },
  { id: nanoid(6), title: 'Notion Business',             category: 'Офис',             description: 'Заметки, задачи, базы данных. Подписка на 1 год',     price: 4990  },
  { id: nanoid(6), title: 'GitHub Copilot',              category: 'Разработка',       description: 'AI-ассистент для программирования',                  price: 1990  },
  { id: nanoid(6), title: 'DaVinci Resolve Studio',      category: 'Видеомонтаж',      description: 'Монтаж, цветокоррекция, VFX и аудиопостпродакшн',     price: 29900 },
  { id: nanoid(6), title: 'Figma Professional',          category: 'Графика и дизайн', description: 'UI/UX-дизайн и прототипирование в реальном времени',  price: 5990  },
  { id: nanoid(6), title: 'Acronis Cyber Protect',       category: 'Безопасность',     description: '1 ТБ облачного хранилища, резервное копирование',     price: 3490  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
function safeUser(u) {
  const { hashedPassword, ...rest } = u;
  return rest;
}

function findProductOr404(id, res) {
  const p = products.find(p => p.id === id);
  if (!p) { res.status(404).json({ error: 'Product not found' }); return null; }
  return p;
}

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti: nanoid(16) },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti: nanoid(16) },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// ── Middlewares ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token)
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role))
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ── Swagger ───────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SoftShop API',
      version: '4.0.0',
      description: 'RBAC: user | seller | admin\n\n**Как получить токен:**\n1. POST `/api/auth/login` — скопируй `accessToken` из ответа\n2. Нажми кнопку **Authorize** вверху страницы\n3. Вставь токен и нажми Authorize',
    },
    servers: [{ url: 'http://localhost:3001' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Вставьте access-токен из /api/auth/login',
        },
      },
    },
  },
  apis: ['./app.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions), {
  swaggerOptions: { persistAuthorization: true },
}));

// ── AUTH ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация (гость)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role: { type: string, enum: [user, seller, admin], default: user }
 *     responses:
 *       201: { description: Пользователь создан }
 *       400: { description: Отсутствуют поля }
 *       409: { description: Email занят }
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;
  if (!email || !password || !first_name || !last_name)
    return res.status(400).json({ error: 'email, password, first_name and last_name are required' });

  const normalizedEmail = email.trim().toLowerCase();
  if (users.find(u => u.email === normalizedEmail))
    return res.status(409).json({ error: 'User with this email already exists' });

  const allowedRoles = ['user', 'seller', 'admin'];
  const assignedRole = allowedRoles.includes(role) ? role : 'user';

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: nanoid(6), email: normalizedEmail, first_name: first_name.trim(), last_name: last_name.trim(), role: assignedRole, hashedPassword };
  users.push(newUser);

  const accessToken  = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);
  refreshTokens.add(refreshToken);

  res.status(201).json({ accessToken, refreshToken, user: safeUser(newUser) });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход (гость)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@softshop.ru
 *               password:
 *                 type: string
 *                 example: admin2025
 *           examples:
 *             admin:
 *               summary: Администратор
 *               value: { "email": "admin@softshop.ru", "password": "admin2025" }
 *             seller:
 *               summary: Продавец
 *               value: { "email": "maria@mail.ru", "password": "securePass" }
 *             user:
 *               summary: Пользователь
 *               value: { "email": "ivan@mail.ru", "password": "password123" }
 *     responses:
 *       200:
 *         description: OK — возвращает accessToken и refreshToken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:  { type: string }
 *                 refreshToken: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:         { type: string }
 *                     email:      { type: string }
 *                     first_name: { type: string }
 *                     last_name:  { type: string }
 *                     role:       { type: string }
 *       401: { description: Неверный пароль }
 *       404: { description: Не найден }
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  const user = users.find(u => u.email === email.trim().toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) return res.status(401).json({ error: 'Invalid password' });

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  res.json({ accessToken, refreshToken, user: safeUser(user) });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить токены (гость)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh-токен полученный при входе
 *
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:  { type: string }
 *                 refreshToken: { type: string }
 *       400: { description: refreshToken отсутствует }
 *       401: { description: Токен недействителен }
 */
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  if (!refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Invalid refresh token' });
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });

    refreshTokens.delete(refreshToken);
    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Текущий пользователь (user+)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// ── USERS (admin only) ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список пользователей (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
app.get('/api/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json(users.map(safeUser));
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Пользователь по id (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { first_name, last_name, role } = req.body;
  if (first_name) user.first_name = first_name.trim();
  if (last_name)  user.last_name  = last_name.trim();
  if (role && ['user', 'seller', 'admin'].includes(role)) user.role = role;
  res.json(safeUser(user));
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.blocked = true;
  res.json({ message: 'User blocked', user: safeUser(user) });
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────

// GET /api/products — user, seller, admin
app.get('/api/products', authMiddleware, roleMiddleware('user', 'seller', 'admin'), (req, res) => {
  res.json(products);
});

// GET /api/products/:id — user, seller, admin
app.get('/api/products/:id', authMiddleware, roleMiddleware('user', 'seller', 'admin'), (req, res) => {
  const p = findProductOr404(req.params.id, res);
  if (!p) return;
  res.json(p);
});

// POST /api/products — seller, admin
app.post('/api/products', authMiddleware, roleMiddleware('seller', 'admin'), (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || !category || !description || price === undefined)
    return res.status(400).json({ error: 'title, category, description and price are required' });
  const newProduct = { id: nanoid(6), title: title.trim(), category: category.trim(), description: description.trim(), price: Number(price) };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id — seller, admin
app.put('/api/products/:id', authMiddleware, roleMiddleware('seller', 'admin'), (req, res) => {
  const p = findProductOr404(req.params.id, res);
  if (!p) return;
  const { title, category, description, price } = req.body;
  if (title !== undefined)       p.title       = title.trim();
  if (category !== undefined)    p.category    = category.trim();
  if (description !== undefined) p.description = description.trim();
  if (price !== undefined)       p.price       = Number(price);
  res.json(p);
});

// DELETE /api/products/:id — admin only
app.delete('/api/products/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  if (!products.some(p => p.id === req.params.id))
    return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
  console.log('Тестовые аккаунты:');
  console.log('  user:   ivan@mail.ru / password123');
  console.log('  seller: maria@mail.ru / securePass');
  console.log('  admin:  admin@softshop.ru / admin2025');
});
