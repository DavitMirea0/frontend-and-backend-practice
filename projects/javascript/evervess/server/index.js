require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ===== SWAGGER DOCS =====
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'evervess API',
    version: '1.0.0',
    description: 'REST API банковского приложения evervess. Группа ЭФБО-18-24.',
  },
  servers: [{ url: 'http://localhost:5000/api', description: 'Локальный сервер' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Регистрация, вход, токены' },
    { name: 'Cards', description: 'Управление картами' },
    { name: 'Scores', description: 'Накопительные счета' },
    { name: 'Transactions', description: 'Переводы и пополнения' },
    { name: 'Payments', description: 'Оплата услуг' },
    { name: 'Admin', description: 'Администрирование (role_id=3)' },
  ],
  paths: {
    // AUTH
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Регистрация нового пользователя',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','login','password'],
          properties: { name: { type: 'string', example: 'Иван' }, login: { type: 'string', example: 'ivan@email.com' }, password: { type: 'string', example: 'Test1234!' } } } } } },
        responses: { 201: { description: 'Пользователь создан, возвращает токены' }, 400: { description: 'Email уже занят или поля не заполнены' } }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Вход в систему',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['login','password'],
          properties: { login: { type: 'string', example: 'ivan@email.com' }, password: { type: 'string', example: 'Test1234!' } } } } } },
        responses: { 200: { description: 'Успешный вход, возвращает accessToken и refreshToken' }, 400: { description: 'Неверный email или пароль' } }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Обновление access токена',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
        responses: { 200: { description: 'Новая пара токенов' }, 401: { description: 'Refresh токен недействителен' } }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Текущий пользователь',
        responses: { 200: { description: 'Данные авторизованного пользователя' }, 401: { description: 'Не авторизован' } }
      }
    },
    // CARDS
    '/cards': {
      get: {
        tags: ['Cards'], summary: 'Список карт текущего пользователя',
        responses: { 200: { description: 'Массив карт с category_name' } }
      },
      post: {
        tags: ['Cards'], summary: 'Создать новую карту',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          category_id: { type: 'integer', example: 1, description: '1=Дебетовый, 2=Кредитный, 3=Виртуальный' }
        } } } } },
        responses: { 201: { description: 'Карта создана. Кредитная (id=2) — с балансом и лимитом 100 000 ₽' }, 400: { description: 'Не указан тип карты' } }
      }
    },
    '/cards/categories': {
      get: {
        tags: ['Cards'], summary: 'Типы карт (Дебетовый, Кредитный, Виртуальный)',
        responses: { 200: { description: 'Массив категорий' } }
      }
    },
    '/cards/{id}/block': {
      put: {
        tags: ['Cards'], summary: 'Заблокировать / разблокировать карту (toggle)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Обновлённая карта' }, 404: { description: 'Карта не найдена' } }
      }
    },
    '/cards/{id}/settings': {
      put: {
        tags: ['Cards'], summary: 'Изменить лимиты карты',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          daily_limit: { type: 'number', example: 50000 }, monthly_limit: { type: 'number', example: 500000 }
        } } } } },
        responses: { 200: { description: 'Карта с обновлёнными лимитами' } }
      }
    },
    '/cards/{id}/statement': {
      get: {
        tags: ['Cards'], summary: 'Выписка по карте',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Объект {card, transactions}' } }
      }
    },
    // SCORES
    '/scores': {
      get: {
        tags: ['Scores'], summary: 'Список накопительных счетов пользователя',
        responses: { 200: { description: 'Массив счетов с type_name и percent' } }
      },
      post: {
        tags: ['Scores'], summary: 'Открыть новый счёт',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
          score_type_id: { type: 'integer', example: 2, description: '1=Сберегательный(7%), 2=Депозитный(10.5%), 3=Текущий(0%)' }
        } } } } },
        responses: { 201: { description: 'Счёт создан' } }
      }
    },
    '/scores/types': {
      get: {
        tags: ['Scores'], summary: 'Типы счетов с процентными ставками',
        responses: { 200: { description: 'Массив: Сберегательный 7%, Депозитный 10.5%, Текущий 0%' } }
      }
    },
    // TRANSACTIONS
    '/transactions': {
      get: {
        tags: ['Transactions'], summary: 'История транзакций текущего пользователя',
        responses: { 200: { description: 'Массив транзакций с деталями карт и счетов' } }
      }
    },
    '/transactions/card-transfer': {
      post: {
        tags: ['Transactions'], summary: 'Перевод на карту другого клиента',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['sender_card_id','address_card_number','sum'],
          properties: {
            sender_card_id: { type: 'integer', example: 1 },
            address_card_number: { type: 'string', example: '1234567890123456' },
            sum: { type: 'number', example: 1000 }
          } } } } },
        responses: { 201: { description: 'Транзакция создана' }, 400: { description: 'Недостаточно средств / карта заблокирована / не найдена' } }
      }
    },
    '/transactions/topup-card': {
      post: {
        tags: ['Transactions'], summary: 'Пополнение карты (с другой карты или внешнее)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['target_card_id','sum'],
          properties: {
            target_card_id: { type: 'integer', example: 1 },
            source_card_id: { type: 'integer', example: 2, description: 'Не указывать — внешнее пополнение' },
            sum: { type: 'number', example: 50000 }
          } } } } },
        responses: { 201: { description: 'Пополнение выполнено' } }
      }
    },
    '/transactions/topup-score': {
      post: {
        tags: ['Transactions'], summary: 'Пополнение накопительного счёта с карты',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['score_id','card_id','sum'],
          properties: { score_id: { type: 'integer' }, card_id: { type: 'integer' }, sum: { type: 'number', example: 5000 } }
        } } } },
        responses: { 201: { description: 'Счёт пополнен' }, 400: { description: 'Недостаточно средств' } }
      }
    },
    '/transactions/withdraw-score': {
      post: {
        tags: ['Transactions'], summary: 'Снятие со счёта на карту',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['score_id','card_id','sum'],
          properties: { score_id: { type: 'integer' }, card_id: { type: 'integer' }, sum: { type: 'number', example: 3000 } }
        } } } },
        responses: { 201: { description: 'Средства выведены' }, 400: { description: 'Недостаточно средств на счёте' } }
      }
    },
    '/transactions/pay-credit': {
      post: {
        tags: ['Transactions'], summary: 'Погашение задолженности по кредитной карте',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['credit_card_id','debit_card_id','sum'],
          properties: { credit_card_id: { type: 'integer' }, debit_card_id: { type: 'integer' }, sum: { type: 'number', example: 10000 } }
        } } } },
        responses: { 201: { description: 'Задолженность погашена' }, 400: { description: 'Задолженность уже погашена / недостаточно средств' } }
      }
    },
    // PAYMENTS
    '/payments/pay': {
      post: {
        tags: ['Payments'], summary: 'Оплата услуги (ЖКХ, связь, интернет и др.)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['card_id','sum'],
          properties: {
            card_id: { type: 'integer', example: 1 },
            sum: { type: 'number', example: 3200 },
            description: { type: 'string', example: 'ЖКХ: 12345678' }
          } } } } },
        responses: { 201: { description: 'Платёж выполнен' }, 400: { description: 'Недостаточно средств / карта заблокирована' } }
      }
    },
    // ADMIN
    '/admin/users': {
      get: {
        tags: ['Admin'], summary: 'Все клиенты с балансом и количеством карт',
        responses: { 200: { description: 'Массив пользователей' }, 403: { description: 'Доступ запрещён' } }
      }
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'], summary: 'Статистика: клиенты, карты, баланс, транзакции',
        responses: { 200: { description: 'Объект {users, cards, totalBalance, transactions, scores}' } }
      }
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin'], summary: 'Детали клиента (карты, счета, транзакции)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Объект {user, cards, scores, transactions}' } }
      },
      put: {
        tags: ['Admin'], summary: 'Изменить имя и email клиента',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, login: { type: 'string' } } } } } },
        responses: { 200: { description: 'Обновлённый пользователь' } }
      },
      delete: {
        tags: ['Admin'], summary: 'Удалить клиента',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Пользователь удалён' } }
      }
    },
    '/admin/users/{id}/block': {
      put: {
        tags: ['Admin'], summary: 'Заблокировать / разблокировать клиента (toggle)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Обновлённый пользователь с is_blocked' } }
      }
    },
    '/admin/users/{id}/role': {
      put: {
        tags: ['Admin'], summary: 'Изменить роль клиента',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { role_id: { type: 'integer', example: 3 } } } } } },
        responses: { 200: { description: 'Роль обновлена' } }
      }
    },
    '/admin/cards': {
      get: {
        tags: ['Admin'], summary: 'Все карты всех клиентов с именем владельца',
        responses: { 200: { description: 'Массив карт с owner_name и owner_login' } }
      }
    },
    '/admin/cards/{id}/block': {
      put: {
        tags: ['Admin'], summary: 'Заблокировать / разблокировать любую карту',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Обновлённая карта' } }
      }
    },
    '/admin/tariffs': {
      get: {
        tags: ['Admin'], summary: 'Список тарифов накопительных счетов',
        responses: { 200: { description: 'Массив score_type' } }
      }
    },
    '/admin/tariffs/{id}': {
      put: {
        tags: ['Admin'], summary: 'Изменить название и ставку тарифа',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, percent: { type: 'number', example: 8.5 } } } } } },
        responses: { 200: { description: 'Обновлённый тариф' } }
      }
    },
    '/admin/transactions': {
      get: {
        tags: ['Admin'], summary: 'Все транзакции системы (последние 100)',
        responses: { 200: { description: 'Массив транзакций с именами отправителя и получателя' } }
      }
    },
  }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'evervess API Docs',
  customCss: '.swagger-ui .topbar { background: #1a1a2e; } .swagger-ui .topbar-wrapper img { display: none; } .swagger-ui .topbar-wrapper::before { content: "evervess API"; color: #33aa88; font-size: 20px; font-weight: bold; }',
}));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Документация API: http://localhost:${PORT}/docs`);
});
