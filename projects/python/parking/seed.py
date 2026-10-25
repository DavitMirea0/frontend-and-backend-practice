"""Заполнение базы тестовыми данными.

Создаёт зоны, места, пользователей с машинами и историю стоянок за 8 недель,
чтобы работал прогноз загрузки. Запуск:
    python seed.py            - заполнить (если база пустая)
    python seed.py --reset    - удалить всё и заполнить заново
"""
import random
import sys
from datetime import datetime, timedelta

from app import models, services
from app.database import Base, SessionLocal, engine

random.seed(42)  # чтобы данные каждый раз получались одинаковые

ZONES = [("Зона А — главный корпус", 20), ("Зона Б — лабораторный корпус", 15),
         ("Зона В — для преподавателей", 10)]

FIRST_NAMES = ["Александр", "Дмитрий", "Максим", "Иван", "Артём", "Михаил", "Никита", "Егор",
               "Анна", "Мария", "Елена", "Ольга", "Дарья", "Екатерина", "Виктория", "Ксения"]
LAST_NAMES = ["Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев", "Петров", "Соколов",
              "Михайлов", "Новиков", "Фёдоров", "Морозов", "Волков", "Алексеев", "Лебедев"]
CAR_MODELS = ["Lada Vesta", "Kia Rio", "Hyundai Solaris", "Toyota Camry", "Skoda Octavia",
              "Renault Logan", "Volkswagen Polo", "Mazda 3", "Haval Jolion", "Geely Coolray"]
PLATE_LETTERS = "АВЕКМНОРСТУХ"

# сколько машин в среднем приезжает в каждый час в будни (вес часа)
WEEKDAY_WEIGHTS = {7: 3, 8: 11, 9: 14, 10: 8, 11: 5, 12: 4, 13: 5, 14: 4, 15: 3, 16: 2, 17: 1, 18: 1}
ARRIVALS = {0: 82, 1: 82, 2: 82, 3: 82, 4: 72, 5: 28, 6: 8}  # по дням недели (0 = понедельник)


def make_plate(used):
    while True:
        plate = (random.choice(PLATE_LETTERS) + str(random.randint(100, 999))
                 + random.choice(PLATE_LETTERS) + random.choice(PLATE_LETTERS)
                 + str(random.choice([77, 99, 177, 197, 777])))
        if plate not in used:
            used.add(plate)
            return plate


def main():
    reset = "--reset" in sys.argv
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    if db.query(models.Zone).count() > 0:
        print("База уже заполнена. Для повторного заполнения: python seed.py --reset")
        return

    # зоны и места
    for name, count in ZONES:
        services.create_zone(db, name, count)
    # два места для маломобильных в зоне А
    for spot in db.query(models.Spot).filter(models.Spot.zone_id == 1, models.Spot.number <= 2):
        spot.kind = "disabled"
    db.commit()
    spots = db.query(models.Spot).filter(models.Spot.kind == "regular").all()

    # пользователи и машины
    used_plates = set()
    cars = []
    for i in range(60):
        name = f"{random.choice(LAST_NAMES)} {random.choice(FIRST_NAMES)}"
        role = "teacher" if i < 8 else ("staff" if i < 12 else "student")
        user = models.User(full_name=name, email=f"user{i + 1}@mirea.example", role=role)
        db.add(user)
        db.flush()
        car = models.Car(plate=make_plate(used_plates), model=random.choice(CAR_MODELS), owner_id=user.id)
        db.add(car)
        db.flush()
        cars.append(car)
    db.commit()

    # история стоянок: моделируем каждый день последних 8 недель
    current = services.now()
    today = current.date()
    total_sessions = 0
    for days_ago in range(56, -1, -1):
        day = today - timedelta(days=days_ago)
        n = ARRIVALS[day.weekday()] + random.randint(-6, 6)
        n = max(n, 1)
        hours = list(WEEKDAY_WEIGHTS.keys())
        weights = list(WEEKDAY_WEIGHTS.values())
        arrivals = []
        for _ in range(n):
            hour = random.choices(hours, weights)[0]
            arrivals.append(datetime(day.year, day.month, day.day, hour, random.randint(0, 59)))
        arrivals.sort()

        busy = {}  # id места -> (id машины, время выезда)
        for arrive in arrivals:
            if arrive > current:
                continue  # в будущее историю не пишем
            # освобождаем места тех, кто уже уехал
            for spot_id in [s for s, (c, t) in busy.items() if t <= arrive]:
                del busy[spot_id]
            free_spots = [s for s in spots if s.id not in busy]
            busy_cars = {c for c, t in busy.values()}
            free_cars = [c for c in cars if c.id not in busy_cars]
            if not free_spots or not free_cars:
                continue  # парковка полна
            spot = random.choice(free_spots)
            car = random.choice(free_cars)
            stay = timedelta(minutes=random.randint(60, 8 * 60))
            leave = arrive + stay
            busy[spot.id] = (car.id, leave)
            exit_time = leave if leave <= current else None  # ещё стоит
            db.add(models.ParkingSession(car_id=car.id, spot_id=spot.id,
                                         entry_time=arrive, exit_time=exit_time))
            total_sessions += 1
    db.commit()

    # несколько будущих броней для примера
    start = (current + timedelta(hours=2)).replace(minute=0, second=0)
    for i, car in enumerate(random.sample(cars, 3)):
        spot = random.choice(spots)
        try:
            services.create_reservation(db, car.plate, spot.id,
                                        start + timedelta(hours=i), start + timedelta(hours=i + 3))
        except Exception:
            db.rollback()

    print(f"Готово: зон - {len(ZONES)}, мест - {len(spots) + 2}, машин - {len(cars)}, "
          f"стоянок в истории - {total_sessions}")


if __name__ == "__main__":
    main()
