const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const withCat = async (card) => {
  const cat = await pool.query('SELECT name FROM category WHERE id=$1', [card.category_id]);
  card.category_name = cat.rows[0]?.name; return card;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.*, cat.name as category_name FROM card c JOIN category cat ON c.category_id=cat.id WHERE c.owner_id=$1 ORDER BY c.id`,
      [req.user.id]);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.get('/categories', authMiddleware, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM category ORDER BY id')).rows); }
  catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category_id } = req.body;
    if (!category_id) return res.status(400).json({ message: 'Укажите тип карты' });
    const number_card = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    const cvc = String(Math.floor(Math.random() * 900) + 100);
    const df = new Date(); df.setFullYear(df.getFullYear() + 4);
    const isCredit = parseInt(category_id) === 2;
    const r = await pool.query(
      `INSERT INTO card (number_card,balance,date_finish,cvc,owner_id,category_id,credit_limit) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [number_card, isCredit ? 100000 : 0, df.toISOString().split('T')[0], cvc, req.user.id, category_id, isCredit ? 100000 : 0]
    );
    res.status(201).json(await withCat(r.rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.put('/:id/block', authMiddleware, async (req, res) => {
  try {
    const c = await pool.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    if (!c.rows.length) return res.status(404).json({ message: 'Карта не найдена' });
    const r = await pool.query('UPDATE card SET is_blocked=NOT is_blocked WHERE id=$1 RETURNING *', [req.params.id]);
    res.json(await withCat(r.rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.put('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const { daily_limit, monthly_limit } = req.body;
    const c = await pool.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    if (!c.rows.length) return res.status(404).json({ message: 'Карта не найдена' });
    const r = await pool.query('UPDATE card SET daily_limit=$1,monthly_limit=$2 WHERE id=$3 RETURNING *', [daily_limit || 100000, monthly_limit || 1000000, req.params.id]);
    res.json(await withCat(r.rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.get('/:id/statement', authMiddleware, async (req, res) => {
  try {
    const c = await pool.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    if (!c.rows.length) return res.status(404).json({ message: 'Карта не найдена' });
    const txs = await pool.query(
      `SELECT t.*,ts.name as status_name,cs.number_card as sender_card,ca.number_card as address_card
       FROM transaction t JOIN transaction_status ts ON t.status_id=ts.id
       LEFT JOIN card cs ON t.id_card_sender=cs.id LEFT JOIN card ca ON t.id_card_address=ca.id
       WHERE t.id_card_sender=$1 OR t.id_card_address=$1 ORDER BY t.id DESC`, [req.params.id]);
    res.json({ card: c.rows[0], transactions: txs.rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

module.exports = router;
