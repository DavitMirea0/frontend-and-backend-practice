-- Миграция: psql -U postgres -d bankapp -f migrate.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE card ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE card ADD COLUMN IF NOT EXISTS daily_limit NUMERIC(15,2) DEFAULT 100000.00;
ALTER TABLE card ADD COLUMN IF NOT EXISTS monthly_limit NUMERIC(15,2) DEFAULT 1000000.00;
ALTER TABLE card ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2) DEFAULT 0.00;

ALTER TABLE transaction ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE transaction ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE transaction ADD COLUMN IF NOT EXISTS tx_type VARCHAR(30) DEFAULT 'transfer';

-- Обновить кредитные лимиты для существующих кредитных карт
UPDATE card SET credit_limit = 100000.00 WHERE category_id = 2 AND credit_limit = 0;
