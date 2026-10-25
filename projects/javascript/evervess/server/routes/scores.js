const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json((await pool.query(
      `SELECT s.*,st.name as type_name,st.percent FROM score s JOIN score_type st ON s.score_type_id=st.id WHERE s.owner_id=$1 ORDER BY s.id`,
      [req.user.id])).rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.get('/types', authMiddleware, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM score_type ORDER BY id')).rows); }
  catch (err) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score_type_id } = req.body;
    if (!score_type_id) return res.status(400).json({ message: 'Укажите тип счёта' });
    const num = '408' + Array.from({ length: 17 }, () => Math.floor(Math.random() * 10)).join('');
    const df = new Date(); df.setFullYear(df.getFullYear() + 5);
    const r = await pool.query(
      `INSERT INTO score (number_score,balance,date_finish,owner_id,score_type_id) VALUES ($1,0.00,$2,$3,$4) RETURNING *`,
      [num, df.toISOString().split('T')[0], req.user.id, score_type_id]);
    const s = r.rows[0];
    const st = await pool.query('SELECT name,percent FROM score_type WHERE id=$1', [score_type_id]);
    s.type_name = st.rows[0]?.name; s.percent = st.rows[0]?.percent;
    res.status(201).json(s);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

module.exports = router;
