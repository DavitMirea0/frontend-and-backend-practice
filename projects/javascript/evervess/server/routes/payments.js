const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.post('/pay', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { card_id, sum, description } = req.body;
    if (!card_id || !sum || sum <= 0) return res.status(400).json({ message: 'Заполните все поля' });
    await client.query('BEGIN');
    const cR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [card_id, req.user.id]);
    if (!cR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта не найдена' }); }
    if (cR.rows[0].is_blocked) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта заблокирована' }); }
    if (parseFloat(cR.rows[0].balance) < parseFloat(sum)) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Недостаточно средств' }); }
    await client.query('UPDATE card SET balance=balance-$1 WHERE id=$2', [sum, card_id]);
    const tx = await client.query(`INSERT INTO transaction (id_card_sender,sum,status_id,description,tx_type) VALUES ($1,$2,2,$3,'payment') RETURNING *`, [card_id, sum, description || 'Оплата услуг']);
    await client.query('COMMIT');
    res.status(201).json(tx.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
  finally { client.release(); }
});

module.exports = router;
