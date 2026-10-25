"""Основная логика работы парковки.

Здесь лежат все правила: как считается занятость, как выбирается место
при въезде, какие проверки нужны для брони и как строится прогноз загрузки.
"""
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models

# ---- настройки правил ----
EARLY_ARRIVAL_MIN = 15      # за сколько минут до начала брони можно заехать
MAX_RESERVATION_HOURS = 12  # максимальная длительность брони
FIRST_HOUR = 7              # парковка работает с 7:00
LAST_HOUR = 22              # ... до 22:00
STUDY_FROM = 8              # рекомендуем время приезда только в учебные часы:
STUDY_TO = 18               # с 8:00 до 18:00
HISTORY_WEEKS = 8           # сколько прошлых недель учитывать в прогнозе

WEEKDAYS = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]


def now() -> datetime:
    """Текущее время. Вынесено в функцию, чтобы в тестах можно было подменить."""
    return datetime.now().replace(microsecond=0)


def normalize_plate(plate: str) -> str:
    """Приводим госномер к единому виду: без пробелов, заглавными буквами."""
    return plate.replace(" ", "").upper()


# ---------------------------------------------------------------- поиск

def get_car_by_plate(db: Session, plate: str) -> models.Car:
    car = db.query(models.Car).filter(models.Car.plate == normalize_plate(plate)).first()
    if car is None:
        raise HTTPException(404, "Автомобиль с таким номером не зарегистрирован")
    return car


def get_open_session(db: Session, car_id: int):
    """Текущая стоянка машины (без времени выезда) или None."""
    return (db.query(models.ParkingSession)
            .filter(models.ParkingSession.car_id == car_id,
                    models.ParkingSession.exit_time.is_(None))
            .first())


def occupied_spot_ids(db: Session) -> dict:
    """Словарь {id места: госномер} для всех занятых сейчас мест."""
    rows = (db.query(models.ParkingSession.spot_id, models.Car.plate)
            .join(models.Car, models.Car.id == models.ParkingSession.car_id)
            .filter(models.ParkingSession.exit_time.is_(None))
            .all())
    return {spot_id: plate for spot_id, plate in rows}


def reserved_spot_ids(db: Session, at: datetime) -> set:
    """Места, которые в момент at закреплены за бронью (с учётом раннего заезда)."""
    rows = (db.query(models.Reservation.spot_id)
            .filter(models.Reservation.status == "active",
                    models.Reservation.start_time - timedelta(minutes=EARLY_ARRIVAL_MIN) <= at,
                    models.Reservation.end_time > at)
            .all())
    return {r[0] for r in rows}


# ---------------------------------------------------------------- места

def list_spots(db: Session, zone_id=None):
    """Все места с текущим статусом: free / occupied / reserved / closed."""
    busy = occupied_spot_ids(db)
    reserved = reserved_spot_ids(db, now())

    query = db.query(models.Spot).join(models.Zone)
    if zone_id is not None:
        query = query.filter(models.Spot.zone_id == zone_id)
    result = []
    for spot in query.order_by(models.Spot.zone_id, models.Spot.number).all():
        if not spot.is_active:
            status = "closed"
        elif spot.id in busy:
            status = "occupied"
        elif spot.id in reserved:
            status = "reserved"
        else:
            status = "free"
        result.append({
            "id": spot.id, "zone_id": spot.zone_id, "zone_name": spot.zone.name,
            "number": spot.number, "kind": spot.kind, "status": status,
            "plate": busy.get(spot.id),
        })
    return result


def get_stats(db: Session):
    """Сводка по занятости: всего / занято / забронировано / свободно."""
    spots = list_spots(db)
    zones = db.query(models.Zone).order_by(models.Zone.id).all()

    zone_stats = []
    for zone in zones:
        mine = [s for s in spots if s["zone_id"] == zone.id and s["status"] != "closed"]
        zone_stats.append({
            "zone_id": zone.id,
            "zone_name": zone.name,
            "total": len(mine),
            "occupied": sum(1 for s in mine if s["status"] == "occupied"),
            "reserved": sum(1 for s in mine if s["status"] == "reserved"),
            "free": sum(1 for s in mine if s["status"] == "free"),
        })
    return {
        "total": sum(z["total"] for z in zone_stats),
        "occupied": sum(z["occupied"] for z in zone_stats),
        "reserved": sum(z["reserved"] for z in zone_stats),
        "free": sum(z["free"] for z in zone_stats),
        "zones": zone_stats,
    }


def create_zone(db: Session, name: str, spots_count: int) -> models.Zone:
    if db.query(models.Zone).filter(models.Zone.name == name).first():
        raise HTTPException(409, "Зона с таким названием уже есть")
    zone = models.Zone(name=name)
    db.add(zone)
    db.flush()  # чтобы получить zone.id до commit
    for number in range(1, spots_count + 1):
        db.add(models.Spot(zone_id=zone.id, number=number))
    db.commit()
    db.refresh(zone)
    return zone


# ---------------------------------------------------------------- въезд / выезд

def car_enter(db: Session, plate: str, zone_id=None) -> models.ParkingSession:
    """Въезд: сначала ищем бронь машины, если её нет - берём любое свободное место."""
    car = get_car_by_plate(db, plate)
    if get_open_session(db, car.id):
        raise HTTPException(409, "Этот автомобиль уже находится на парковке")

    current = now()
    busy = occupied_spot_ids(db)

    spot_id = None

    # 1) есть ли у машины бронь на это время
    reservation = (db.query(models.Reservation)
                   .filter(models.Reservation.car_id == car.id,
                           models.Reservation.status == "active",
                           models.Reservation.start_time - timedelta(minutes=EARLY_ARRIVAL_MIN) <= current,
                           models.Reservation.end_time > current)
                   .first())
    if reservation and reservation.spot_id not in busy:
        spot_id = reservation.spot_id

    # 2) иначе - первое свободное обычное место без брони
    if spot_id is None:
        reserved = reserved_spot_ids(db, current)
        query = (db.query(models.Spot)
                 .filter(models.Spot.is_active.is_(True), models.Spot.kind == "regular"))
        if zone_id is not None:
            query = query.filter(models.Spot.zone_id == zone_id)
        for spot in query.order_by(models.Spot.zone_id, models.Spot.number).all():
            if spot.id not in busy and spot.id not in reserved:
                spot_id = spot.id
                break

    if spot_id is None:
        raise HTTPException(409, "Свободных мест нет")

    session = models.ParkingSession(car_id=car.id, spot_id=spot_id, entry_time=current)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def car_exit(db: Session, plate: str) -> models.ParkingSession:
    """Выезд: закрываем текущую стоянку."""
    car = get_car_by_plate(db, plate)
    session = get_open_session(db, car.id)
    if session is None:
        raise HTTPException(409, "Этот автомобиль сейчас не на парковке")
    session.exit_time = now()
    db.commit()
    db.refresh(session)
    return session


def session_to_dict(session: models.ParkingSession) -> dict:
    end = session.exit_time or now()
    minutes = int((end - session.entry_time).total_seconds() // 60)
    return {
        "id": session.id,
        "plate": session.car.plate,
        "zone_name": session.spot.zone.name,
        "spot_number": session.spot.number,
        "entry_time": session.entry_time,
        "exit_time": session.exit_time,
        "minutes": max(minutes, 0),
    }


# ---------------------------------------------------------------- бронирование

def create_reservation(db: Session, plate: str, spot_id: int,
                       start: datetime, end: datetime) -> models.Reservation:
    car = get_car_by_plate(db, plate)
    spot = db.get(models.Spot, spot_id)
    if spot is None:
        raise HTTPException(404, "Место не найдено")
    if not spot.is_active:
        raise HTTPException(409, "Это место закрыто")

    current = now()
    if end <= start:
        raise HTTPException(422, "Время окончания должно быть позже времени начала")
    if start < current - timedelta(minutes=1):
        raise HTTPException(422, "Нельзя бронировать на время в прошлом")
    if end - start > timedelta(hours=MAX_RESERVATION_HOURS):
        raise HTTPException(422, f"Бронь не может быть дольше {MAX_RESERVATION_HOURS} часов")

    # пересечение промежутков: (start < чужой конец) и (end > чужое начало)
    same_spot = (db.query(models.Reservation)
                 .filter(models.Reservation.spot_id == spot_id,
                         models.Reservation.status == "active",
                         models.Reservation.start_time < end,
                         models.Reservation.end_time > start)
                 .first())
    if same_spot:
        raise HTTPException(409, "Это место уже забронировано на выбранное время")

    same_car = (db.query(models.Reservation)
                .filter(models.Reservation.car_id == car.id,
                        models.Reservation.status == "active",
                        models.Reservation.start_time < end,
                        models.Reservation.end_time > start)
                .first())
    if same_car:
        raise HTTPException(409, "У этого автомобиля уже есть бронь на это время")

    # если бронь начинается прямо сейчас, а место занято чужой машиной - отказываем
    busy = occupied_spot_ids(db)
    if spot_id in busy and busy[spot_id] != car.plate and start <= current:
        raise HTTPException(409, "Место сейчас занято другим автомобилем")

    reservation = models.Reservation(car_id=car.id, spot_id=spot_id,
                                     start_time=start, end_time=end)
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, reservation_id: int) -> models.Reservation:
    reservation = db.get(models.Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(404, "Бронь не найдена")
    if reservation.status == "cancelled":
        raise HTTPException(409, "Бронь уже отменена")
    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    return reservation


def reservation_to_dict(r: models.Reservation) -> dict:
    return {
        "id": r.id, "plate": r.car.plate,
        "zone_name": r.spot.zone.name, "spot_number": r.spot.number,
        "start_time": r.start_time, "end_time": r.end_time, "status": r.status,
    }


# ---------------------------------------------------------------- прогноз загрузки (killer feature)

def load_level(percent: int) -> str:
    if percent < 40:
        return "low"
    if percent < 75:
        return "medium"
    return "high"


def make_forecast(db: Session, target_date) -> dict:
    """Прогноз загрузки парковки по часам на выбранную дату.

    Идея простая: берём такие же дни недели за последние HISTORY_WEEKS недель
    (например, для среды - предыдущие 8 сред), для каждого часа считаем сколько
    машин стояло на парковке, и усредняем. Потом делим на число мест.
    """
    total_spots = (db.query(func.count(models.Spot.id))
                   .filter(models.Spot.is_active.is_(True)).scalar()) or 0

    # даты прошлых недель с тем же днём недели
    past_days = [target_date - timedelta(weeks=k) for k in range(1, HISTORY_WEEKS + 1)]

    # одним запросом берём все стоянки за эти дни
    period_start = datetime.combine(min(past_days), datetime.min.time())
    period_end = datetime.combine(max(past_days), datetime.max.time())
    sessions = (db.query(models.ParkingSession)
                .filter(models.ParkingSession.entry_time <= period_end,
                        (models.ParkingSession.exit_time.is_(None)) |
                        (models.ParkingSession.exit_time >= period_start))
                .all())

    # история начинается с первой записанной стоянки; более ранние дни не считаем
    first_entry = db.query(func.min(models.ParkingSession.entry_time)).scalar()
    if first_entry is None:
        past_days = []
    else:
        past_days = [d for d in past_days if d >= first_entry.date()]

    # считаем: сколько машин стояло в каждый час каждого прошлого дня
    sums = {hour: 0 for hour in range(FIRST_HOUR, LAST_HOUR + 1)}
    for day in past_days:
        midnight = datetime.combine(day, datetime.min.time())
        for hour in sums:
            moment = midnight + timedelta(hours=hour)
            sums[hour] += sum(1 for s in sessions
                              if s.entry_time <= moment and (s.exit_time is None or s.exit_time > moment))

    days_with_data = len(past_days)
    hours = []
    for hour, total in sums.items():
        if days_with_data and total_spots:
            percent = min(round(total / days_with_data / total_spots * 100), 100)
        else:
            percent = 0
        hours.append({"hour": hour, "load_percent": percent, "level": load_level(percent)})

    weekday = WEEKDAYS[target_date.weekday()]
    if days_with_data == 0:
        return {"date": target_date.isoformat(), "weekday": weekday, "days_used": 0,
                "hours": hours, "best_hour": None,
                "message": "Недостаточно данных для прогноза: в базе нет истории стоянок."}

    # рекомендуем время приезда только в учебные часы (8:00-18:00),
    # а если смотрим прогноз на сегодня - только те часы, что ещё впереди
    candidates = [h for h in hours if STUDY_FROM <= h["hour"] <= STUDY_TO]
    if target_date == now().date():
        candidates = [h for h in candidates if h["hour"] > now().hour]
        if not candidates:
            return {"date": target_date.isoformat(), "weekday": weekday, "days_used": days_with_data,
                    "hours": hours, "best_hour": None,
                    "message": "На сегодня учебное время уже закончилось. Выберите другую дату."}

    best = min(candidates, key=lambda h: (h["load_percent"], h["hour"]))
    peak = max(hours, key=lambda h: h["load_percent"])
    busy_hours = [h["hour"] for h in candidates if h["level"] == "high"]

    message = (f"Рекомендуем приезжать к {best['hour']}:00 - обычно в это время "
               f"занято около {best['load_percent']}% мест. "
               f"Пик загрузки - около {peak['hour']}:00 (~{peak['load_percent']}%).")
    if busy_hours:
        message += f" Лучше не приезжать в {busy_hours[0]}:00-{busy_hours[-1] + 1}:00: мест может не хватить."
    return {"date": target_date.isoformat(), "weekday": weekday, "days_used": days_with_data,
            "hours": hours, "best_hour": best["hour"], "message": message}
