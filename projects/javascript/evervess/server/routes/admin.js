const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/admin/users — все клиенты с балансом, картами
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.login, u.role_id, u.is_blocked,
              r.name as role_name,
              COALESCE(SUM(c.balance), 0) as total_balance,
              COUNT(DISTINCT c.id) as cards_count,
              COUNT(DISTINCT s.id) as scores_count
       FROM users u
       JOIN role r ON u.role_id = r.id
       LEFT JOIN card c ON c.owner_id = u.id
       LEFT JOIN score s ON s.owner_id = u.id
       GROUP BY u.id, u.name, u.login, u.role_id, u.is_blocked, r.name
       ORDER BY u.id`
    );
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

// GET /api/admin/stats
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [uc, cc, tb, tx, sc] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role_id=2'),
      pool.query('SELECT COUNT(*) FROM card'),
      pool.query('SELECT COALESCE(SUM(balance),0) as total FROM card'),
      pool.query('SELECT COUNT(*) FROM transaction'),
      pool.query('SELECT COUNT(*) FROM score'),
    ]);
    res.json({
      users: parseInt(uc.rows[0].count),
      cards: parseInt(cc.rows[0].count),
      totalBalance: parseFloat(tb.rows[0].total),
      transactions: parseInt(tx.rows[0].count),
      scores: parseInt(sc.rows[0].count),
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

// GET /api/admin/users/:id — детали клиента
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const u = await pool.query(
      `SELECT u.id, u.name, u.login, u.role_id, u.is_blocked, r.name as role_name
       FROM users u JOIN role r ON u.role_id=r.id WHERE u.id=$1`, [req.params.id]);
    if (!u.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });

    const cards = await pool.query(
      `SELECT c.*, cat.name as category_name FROM card c
       JOIN category cat ON c.category_id=cat.id WHERE c.owner_id=$1 ORDER BY c.id`, [req.params.id]);

    const scores = await pool.query(
      `SELECT s.*, st.name as type_name, st.percent FROM score s
       JOIN score_type st ON s.score_type_id=st.id WHERE s.owner_id=$1 ORDER BY s.id`, [req.params.id]);

    const txs = await pool.query(
      `SELECT t.*, ts.name as status_name,
              cs.number_card as sender_card, ca.number_card as address_card
       FROM transaction t
       JOIN transaction_status ts ON t.status_id=ts.id
       LEFT JOIN card cs ON t.id_card_sender=cs.id
       LEFT JOIN card ca ON t.id_card_address=ca.id
       WHERE cs.owner_id=$1 OR ca.owner_id=$1
       ORDER BY t.id DESC LIMIT 20`, [req.params.id]);

    res.json({ user: u.rows[0], cards: cards.rows, scores: scores.rows, transactions: txs.rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

// PUT /api/admin/users/:id — изменить имя/email
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, login } = req.body;
    const r = await pool.query(
      'UPDATE users SET name=$1, login=$2 WHERE id=$3 RETURNING id,name,login,role_id,is_blocked',
      [name, login, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// PUT /api/admin/users/:id/block — заблокировать/разблокировать клиента
router.put('/users/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const u = await pool.query('SELECT is_blocked FROM users WHERE id=$1', [req.params.id]);
    if (!u.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
    const r = await pool.query(
      'UPDATE users SET is_blocked=NOT is_blocked WHERE id=$1 RETURNING id,name,login,role_id,is_blocked',
      [req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role_id } = req.body;
    const r = await pool.query(
      'UPDATE users SET role_id=$1 WHERE id=$2 RETURNING id,name,login,role_id',
      [role_id, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// GET /api/admin/cards — все карты всех клиентов
router.get('/cards', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.*, cat.name as category_name, u.name as owner_name, u.login as owner_login
       FROM card c
       JOIN category cat ON c.category_id=cat.id
       JOIN users u ON c.owner_id=u.id
       ORDER BY c.id DESC`
    );
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

// PUT /api/admin/cards/:id/block — заблокировать карту любого клиента
router.put('/cards/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const r = await pool.query('UPDATE card SET is_blocked=NOT is_blocked WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Карта не найдена' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// GET /api/admin/tariffs — типы счетов (тарифы)
router.get('/tariffs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM score_type ORDER BY id');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// PUT /api/admin/tariffs/:id — изменить тариф
router.put('/tariffs/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, percent } = req.body;
    const r = await pool.query(
      'UPDATE score_type SET name=$1, percent=$2 WHERE id=$3 RETURNING *',
      [name, percent, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Тариф не найден' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// GET /api/admin/transactions — все транзакции
router.get('/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT t.*, ts.name as status_name,
              cs.number_card as sender_card, ca.number_card as address_card,
              us.name as sender_name, ua.name as address_name
       FROM transaction t
       JOIN transaction_status ts ON t.status_id=ts.id
       LEFT JOIN card cs ON t.id_card_sender=cs.id
       LEFT JOIN card ca ON t.id_card_address=ca.id
       LEFT JOIN users us ON cs.owner_id=us.id
       LEFT JOIN users ua ON ca.owner_id=ua.id
       ORDER BY t.id DESC LIMIT 100`
    );
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

module.exports = router;
