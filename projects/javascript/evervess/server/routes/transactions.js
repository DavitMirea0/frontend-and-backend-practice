const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT t.*,ts.name as status_name,cs.number_card as sender_card,ca.number_card as address_card,ss.number_score as sender_score,sa.number_score as address_score
       FROM transaction t JOIN transaction_status ts ON t.status_id=ts.id
       LEFT JOIN card cs ON t.id_card_sender=cs.id LEFT JOIN card ca ON t.id_card_address=ca.id
       LEFT JOIN score ss ON t.id_score_sender=ss.id LEFT JOIN score sa ON t.id_score_adress=sa.id
       WHERE cs.owner_id=$1 OR ca.owner_id=$1 OR ss.owner_id=$1 OR sa.owner_id=$1 ORDER BY t.id DESC`,
      [req.user.id]);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.post('/card-transfer', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { sender_card_id, address_card_number, sum } = req.body;
    if (!sender_card_id || !address_card_number || !sum || sum <= 0) return res.status(400).json({ message: 'Заполните все поля корректно' });
    await client.query('BEGIN');
    const sR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [sender_card_id, req.user.id]);
    if (!sR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта отправителя не найдена' }); }
    if (sR.rows[0].is_blocked) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта заблокирована' }); }
    if (parseFloat(sR.rows[0].balance) < parseFloat(sum)) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Недостаточно средств' }); }
    const aR = await client.query('SELECT * FROM card WHERE number_card=$1', [address_card_number]);
    if (!aR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта получателя не найдена' }); }
    if (aR.rows[0].is_blocked) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта получателя заблокирована' }); }
    await client.query('UPDATE card SET balance=balance-$1 WHERE id=$2', [sum, sR.rows[0].id]);
    await client.query('UPDATE card SET balance=balance+$1 WHERE id=$2', [sum, aR.rows[0].id]);
    const tx = await client.query(`INSERT INTO transaction (id_card_sender,id_card_address,sum,status_id,description,tx_type) VALUES ($1,$2,$3,2,$4,'transfer') RETURNING *`, [sR.rows[0].id, aR.rows[0].id, sum, `Перевод на карту •••• ${address_card_number.slice(-4)}`]);
    await client.query('COMMIT');
    res.status(201).json(tx.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
  finally { client.release(); }
});

router.post('/topup-card', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { target_card_id, source_card_id, sum } = req.body;
    if (!target_card_id || !sum || sum <= 0) return res.status(400).json({ message: 'Заполните все поля' });
    await client.query('BEGIN');
    const tR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [target_card_id, req.user.id]);
    if (!tR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта не найдена' }); }
    if (tR.rows[0].is_blocked) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта заблокирована' }); }
    if (source_card_id) {
      const sR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [source_card_id, req.user.id]);
      if (!sR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта-источник не найдена' }); }
      if (parseFloat(sR.rows[0].balance) < parseFloat(sum)) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Недостаточно средств' }); }
      await client.query('UPDATE card SET balance=balance-$1 WHERE id=$2', [sum, source_card_id]);
      await client.query('UPDATE card SET balance=balance+$1 WHERE id=$2', [sum, target_card_id]);
      const tx = await client.query(`INSERT INTO transaction (id_card_sender,id_card_address,sum,status_id,description,tx_type) VALUES ($1,$2,$3,2,'Пополнение между своими картами','topup') RETURNING *`, [source_card_id, target_card_id, sum]);
      await client.query('COMMIT'); return res.status(201).json(tx.rows[0]);
    } else {
      await client.query('UPDATE card SET balance=balance+$1 WHERE id=$2', [sum, target_card_id]);
      const tx = await client.query(`INSERT INTO transaction (id_card_address,sum,status_id,description,tx_type) VALUES ($1,$2,2,'Пополнение карты','topup') RETURNING *`, [target_card_id, sum]);
      await client.query('COMMIT'); return res.status(201).json(tx.rows[0]);
    }
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
  finally { client.release(); }
});

router.post('/topup-score', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { score_id, card_id, sum } = req.body;
    if (!score_id || !card_id || !sum || sum <= 0) return res.status(400).json({ message: 'Заполните все поля' });
    await client.query('BEGIN');
    const cR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [card_id, req.user.id]);
    if (!cR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта не найдена' }); }
    if (cR.rows[0].is_blocked) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта заблокирована' }); }
    if (parseFloat(cR.rows[0].balance) < parseFloat(sum)) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Недостаточно средств' }); }
    const sR = await client.query('SELECT * FROM score WHERE id=$1 AND owner_id=$2', [score_id, req.user.id]);
    if (!sR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Счёт не найден' }); }
    await client.query('UPDATE card SET balance=balance-$1 WHERE id=$2', [sum, card_id]);
    await client.query('UPDATE score SET balance=balance+$1 WHERE id=$2', [sum, score_id]);
    const tx = await client.query(`INSERT INTO transaction (id_card_sender,id_score_adress,sum,status_id,description,tx_type) VALUES ($1,$2,$3,2,'Пополнение накопительного счёта','topup_score') RETURNING *`, [card_id, score_id, sum]);
    await client.query('COMMIT'); res.status(201).json(tx.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
  finally { client.release(); }
});

router.post('/withdraw-score', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { score_id, card_id, sum } = req.body;
    if (!score_id || !card_id || !sum || sum <= 0) return res.status(400).json({ message: 'Заполните все поля' });
    await client.query('BEGIN');
    const sR = await client.query('SELECT * FROM score WHERE id=$1 AND owner_id=$2', [score_id, req.user.id]);
    if (!sR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Счёт не найден' }); }
    if (parseFloat(sR.rows[0].balance) < parseFloat(sum)) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Недостаточно средств на счёте' }); }
    const cR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [card_id, req.user.id]);
    if (!cR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Карта не найдена' }); }
    await client.query('UPDATE score SET balance=balance-$1 WHERE id=$2', [sum, score_id]);
    await client.query('UPDATE card SET balance=balance+$1 WHERE id=$2', [sum, card_id]);
    const tx = await client.query(`INSERT INTO transaction (id_score_sender,id_card_address,sum,status_id,description,tx_type) VALUES ($1,$2,$3,2,'Снятие с накопительного счёта','topup_score') RETURNING *`, [score_id, card_id, sum]);
    await client.query('COMMIT'); res.status(201).json(tx.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
  finally { client.release(); }
});

router.post('/pay-credit', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { credit_card_id, debit_card_id, sum } = req.body;
    if (!credit_card_id || !debit_card_id || !sum || sum <= 0) return res.status(400).json({ message: 'Заполните все поля' });
    await client.query('BEGIN');
    const dR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2', [debit_card_id, req.user.id]);
    if (!dR.rows.length || parseFloat(dR.rows[0].balance) < parseFloat(sum)) { await client.query('ROLLBACK'); return res.status(400).json({ message: !dR.rows.length ? 'Карта не найдена' : 'Недостаточно средств' }); }
    const cR = await client.query('SELECT * FROM card WHERE id=$1 AND owner_id=$2 AND category_id=2', [credit_card_id, req.user.id]);
    if (!cR.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Кредитная карта не найдена' }); }
    const cc = cR.rows[0];
    const maxRepay = parseFloat(cc.credit_limit) - parseFloat(cc.balance);
    const actualSum = Math.min(parseFloat(sum), maxRepay);
    if (actualSum <= 0) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Задолженность уже погашена' }); }
    await client.query('UPDATE card SET balance=balance-$1 WHERE id=$2', [actualSum, debit_card_id]);
    await client.query('UPDATE card SET balance=balance+$1 WHERE id=$2', [actualSum, credit_card_id]);
    const tx = await client.query(`INSERT INTO transaction (id_card_sender,id_card_address,sum,status_id,description,tx_type) VALUES ($1,$2,$3,2,'Погашение задолженности по кредитной карте','transfer') RETURNING *`, [debit_card_id, credit_card_id, actualSum]);
    await client.query('COMMIT'); res.status(201).json({ ...tx.rows[0], actual_sum: actualSum });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); }
  finally { client.release(); }
});

module.exports = router;
