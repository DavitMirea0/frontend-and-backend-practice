"""Конфигурация подключения к базе данных через SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# connect_args нужен только для SQLite — другие СУБД его не используют
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""

    pass


def get_db():
    """Зависимость FastAPI: открывает сессию на время запроса и закрывает её."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
