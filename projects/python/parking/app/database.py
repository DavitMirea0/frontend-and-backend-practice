"""Подключение к базе данных.

По умолчанию используется SQLite (файл parking.db рядом с проектом),
чтобы ничего не нужно было устанавливать. Чтобы перейти на PostgreSQL,
достаточно поменять переменную окружения DATABASE_URL, например:
    postgresql://user:password@localhost/parking
"""
import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parking.db")

# для SQLite нужен параметр check_same_thread, иначе FastAPI ругается на потоки
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)


# в SQLite внешние ключи по умолчанию выключены - включаем, чтобы база сама
# не давала создать запись со ссылкой на несуществующую строку
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    """Выдаёт сессию БД на время одного запроса и потом закрывает её."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
