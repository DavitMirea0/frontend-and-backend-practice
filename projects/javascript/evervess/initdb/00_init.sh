#!/bin/bash
set -e

SQL_FILE="/tmp/init.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo ">>> init.sql не найден — пропускаем инициализацию схемы"
    exit 0
fi

echo ">>> Применяем схему БД (фильтруем CREATE DATABASE — Docker уже создал БД)..."

grep -Eiv \
    "^\s*CREATE\s+DATABASE\b|^\\\\connect\b|^\\\\c\b" \
    "$SQL_FILE" \
    | psql -v ON_ERROR_STOP=1 \
           --username "$POSTGRES_USER" \
           --dbname "$POSTGRES_DB"

echo ">>> Схема применена успешно"
