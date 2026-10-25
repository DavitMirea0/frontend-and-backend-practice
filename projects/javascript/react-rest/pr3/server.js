const express = require('express');
const app = express();
const port = 3000;

let users = [
  { id: 1, name: 'Саня', age: 19 },
  { id: 2, name: 'Аня', age: 19 },
  { id: 3, name: 'Давид', age: 20 },
];

app.use(express.json());

// GET все пользователи
app.get('/users', (req, res) => {
  res.json(users);
});

// GET один пользователь по id
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ error: 'Не найден' });
  res.json(user);
});

// POST — добавить пользователя
app.post('/users', (req, res) => {
  const { name, age } = req.body;
  const newUser = { id: Date.now(), name, age };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT — полное обновление
app.put('/users/:id', (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ error: 'Не найден' });
  const { name, age } = req.body;
  if (name !== undefined) user.name = name;
  if (age !== undefined) user.age = age;
  res.json(user);
});

// DELETE — удалить пользователя
app.delete('/users/:id', (req, res) => {
  users = users.filter(u => u.id != req.params.id);
  res.json({ message: 'Удален успешно!!' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});