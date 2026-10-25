"""Общие настройки для тестов: отдельная временная база и «замороженное» время."""
import os
import tempfile
from datetime import datetime

# ВАЖНО: переменную нужно задать до импорта приложения
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = "sqlite:///" + _tmp.name

import pytest
from fastapi.testclient import TestClient

from app import services
from app.database import Base, SessionLocal, engine
from app.main import app, forecast_cache
from app.auth import current_account
from types import SimpleNamespace

# «сейчас» в тестах - среда, 30 сентября 2026, 10:00
FAKE_NOW = datetime(2026, 9, 30, 10, 0, 0)


@pytest.fixture(autouse=True)
def clean_db(monkeypatch):
    """Перед каждым тестом пересоздаём таблицы и фиксируем время."""
    forecast_cache.clear()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    monkeypatch.setattr(services, "now", lambda: FAKE_NOW)
    yield


@pytest.fixture
def client():
    app.dependency_overrides[current_account] = lambda: SimpleNamespace(access_role="admin", user_id=None)
    yield TestClient(app)
    app.dependency_overrides.pop(current_account, None)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def add_car(client, plate, email=None, name="Иванов Иван"):
    """Вспомогательная функция: создать пользователя и машину, вернуть госномер."""
    email = email or f"{plate.lower()}@test.ru"
    user = client.post("/api/users", json={"full_name": name, "email": email}).json()
    car = client.post("/api/cars", json={"plate": plate, "owner_id": user["id"]})
    assert car.status_code == 201, car.text
    return car.json()["plate"]
