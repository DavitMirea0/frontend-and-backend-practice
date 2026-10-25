import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
const anyUser = requireAuth(['admin', 'client', 'guest']);
const clients = requireAuth(['admin', 'client']);

// Инвентаризация: сводка по всем складам
router.get('/inventory/summary', anyUser, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM fn_inventory_summary()');
    res.json(rows);
  } catch (e) { next(e); }
});

// Инвентаризация: детальные остатки по складу
router.get('/inventory/warehouse/:code', anyUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM fn_inventory_by_warehouse($1)', [req.params.code]);
    res.json(rows);
  } catch (e) { next(e); }
});

// Ордера на конкретном складе (для перемещения) — только client/admin
router.get('/warehouse/:code/orders', clients, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT su.order_number, su.order_date, su.quantity, su.unit_price,
             m.material_name, m.class_code, u.unit_name, s.supplier_name,
             su.current_warehouse
        FROM storage_units su
        JOIN materials m            ON m.material_code = su.material_code
        JOIN units_of_measurement u ON u.unit_code     = su.unit_code
        JOIN suppliers s            ON s.supplier_code = su.supplier_code
       WHERE su.current_warehouse = $1::int
       ORDER BY su.order_date DESC`, [req.params.code]);
    res.json(rows);
  } catch (e) { next(e); }
});

// Перемещение ордеров между складами — только client/admin
router.post('/transfer', clients, async (req, res, next) => {
  try {
    const { order_ids, to_warehouse } = req.body;
    if (!Array.isArray(order_ids) || !order_ids.length)
      return res.status(400).json({ error: 'order_ids обязателен' });
    if (![1,2,3,4].includes(Number(to_warehouse)))
      return res.status(400).json({ error: 'to_warehouse: 1–4' });

    // Явный каст массива → int[], чтобы PostgreSQL не ругался на неизвестный тип
    const ids = order_ids.map(Number);

    const { rows: before } = await query(
      'SELECT DISTINCT current_warehouse FROM storage_units WHERE order_number = ANY($1::int[])',
      [ids]);
    const fromWh = before[0]?.current_warehouse ?? '?';

    const { rowCount } = await query(
      'UPDATE storage_units SET current_warehouse = $1::int WHERE order_number = ANY($2::int[])',
      [Number(to_warehouse), ids]);

    await query(
      `INSERT INTO audit_log(op_type, entity, entity_id, message)
       VALUES('UPDATE','storage_units',$1::text,
         FORMAT('Перемещено %s ордер(ов) со склада %s на склад %s',$2::int,$3::text,$4::int))`,
      [ids.join(','), rowCount, fromWh, Number(to_warehouse)]);

    res.json({ ok: true, moved: rowCount, to_warehouse: Number(to_warehouse) });
  } catch (e) { next(e); }
});

export default router;
