"""Модель Product (задание 9.1).

Финальная версия модели содержит поле description.
Поле было добавлено во второй миграции Alembic (см. alembic/versions/).
"""
from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Поле добавлено во второй миграции, обязательное (not null)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Product id={self.id} title={self.title!r}>"
