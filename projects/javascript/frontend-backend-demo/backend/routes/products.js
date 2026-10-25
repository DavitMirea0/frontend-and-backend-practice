const express = require("express");
const { nanoid } = require("nanoid");

const router = express.Router();

let products = require("../data/products");

/**
 * Вспомогательная функция: найти товар по id (id строковый)
 */
function findById(id) {
  return products.find((p) => p.id === id) || null;
}

/**
 * TODO (Практика 3): 
 * Добавьте валидацию входных данных: title/category/description/price/stock
 * и правильные статусы 400/404/201.
 */

// GET /api/products — список товаров
router.get("/", (req, res) => {
  res.json(products);
});

// GET /api/products/:id — один товар
router.get("/:id", (req, res) => {
  const product = findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// POST /api/products — добавить товар
router.post("/", (req, res) => {
  const { title, category, description, price, stock, rating, imageUrl } = req.body;

  // TODO (студентам): полноценная валидация, иначе можно сохранить "мусор"
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required (string)" });
  }

  const newProduct = {
    id: nanoid(8),
    title: title.trim(),
    category: typeof category === "string" ? category.trim() : "Без категории",
    description: typeof description === "string" ? description.trim() : "",
    price: Number(price) || 0,
    stock: Number(stock) || 0,
    rating: rating !== undefined ? Number(rating) : undefined,
    imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : "",
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH /api/products/:id — частичное обновление
router.patch("/:id", (req, res) => {
  const product = findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { title, category, description, price, stock, rating, imageUrl } = req.body;

  // TODO (студентам): валидация PATCH (если поле пришло — проверить)
  if (title !== undefined) product.title = String(title).trim();
  if (category !== undefined) product.category = String(category).trim();
  if (description !== undefined) product.description = String(description).trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = Number(rating);
  if (imageUrl !== undefined) product.imageUrl = String(imageUrl).trim();

  res.json(product);
});

// DELETE /api/products/:id — удалить товар
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const before = products.length;
  products = products.filter((p) => p.id !== id);

  if (products.length === before) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Обычно делают 204 No Content, но для наглядности вернём JSON
  res.json({ ok: true });
});

module.exports = router;
