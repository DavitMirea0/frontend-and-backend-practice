require('dotenv').config();
const express = require('express');
const sequelize = require('./config/postgres');
const connectMongo = require('./config/mongo');
const { connectRedis } = require('./config/redis');
const pgUsersRouter = require('./routes/pgUsers');
const mongoUsersRouter = require('./routes/mongoUsers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Практика 19 — PostgreSQL
app.use('/api/pg/users', pgUsersRouter);

// Практика 20 — MongoDB
app.use('/api/mongo/users', mongoUsersRouter);

// Health-check (пр22 — балансировщик использует для проверки)
app.get('/health', (_, res) =>
  res.json({ status: 'ok', port: PORT, pid: process.pid })
);

app.use((req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL подключён');

    await connectMongo();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен: http://localhost:${PORT}  (PID: ${process.pid})`);
      console.log(`   PG API:    /api/pg/users`);
      console.log(`   Mongo API: /api/mongo/users`);
    });
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
    process.exit(1);
  }
};

start();
