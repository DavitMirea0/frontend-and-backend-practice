const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'backend-?';

app.use(express.json());

// GET / — идентификатор сервера (для проверки балансировки)
app.get('/', (req, res) => {
  res.json({
    server: SERVER_ID,
    port: PORT,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  });
});

// Health-check для Nginx
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_ID });
});

// API пользователей (из пр19-22)
app.get('/api/users', (req, res) => {
  res.json({
    server: SERVER_ID,
    data: [
      { id: 1, first_name: 'Иван',  last_name: 'Петров',  age: 25 },
      { id: 2, first_name: 'Мария', last_name: 'Сидорова', age: 30 },
    ],
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${SERVER_ID} запущен на порту ${PORT} (PID: ${process.pid})`);
});
