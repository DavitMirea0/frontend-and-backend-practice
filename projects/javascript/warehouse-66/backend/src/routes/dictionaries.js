import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// ---------- materials ----------
router.get('/materials', requireAuth(['admin', 'client', 'guest']), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT m.material_code, m.class_code, m.group_code, m.material_name,
             m.unit_code, u.unit_name
        FROM materials m
        JOIN units_of_measurement u ON u.unit_code = m.unit_code
       ORDER BY m.material_name
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/materials', requireAuth(['admin']), async (req, res, next) => {
  try {
    const { class_code, group_code, material_name, unit_code } = req.body;
    const { rows } = await query(
      `INSERT INTO materials (class_code, group_code, material_name, unit_code)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [class_code, group_code, material_name, unit_code]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// ---------- suppliers ----------
router.get('/suppliers', requireAuth(['admin','client','guest']), async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM suppliers ORDER BY supplier_name`);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/suppliers', requireAuth(['admin']), async (req, res, next) => {
  try {
    const s = req.body;
    const { rows } = await query(
      `INSERT INTO suppliers
        (supplier_name, inn,
         legal_zip, legal_city, legal_street, legal_house,
         bank_zip,  bank_city,  bank_street,  bank_house,
         bank_account)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        s.supplier_name, s.inn,
        s.legal_zip, s.legal_city, s.legal_street, s.legal_house,
        s.bank_zip,  s.bank_city,  s.bank_street,  s.bank_house,
        s.bank_account,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/suppliers/:id', requireAuth(['admin']), async (req, res, next) => {
  try {
    await query(`DELETE FROM suppliers WHERE supplier_code = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    // 23xxx — нарушение целостности / RAISE из триггера
    if (String(e.code || '').startsWith('P0') || String(e.code || '').startsWith('23')) {
      return res.status(409).json({ error: e.message });
    }
    next(e);
  }
});

// ---------- documents ----------
router.get('/documents', requireAuth(['admin','client','guest']), async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM documents ORDER BY document_name`);
    res.json(rows);
  } catch (e) { next(e); }
});

// ---------- units ----------
router.get('/units', requireAuth(['admin','client','guest']), async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM units_of_measurement ORDER BY unit_name`);
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
