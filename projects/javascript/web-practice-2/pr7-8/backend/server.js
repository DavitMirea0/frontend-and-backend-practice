const express = require('express');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth API',
      version: '1.0.0',
      description: 'API для регистрации и аутентификации пользователей',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Локальный сервер',
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============ БАЗА ДАННЫХ (В ПАМЯТИ) ============
const users = [];

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
const saltRounds = 10;

/**
 * Хеширование пароля с использованием bcrypt
 * @param {string} password - исходный пароль
 * @returns {Promise<string>} - хеш пароля
 */
async function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Проверка пароля
 * @param {string} password - введенный пароль
 * @param {string} hashedPassword - хеш из базы данных
 * @returns {Promise<boolean>} - результат проверки
 */
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Поиск пользователя по email
 * @param {string} email - email пользователя
 * @returns {object|undefined} - найденный пользователь
 */
const findUserByEmail = (email) => users.find(user => user.email === email);


app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    // Валидация обязательных полей
    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({ 
        error: 'Все поля (email, first_name, last_name, password) обязательны для заполнения' 
      });
    }

    // Валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Некорректный формат email' 
      });
    }

    // Валидация длины пароля
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов' 
      });
    }

    // Проверка на существующего пользователя
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Пользователь с таким email уже существует' 
      });
    }

    // Хеширование пароля и создание пользователя
    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      id: nanoid(8),
      email,
      first_name,
      last_name,
      hashedPassword,
      createdAt: new Date().toISOString()
    };

    // Сохраняем пользователя
    users.push(newUser);
    
    // Формируем ответ без хеша пароля
    const { hashedPassword: _, ...userWithoutPassword } = newUser;
    
    console.log(`✅ Новый пользователь зарегистрирован: ${email}`);
    res.status(201).json(userWithoutPassword);
    
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация обязательных полей
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email и пароль обязательны для заполнения' 
      });
    }

    // Поиск пользователя
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь с таким email не найден' 
      });
    }

    // Проверка пароля
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Неверный пароль' 
      });
    }

    // Формируем ответ без хеша пароля
    const { hashedPassword, ...userWithoutPassword } = user;
    
    console.log(`✅ Успешный вход: ${email}`);
    res.json({ 
      message: 'Вход выполнен успешно',
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});


app.get('/api/auth/users', (req, res) => {
  const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);
  res.json(usersWithoutPasswords);
});

// ============ ЗАПУСК СЕРВЕРА ============
app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📚 Swagger документация: http://localhost:${PORT}/api-docs`);
  console.log('\n📌 Доступные маршруты:');
  console.log('   POST   /api/auth/register - Регистрация');
  console.log('   POST   /api/auth/login    - Вход в систему');
  console.log('   GET    /api/auth/users    - Список пользователей (демо)\n');
});