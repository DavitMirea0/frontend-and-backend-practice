import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

const anyUser = requireAuth(['admin', 'client', 'guest']);
const clients = requireAuth(['admin', 'client']);
const admins  = requireAuth(['admin']);

// Список ордеров — могут смотреть все
router.get('/storage-units', anyUser, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT su.order_number,
             su.order_date,
             su.supplier_code,    s.supplier_name,
             su.balance_account,
             su.document_code,    d.document_name,
             su.document_number,
             su.material_code,    m.material_name,
             su.material_account,
             su.unit_code,        u.unit_name,
             su.quantity,
             su.unit_price,
             (su.quantity * su.unit_price)::NUMERIC(16,2) AS total_amount
        FROM storage_units su
        JOIN suppliers              s ON s.supplier_code = su.supplier_code
        JOIN documents              d ON d.document_code = su.document_code
        JOIN materials              m ON m.material_code = su.material_code
        JOIN units_of_measurement   u ON u.unit_code     = su.unit_code
       ORDER BY su.order_date DESC, su.order_number DESC
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

// Создание ордера через ХРАНИМУЮ ПРОЦЕДУРУ sp_add_storage_unit
router.post('/storage-units', clients, async (req, res, next) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `CALL sp_add_storage_unit($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NULL)`,
      [
        b.order_date || null,
        b.supplier_code,
        b.balance_account,
        b.document_code,
        b.document_number,
        b.material_code,
        b.material_account,
        b.unit_code,
        b.quantity,
        b.unit_price,
      ]
    );
    // OUT-параметр процедуры возвращается как последний столбец
    const newId = rows[0]?.p_new_order_number;
    res.status(201).json({ order_number: newId });
  } catch (e) {
    if (e.code === 'P0001') return res.status(400).json({ error: e.message });
    next(e);
  }
});

router.delete('/storage-units/:id', admins, async (req, res, next) => {
  try {
    await query(`DELETE FROM storage_units WHERE order_number = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Сводка для главного экрана (карточки "складов" по группам материалов
// делаем так: реальных физических складов в задании нет, поэтому
// группируем приходы по классу материалов и показываем суммарный объём/количество)
router.get('/summary', anyUser, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT w.code AS class_code,
             w.name AS warehouse_name,
             w.address,
             w.capacity,
             COALESCE(SUM(su.quantity), 0)::NUMERIC AS filled,
             COUNT(DISTINCT su.order_number)::INT    AS goods_count
        FROM (VALUES
          (1, 'общий-2',       'ул. Станколит, 5',         3000),
          (2, 'сортировочный', 'ул. Малая Ордынка, 6',      1000),
          (3, 'общий',         'ш. Бесединское, 7',         1500),
          (4, 'утилизация',    'ул. Тимура Фрунзе, 4',       500)
        ) AS w(code, name, address, capacity)
        LEFT JOIN storage_units su ON su.current_warehouse = w.code
       GROUP BY w.code, w.name, w.address, w.capacity
       ORDER BY w.code
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;

// Ордера старше N дней (для утилизации)
router.get('/storage-units/old', anyUser, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const { rows } = await query(`
      SELECT su.order_number, su.order_date, su.quantity, su.unit_price,
             s.supplier_name, m.material_name, u.unit_name,
             CURRENT_DATE - su.order_date AS age_days
        FROM storage_units su
        JOIN suppliers s ON s.supplier_code = su.supplier_code
        JOIN materials  m ON m.material_code  = su.material_code
        JOIN units_of_measurement u ON u.unit_code = su.unit_code
       WHERE su.order_date < CURRENT_DATE - INTERVAL '1 day' * $1
       ORDER BY su.order_date ASC
       LIMIT 100`, [days]);
    res.json(rows);
  } catch (e) { next(e); }
});

// Топ поставщиков по объёму (для финансового анализа)
router.get('/analytics/top-suppliers', clients, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const { rows } = await query(`
      SELECT s.supplier_name, s.inn,
             COUNT(su.order_number)         AS orders_count,
             SUM(su.quantity)               AS total_qty,
             SUM(su.quantity * su.unit_price) AS total_sum
        FROM storage_units su
        JOIN suppliers s ON s.supplier_code = su.supplier_code
       GROUP BY s.supplier_code, s.supplier_name, s.inn
       ORDER BY total_sum DESC
       LIMIT $1`, [limit]);
    res.json(rows);
  } catch (e) { next(e); }
});

// Итоговая статистика склада (для оптимизации)
router.get('/analytics/warehouse-stats', anyUser, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT class_code,
             COUNT(order_number)              AS orders_count,
             SUM(quantity)                    AS total_qty,
             SUM(quantity * unit_price)       AS total_value,
             MAX(order_date)                  AS last_delivery,
             MIN(order_date)                  AS first_delivery
        FROM storage_units
       GROUP BY class_code
       ORDER BY class_code`);
    res.json(rows);
  } catch (e) { next(e); }
});
