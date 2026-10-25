"""Таблицы базы данных (ORM-модели SQLAlchemy)."""
from datetime import datetime

from sqlalchemy import (Column, Integer, String, Boolean, DateTime, ForeignKey,
                        UniqueConstraint, CheckConstraint, Index)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    """Пользователь парковки: студент, преподаватель, сотрудник или гость."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    role = Column(String(20), nullable=False, default="student")
    created_at = Column(DateTime, default=datetime.now)

    cars = relationship("Car", back_populates="owner")

    __table_args__ = (
        CheckConstraint("role IN ('student', 'teacher', 'staff', 'guest')", name="ck_users_role"),
    )


class Car(Base):
    """Автомобиль. Госномер уникален. У одного пользователя может быть несколько машин."""
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True)
    plate = Column(String(15), nullable=False, unique=True)
    model = Column(String(50))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="cars")


class Zone(Base):
    """Зона (участок) парковки, например «Зона А — главный корпус»."""
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False, unique=True)

    spots = relationship("Spot", back_populates="zone")


class Spot(Base):
    """Парковочное место внутри зоны."""
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    number = Column(Integer, nullable=False)
    kind = Column(String(20), nullable=False, default="regular")  # regular / disabled
    is_active = Column(Boolean, nullable=False, default=True)     # False - место закрыто

    zone = relationship("Zone", back_populates="spots")

    __table_args__ = (
        UniqueConstraint("zone_id", "number", name="uq_spot_zone_number"),
        CheckConstraint("kind IN ('regular', 'disabled')", name="ck_spots_kind"),
    )


class Reservation(Base):
    """Бронь места на промежуток времени."""
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="active")  # active / cancelled
    created_at = Column(DateTime, default=datetime.now)

    car = relationship("Car")
    spot = relationship("Spot")

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="ck_reservation_time"),
        CheckConstraint("status IN ('active', 'cancelled')", name="ck_reservation_status"),
        # индекс нужен, чтобы быстро искать пересечения броней на одном месте
        Index("ix_reservations_spot_time", "spot_id", "start_time", "end_time"),
    )


class ParkingSession(Base):
    """Стоянка: въезд и выезд автомобиля. Пока exit_time пустой - машина на парковке."""
    __tablename__ = "parking_sessions"

    id = Column(Integer, primary_key=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)

    car = relationship("Car")
    spot = relationship("Spot")

    __table_args__ = (
        Index("ix_sessions_entry_time", "entry_time"),
        Index("ix_sessions_car_exit", "car_id", "exit_time"),
    )
