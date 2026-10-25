-- Выполнить через psql под администратором, без --single-transaction.
-- Только один раз. При Docker Compose этот файл не нужен.
CREATE ROLE it_app LOGIN PASSWORD 'it_demo_password';
CREATE DATABASE it_equipment OWNER it_app;
