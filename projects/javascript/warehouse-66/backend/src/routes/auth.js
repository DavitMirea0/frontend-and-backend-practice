import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

// POST /api/auth/register — самостоятельная регистрация (всегда роль 'client')
router.post('/auth/register', async (req, res, next) => {
  try {
    const { username, password, full_name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username и password обязательны' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'username от 3 до 50 символов' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль не короче 6 символов' });
    }

    // Проверка уникальности
    const ex = await query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (ex.rowCount) return res.status(409).json({ error: 'Логин уже занят' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, role, full_name)
       VALUES ($1, $2, 'client', $3)
       RETURNING user_id, username, role, full_name, created_at`,
      [username, hash, full_name || null]
    );
    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username и password обязательны' });

    const { rows } = await query(
      `SELECT user_id, username, password_hash, role, full_name FROM users WHERE username = $1`,
      [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

    await query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [u.user_id]);
    const token = signToken(u);
    res.json({
      user: { user_id: u.user_id, username: u.username, role: u.role, full_name: u.full_name },
      token,
    });
  } catch (e) { next(e); }
});

// GET /api/auth/me — кто я (по токену)
router.get('/auth/me', requireAuth(['admin', 'client', 'guest']), (req, res) => {
  res.json({ user: req.user });
});

// === Admin-only: список пользователей и смена ролей ===
router.get('/users', requireAuth(['admin']), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT user_id, username, role, full_name, created_at, last_login_at
         FROM users ORDER BY user_id`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.patch('/users/:id/role', requireAuth(['admin']), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'client', 'guest'].includes(role)) {
      return res.status(400).json({ error: 'role должно быть admin / client / guest' });
    }
    // Защита от самоудаления последнего админа
    if (req.user.sub === Number(req.params.id) && role !== 'admin') {
      return res.status(400).json({ error: 'Нельзя понизить собственную роль' });
    }
    const { rows } = await query(
      `UPDATE users SET role = $1 WHERE user_id = $2
       RETURNING user_id, username, role, full_name`,
      [role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/users/:id', requireAuth(['admin']), async (req, res, next) => {
  try {
    if (req.user.sub === Number(req.params.id)) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    await query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
