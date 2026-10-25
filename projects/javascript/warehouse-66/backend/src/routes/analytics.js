import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

const anyUser = requireAuth(['admin', 'client', 'guest']);
const clients = requireAuth(['admin', 'client']);
const admins  = requireAuth(['admin']);

// Функция №1: кол-во поставщиков данного материала (доступно всем)
router.get('/analytics/suppliers-count/:materialCode', anyUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT fn_count_suppliers_of_material($1) AS count`,
      [req.params.materialCode]
    );
    res.json({ material_code: Number(req.params.materialCode), count: rows[0].count });
  } catch (e) { next(e); }
});

// Функция №3: список поставщиков, поставлявших материал
router.get('/analytics/suppliers-of-material/:materialCode', clients, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM fn_suppliers_of_material($1)`,
      [req.params.materialCode]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Функция №4: кол-во поставщиков по городу банка
router.get('/analytics/suppliers-by-bank-city', clients, async (req, res, next) => {
  try {
    const city = (req.query.city || '').toString();
    if (!city) return res.status(400).json({ error: 'city is required' });
    const { rows } = await query(
      `SELECT fn_count_suppliers_by_bank_city($1) AS count`,
      [city]
    );
    res.json({ bank_city: city, count: rows[0].count });
  } catch (e) { next(e); }
});

// Журнал операций (из таблицы audit_log, наполняемой триггерами)
router.get('/audit-log', anyUser, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { rows } = await query(
      `SELECT id, ts, op_type, entity, entity_id, message
         FROM audit_log
        ORDER BY ts DESC, id DESC
        LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.delete('/audit-log', admins, async (req, res, next) => {
  try {
    await query(`TRUNCATE audit_log RESTART IDENTITY`);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
