const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, login: user.login, name: user.name, role_id: user.role_id },
    process.env.JWT_SECRET, { expiresIn: '30m' }
  );
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/register', async (req, res) => {
  try {
    const { name, login, password } = req.body;
    if (!name || !login || !password) return res.status(400).json({ message: 'Заполните все поля' });
    const exists = await pool.query('SELECT id FROM users WHERE login=$1', [login]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, login, password_hash, role_id) VALUES ($1,$2,$3,2) RETURNING id,name,login,role_id',
      [name, login, password_hash]
    );
    res.status(201).json({ user: result.rows[0], ...generateTokens(result.rows[0]) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ message: 'Заполните все поля' });
    const result = await pool.query('SELECT * FROM users WHERE login=$1', [login]);
    if (!result.rows.length) return res.status(400).json({ message: 'Неверный email или пароль' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Неверный email или пароль' });
    res.json({ user: { id: user.id, name: user.name, login: user.login, role_id: user.role_id }, ...generateTokens(user) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Нет refresh токена' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await pool.query('SELECT id,name,login,role_id FROM users WHERE id=$1', [decoded.id]);
    if (!result.rows.length) return res.status(401).json({ message: 'Пользователь не найден' });
    res.json({ user: result.rows[0], ...generateTokens(result.rows[0]) });
  } catch { return res.status(401).json({ message: 'Refresh токен недействителен' }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id,name,login,role_id FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

module.exports = router;
