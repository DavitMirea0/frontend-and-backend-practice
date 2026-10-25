"""Точка входа: создаём приложение FastAPI и описываем все URL (эндпоинты)."""
from datetime import date
from pathlib import Path
from typing import Optional
import logging
import time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas, services, auth
from .auth import current_account, administrator, operator
from datetime import datetime, timedelta
import secrets
from collections import OrderedDict
from threading import Lock
from copy import deepcopy
from .database import Base, engine, get_db

# создаём таблицы, если их ещё нет
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Парковка университета", version="2.0")

STATIC_DIR = Path(__file__).parent / "static"
logger = logging.getLogger("uvicorn.error")


@app.middleware("http")
async def observe_requests(request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    # Не записываем параметры запросов и тела с персональными данными.
    logger.info("method=%s status=%s duration_ms=%.1f", request.method,
                response.status_code, (time.perf_counter() - started) * 1000)
    return response


@app.get("/health/live", include_in_schema=False)
def liveness():
    """Процесс приложения отвечает на запросы."""
    return {"status": "ok"}


@app.get("/health/ready", include_in_schema=False)
def readiness(db: Session = Depends(get_db)):
    """Готовность обслуживать запросы с доступом к базе данных."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Database readiness check failed")
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def index():
    """Главная страница (frontend)."""
    return FileResponse(STATIC_DIR / "index.html")


# ---------------- пользователи и автомобили ----------------

@app.post("/api/users", response_model=schemas.UserOut, status_code=201)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db), account=Depends(administrator)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(409, "Пользователь с такой почтой уже есть")
    user = models.User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/users", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db), account=Depends(administrator)):
    return db.query(models.User).order_by(models.User.id).all()


@app.post("/api/cars", response_model=schemas.CarOut, status_code=201)
def create_car(data: schemas.CarCreate, db: Session = Depends(get_db), account=Depends(current_account)):
    auth.check_owner(account, data.owner_id)
    owner = db.get(models.User, data.owner_id)
    if owner is None:
        raise HTTPException(404, "Владелец не найден")
    plate = services.normalize_plate(data.plate)
    if db.query(models.Car).filter(models.Car.plate == plate).first():
        raise HTTPException(409, "Автомобиль с таким номером уже зарегистрирован")
    car = models.Car(plate=plate, model=data.model, owner_id=owner.id)
    db.add(car)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Автомобиль с таким номером уже зарегистрирован")
    db.refresh(car)
    return {"id": car.id, "plate": car.plate, "model": car.model,
            "owner_id": owner.id, "owner_name": owner.full_name}


@app.get("/api/cars", response_model=list[schemas.CarOut])
def get_cars(db: Session = Depends(get_db), account=Depends(current_account)):
    query = db.query(models.Car)
    if account.access_role == "user":
        query = query.filter(models.Car.owner_id == account.user_id)
    cars = query.order_by(models.Car.id).all()
    return [{"id": c.id, "plate": c.plate, "model": c.model,
             "owner_id": c.owner_id, "owner_name": c.owner.full_name} for c in cars]


# ---------------- зоны и места ----------------

@app.post("/api/zones", response_model=schemas.ZoneOut, status_code=201)
def create_zone(data: schemas.ZoneCreate, db: Session = Depends(get_db), account=Depends(administrator)):
    return services.create_zone(db, data.name, data.spots_count)


@app.get("/api/zones", response_model=list[schemas.ZoneOut])
def get_zones(db: Session = Depends(get_db)):
    return db.query(models.Zone).order_by(models.Zone.id).all()


@app.get("/api/spots", response_model=list[schemas.SpotOut])
def get_spots(zone_id: Optional[int] = None, db: Session = Depends(get_db)):
    items = services.list_spots(db, zone_id)
    return [dict(item, plate=None) for item in items]


@app.get("/api/stats", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db)):
    return services.get_stats(db)


# ---------------- въезд и выезд ----------------

@app.post("/api/entries", response_model=schemas.SessionOut, status_code=201)
def car_enter(data: schemas.EntryIn, db: Session = Depends(get_db), account=Depends(operator)):
    session = services.car_enter(db, data.plate, data.zone_id)
    return services.session_to_dict(session)


@app.post("/api/exits", response_model=schemas.SessionOut)
def car_exit(data: schemas.ExitIn, db: Session = Depends(get_db), account=Depends(operator)):
    session = services.car_exit(db, data.plate)
    return services.session_to_dict(session)


@app.get("/api/sessions", response_model=list[schemas.SessionOut])
def get_sessions(active: bool = False, limit: int = 50, db: Session = Depends(get_db), account=Depends(current_account)):
    """active=true - только машины, которые сейчас на парковке."""
    query = db.query(models.ParkingSession)
    if account.access_role == "user":
        query = query.join(models.Car).filter(models.Car.owner_id == account.user_id)
    if active:
        query = query.filter(models.ParkingSession.exit_time.is_(None))
    sessions = query.order_by(models.ParkingSession.entry_time.desc()).limit(min(limit, 500)).all()
    return [services.session_to_dict(s) for s in sessions]


# ---------------- бронирование ----------------

@app.post("/api/reservations", response_model=schemas.ReservationOut, status_code=201)
def create_reservation(data: schemas.ReservationCreate, db: Session = Depends(get_db), account=Depends(current_account)):
    car = db.query(models.Car).filter_by(plate=services.normalize_plate(data.plate)).first()
    if car is None:
        raise HTTPException(404, "Автомобиль не найден")
    auth.check_owner(account, car.owner_id)
    r = services.create_reservation(db, data.plate, data.spot_id, data.start_time, data.end_time)
    return services.reservation_to_dict(r)


@app.get("/api/reservations", response_model=list[schemas.ReservationOut])
def get_reservations(status: Optional[str] = None, db: Session = Depends(get_db), account=Depends(current_account)):
    query = db.query(models.Reservation)
    if account.access_role == "user":
        query = query.join(models.Car).filter(models.Car.owner_id == account.user_id)
    if status:
        query = query.filter(models.Reservation.status == status)
    items = query.order_by(models.Reservation.start_time.desc()).limit(100).all()
    return [services.reservation_to_dict(r) for r in items]


@app.post("/api/reservations/{reservation_id}/cancel", response_model=schemas.ReservationOut)
def cancel_reservation(reservation_id: int, db: Session = Depends(get_db), account=Depends(current_account)):
    item = db.get(models.Reservation, reservation_id)
    if item is None:
        raise HTTPException(404, "Бронь не найдена")
    auth.check_owner(account, item.car.owner_id)
    r = services.cancel_reservation(db, reservation_id)
    return services.reservation_to_dict(r)


# ---------------- прогноз ----------------
forecast_cache = OrderedDict()
forecast_lock = Lock()


@app.get("/api/forecast", response_model=schemas.ForecastOut)
def get_forecast(day: Optional[date] = None, db: Session = Depends(get_db)):
    """Прогноз загрузки по часам. day=ГГГГ-ММ-ДД, по умолчанию - сегодня."""
    current = services.now()
    target = day or current.date()
    key = (str(db.get_bind().url), target, current.date(), current.hour)
    with forecast_lock:
        cached = forecast_cache.get(key)
        if cached and time.monotonic() - cached[0] < 30:
            return deepcopy(cached[1])
    result = services.make_forecast(db, target)
    with forecast_lock:
        forecast_cache[key] = (time.monotonic(), deepcopy(result))
        forecast_cache.move_to_end(key)
        while len(forecast_cache) > 128:
            forecast_cache.popitem(last=False)
    return result


@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=201)
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    user = models.User(**data.model_dump(exclude={"password"}))
    db.add(user)
    try:
        db.flush()
        db.add(auth.Account(user_id=user.id, password_hash=auth.hash_password(data.password), access_role="user"))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Пользователь с такой почтой уже есть")
    db.refresh(user)
    return user


@app.post("/api/auth/login")
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=data.email).first()
    account = db.query(auth.Account).filter_by(user_id=user.id).first() if user else None
    # Одинаковая стоимость проверки и сообщение для неизвестной почты и неверного пароля.
    stored = account.password_hash if account else "0" * 32 + ":" + "0" * 64
    valid = auth.verify_password(data.password, stored)
    if account is None or not valid:
        raise HTTPException(401, "Неверная почта или пароль")
    db.query(auth.LoginSession).filter(auth.LoginSession.expires_at <= datetime.now()).delete()
    token = secrets.token_urlsafe(32)
    db.add(auth.LoginSession(token_hash=auth.token_hash(token), account_id=account.id,
                             expires_at=datetime.now() + timedelta(hours=8)))
    db.commit()
    return {"access_token": token, "token_type": "bearer", "expires_in": 28800}


@app.get("/api/auth/me")
def me(account=Depends(current_account), db: Session = Depends(get_db)):
    user = db.get(models.User, account.user_id)
    return {"id": user.id, "full_name": user.full_name, "access_role": account.access_role}


@app.post("/api/auth/logout")
def logout(account=Depends(current_account), credentials=Depends(auth.bearer), db: Session = Depends(get_db)):
    session = db.get(auth.LoginSession, auth.token_hash(credentials.credentials))
    if session:
        db.delete(session)
        db.commit()
    return {"message": "Вы вышли из системы"}
