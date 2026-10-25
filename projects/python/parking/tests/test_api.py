"""Тесты основных сценариев: регистрация, въезд/выезд, брони, прогноз."""
from datetime import datetime, timedelta

from app import models
from tests.conftest import FAKE_NOW, add_car


def make_zone(client, name="Зона А", count=3):
    response = client.post("/api/zones", json={"name": name, "spots_count": count})
    assert response.status_code == 201
    return response.json()["id"]


# ---------- регистрация ----------

def test_register_user_and_car(client):
    plate = add_car(client, "а123вс777")
    assert plate == "А123ВС777"          # номер привёлся к заглавным буквам
    assert len(client.get("/api/cars").json()) == 1


def test_duplicate_email_and_plate(client):
    add_car(client, "А123ВС777", email="a@test.ru")
    again = client.post("/api/users", json={"full_name": "Пётр Петров", "email": "a@test.ru"})
    assert again.status_code == 409
    user = client.post("/api/users", json={"full_name": "Пётр Петров", "email": "p@test.ru"}).json()
    dup = client.post("/api/cars", json={"plate": "А 123 ВС 777", "owner_id": user["id"]})
    assert dup.status_code == 409         # тот же номер, только с пробелами


def test_bad_email_is_rejected(client):
    response = client.post("/api/users", json={"full_name": "Иван", "email": "не-почта"})
    assert response.status_code == 422


# ---------- зоны и статистика ----------

def test_zone_creates_spots(client):
    zone_id = make_zone(client, count=5)
    spots = client.get("/api/spots", params={"zone_id": zone_id}).json()
    assert len(spots) == 5
    assert all(s["status"] == "free" for s in spots)
    stats = client.get("/api/stats").json()
    assert stats["total"] == 5 and stats["free"] == 5


# ---------- въезд и выезд ----------

def test_enter_and_exit(client):
    make_zone(client)
    plate = add_car(client, "А111АА77")

    entry = client.post("/api/entries", json={"plate": plate})
    assert entry.status_code == 201
    assert entry.json()["spot_number"] == 1

    stats = client.get("/api/stats").json()
    assert stats["occupied"] == 1 and stats["free"] == 2

    out = client.post("/api/exits", json={"plate": plate})
    assert out.status_code == 200
    assert out.json()["exit_time"] is not None
    assert client.get("/api/stats").json()["occupied"] == 0


def test_enter_twice_and_exit_without_enter(client):
    make_zone(client)
    plate = add_car(client, "А111АА77")
    assert client.post("/api/exits", json={"plate": plate}).status_code == 409
    client.post("/api/entries", json={"plate": plate})
    assert client.post("/api/entries", json={"plate": plate}).status_code == 409


def test_unknown_car(client):
    make_zone(client)
    assert client.post("/api/entries", json={"plate": "Х999ХХ99"}).status_code == 404


def test_parking_full(client):
    make_zone(client, count=1)
    first = add_car(client, "А111АА77")
    second = add_car(client, "В222ВВ77")
    assert client.post("/api/entries", json={"plate": first}).status_code == 201
    response = client.post("/api/entries", json={"plate": second})
    assert response.status_code == 409
    assert "нет" in response.json()["detail"]


def test_disabled_spot_is_not_given_automatically(client, db):
    zone_id = make_zone(client, count=2)
    spot = db.query(models.Spot).filter_by(zone_id=zone_id, number=1).first()
    spot.kind = "disabled"
    db.commit()
    plate = add_car(client, "А111АА77")
    entry = client.post("/api/entries", json={"plate": plate}).json()
    assert entry["spot_number"] == 2


# ---------- бронирование ----------

def reserve(client, plate, spot_id, start_hours, end_hours):
    return client.post("/api/reservations", json={
        "plate": plate, "spot_id": spot_id,
        "start_time": (FAKE_NOW + timedelta(hours=start_hours)).isoformat(),
        "end_time": (FAKE_NOW + timedelta(hours=end_hours)).isoformat(),
    })


def test_reservation_ok_and_overlap(client):
    make_zone(client)
    a = add_car(client, "А111АА77")
    b = add_car(client, "В222ВВ77")
    assert reserve(client, a, 1, 1, 3).status_code == 201
    assert reserve(client, b, 1, 2, 4).status_code == 409    # пересекается по времени
    assert reserve(client, b, 1, 3, 5).status_code == 201    # встык - можно
    assert reserve(client, b, 2, 4, 6).status_code == 409    # у машины уже есть бронь на 4:00-5:00


def test_reservation_validation(client):
    make_zone(client)
    a = add_car(client, "А111АА77")
    assert reserve(client, a, 1, 3, 2).status_code == 422     # конец раньше начала
    assert reserve(client, a, 1, -5, -3).status_code == 422   # в прошлом
    assert reserve(client, a, 1, 1, 20).status_code == 422    # больше 12 часов
    assert reserve(client, a, 99, 1, 2).status_code == 404    # нет такого места


def test_cancel_reservation_frees_time(client):
    make_zone(client)
    a = add_car(client, "А111АА77")
    b = add_car(client, "В222ВВ77")
    reservation = reserve(client, a, 1, 1, 3).json()
    cancelled = client.post(f"/api/reservations/{reservation['id']}/cancel")
    assert cancelled.json()["status"] == "cancelled"
    assert client.post(f"/api/reservations/{reservation['id']}/cancel").status_code == 409
    assert reserve(client, b, 1, 1, 3).status_code == 201


def test_entry_uses_reserved_spot(client):
    make_zone(client, count=3)
    owner = add_car(client, "А111АА77")
    other = add_car(client, "В222ВВ77")
    # бронь на место №1 прямо сейчас
    assert reserve(client, owner, 1, 0, 2).status_code == 201

    # чужая машина не получает забронированное место №1
    assert client.post("/api/entries", json={"plate": other}).json()["spot_number"] == 2
    # а владелец брони - получает
    assert client.post("/api/entries", json={"plate": owner}).json()["spot_number"] == 1

    statuses = {s["number"]: s["status"] for s in client.get("/api/spots").json()}
    assert statuses == {1: "occupied", 2: "occupied", 3: "free"}


# ---------- прогноз ----------

def test_forecast_without_history(client):
    make_zone(client)
    forecast = client.get("/api/forecast").json()
    assert forecast["best_hour"] is None
    assert forecast["days_used"] == 0


def test_forecast_with_history(client, db):
    make_zone(client, count=1)
    plate = add_car(client, "А111АА77")
    car = db.query(models.Car).filter_by(plate=plate).first()
    # прошлая среда: машина стояла с 9:00 до 12:00 на единственном месте
    last_wed = datetime(2026, 9, 23)
    db.add(models.ParkingSession(car_id=car.id, spot_id=1,
                                 entry_time=last_wed.replace(hour=9),
                                 exit_time=last_wed.replace(hour=12)))
    db.commit()

    forecast = client.get("/api/forecast", params={"day": "2026-09-30"}).json()
    load = {h["hour"]: h["load_percent"] for h in forecast["hours"]}
    assert forecast["weekday"] == "среда"
    assert load[8] == 0 and load[10] == 100 and load[11] == 100 and load[12] == 0
    assert forecast["best_hour"] == 12       # сейчас 10:00, поэтому рекомендуем не раньше 11:00


def test_forecast_today_after_study_hours(client, db, monkeypatch):
    from app import services
    make_zone(client, count=1)
    plate = add_car(client, "А111АА77")
    car = db.query(models.Car).filter_by(plate=plate).first()
    db.add(models.ParkingSession(car_id=car.id, spot_id=1,
                                 entry_time=datetime(2026, 9, 23, 9), exit_time=datetime(2026, 9, 23, 12)))
    db.commit()
    monkeypatch.setattr(services, "now", lambda: datetime(2026, 9, 30, 20, 0, 0))  # 20:00
    forecast = client.get("/api/forecast", params={"day": "2026-09-30"}).json()
    assert forecast["best_hour"] is None
    assert "закончилось" in forecast["message"]
