"""Добавляет две записи в таблицу products (шаг 5 задания 9.1).

Используется ПОСЛЕ применения первой миграции и ДО применения второй,
чтобы продемонстрировать корректную работу второй миграции на непустой таблице.

Запуск:
    python scripts/seed_two_products.py
"""
import sys
from pathlib import Path

# Чтобы запускать из корня проекта
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.database import engine


def main() -> None:
    with engine.begin() as conn:
        # Используем прямой SQL, потому что в момент исполнения скрипта
        # (между миграциями) таблица ещё не содержит колонку description.
        conn.execute(
            text("INSERT INTO products (title, price, count) VALUES (:t, :p, :c)"),
            [
                {"t": "Клавиатура механическая", "p": 4990.0, "c": 15},
                {"t": "Мышь беспроводная", "p": 1990.0, "c": 30},
            ],
        )
        rows = conn.execute(text("SELECT id, title, price, count FROM products")).all()
        print("Добавлено записей в products:")
        for row in rows:
            print(" ", dict(row._mapping))


if __name__ == "__main__":
    main()
