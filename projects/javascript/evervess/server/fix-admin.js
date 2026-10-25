const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query("DELETE FROM users WHERE login = 'admin@evervess.com'");
  await pool.query(
    "INSERT INTO users (name, login, password_hash, role_id) VALUES ('Admin', 'admin@evervess.com', $1, 3)",
    [hash]
  );
  console.log('✅ Админ создан!');
  console.log('   Логин: admin@evervess.com');
  console.log('   Пароль: admin123');
  process.exit();
}

main().catch(err => { console.error(err); process.exit(1); });
