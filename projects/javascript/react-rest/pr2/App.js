const express = require('express');
const app = express();
const port = 3000;

let products = [
  { id: 1, name: 'IPhone 17 Pro Max', price: 103000 },
  { id: 2, name: 'IPad Pro 11(2025)', price: 60000 },
  { id: 3, name: "Magic Mouse", price: 5000 },
];

// Middleware для парсинга JSON
app.use(express.json());

// Главная страница
app.get('/', (req, res) => {
  res.send('API управления товарами');
});

// CRUD для товаров

// Получить все товары
app.get('/products', (req, res) => {
  res.json(products);
});

// Получить товар по id
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  res.json(product);
});

// Создать новый товар
app.post('/products', (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Укажите название и стоимость товара' });
  }
  const newProduct = {
    id: Date.now(),
    name,
    price
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Редактировать товар по id
app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  const { name, price } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;
  res.json(product);
});

// Удалить товар по id
app.delete('/products/:id', (req, res) => {
  const exists = products.some(p => p.id == req.params.id);
  if (!exists) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  products = products.filter(p => p.id != req.params.id);
  res.json({ message: 'Товар удалён' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});