import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, '../../../db');

const files = ['01_schema.sql', '02_package.sql', '03_triggers.sql', '04_seed.sql', '05_users.sql'];

(async () => {
  const client = await pool.connect();
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dbDir, f), 'utf8');
      console.log(`→ running ${f} ...`);
      await client.query(sql);
    }

    // Заменяем plain:<пароль> на bcrypt-хэши
    const { rows } = await client.query(
      `SELECT user_id, password_hash FROM users WHERE password_hash LIKE 'plain:%'`
    );
    for (const r of rows) {
      const plain = r.password_hash.replace(/^plain:/, '');
      const hash = await bcrypt.hash(plain, 10);
      await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hash, r.user_id]);
    }
    if (rows.length) console.log(`✓ Захэшировано паролей: ${rows.length}`);

    console.log('✓ База данных инициализирована');
    console.log('  Тестовые учётки: admin/admin123, manager/manager123, viewer/viewer123');
  } catch (e) {
    console.error('✗ Ошибка инициализации:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
