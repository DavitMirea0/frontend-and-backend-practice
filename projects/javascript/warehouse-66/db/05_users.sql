-- =============================================================
-- Аутентификация и роли (guest / client / admin)
-- =============================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,         -- bcrypt hash
    role           VARCHAR(20)  NOT NULL DEFAULT 'client'
                   CHECK (role IN ('admin', 'client', 'guest')),
    full_name      VARCHAR(120),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_login_at  TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role     ON users(role);

-- Тестовые пользователи. Пароли:
--   admin   → admin123
--   manager → manager123
--   viewer  → viewer123
-- Хэши вычислены bcryptjs (10 раундов). Скрипт initDb.js может перехэшировать
-- при необходимости (заглушки 'plain:...' заменяются на bcrypt автоматически).
INSERT INTO users (username, password_hash, role, full_name) VALUES
    ('admin',   '$2b$10$6HxYsIRlzbR6bTdwGv66/u7AGgon6Z0yTp14G/8sy50bfywxLZjVC', 'admin',  'Администратор системы'),
    ('manager', '$2b$10$38FKi1RnAPlDOpdc9Dk95OABUwF2Dh8S1xG0yYc07rXbLQB3f2OE2', 'client', 'Менеджер склада'),
    ('viewer',  '$2b$10$5PZ5fVcoyGoehZSZFeWY6e37.Pkc3C.fyhvtqK/u/3XQUtBwlwBDW', 'guest',  'Гость / просмотр');
