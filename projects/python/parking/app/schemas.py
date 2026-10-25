"""Схемы запросов и ответов (pydantic). Через них FastAPI проверяет входные данные."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


# ---------- пользователи и машины ----------
class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=100)
    role: str = Field(default="student", pattern="^(student|teacher|staff|guest)$")


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


class RegisterIn(UserCreate):
    password: str = Field(min_length=10, max_length=128)


class LoginIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=100)
    password: str = Field(min_length=1, max_length=128)


class CarCreate(BaseModel):
    plate: str = Field(min_length=5, max_length=15)
    model: Optional[str] = Field(default=None, max_length=50)
    owner_id: int


class CarOut(BaseModel):
    id: int
    plate: str
    model: Optional[str]
    owner_id: int
    owner_name: str


# ---------- зоны и места ----------
class ZoneCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    spots_count: int = Field(ge=1, le=200)


class ZoneOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class SpotOut(BaseModel):
    id: int
    zone_id: int
    zone_name: str
    number: int
    kind: str
    status: str                      # free / occupied / reserved / closed
    plate: Optional[str] = None      # госномер, если место занято


# ---------- въезд / выезд ----------
class EntryIn(BaseModel):
    plate: str
    zone_id: Optional[int] = None    # можно указать желаемую зону


class ExitIn(BaseModel):
    plate: str


class SessionOut(BaseModel):
    id: int
    plate: str
    zone_name: str
    spot_number: int
    entry_time: datetime
    exit_time: Optional[datetime]
    minutes: int                     # сколько минут стоит (или стояла) машина


# ---------- бронирование ----------
class ReservationCreate(BaseModel):
    plate: str
    spot_id: int
    start_time: datetime
    end_time: datetime


class ReservationOut(BaseModel):
    id: int
    plate: str
    zone_name: str
    spot_number: int
    start_time: datetime
    end_time: datetime
    status: str


# ---------- статистика и прогноз ----------
class ZoneStats(BaseModel):
    zone_id: int
    zone_name: str
    total: int
    occupied: int
    reserved: int
    free: int


class StatsOut(BaseModel):
    total: int
    occupied: int
    reserved: int
    free: int
    zones: list[ZoneStats]


class HourForecast(BaseModel):
    hour: int
    load_percent: int
    level: str                       # low / medium / high


class ForecastOut(BaseModel):
    date: str
    weekday: str
    days_used: int                   # по скольким прошлым дням построен прогноз
    hours: list[HourForecast]
    best_hour: Optional[int]
    message: str
