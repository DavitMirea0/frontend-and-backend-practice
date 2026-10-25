from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app import auth, models
from app.main import app


@pytest.fixture
def anonymous():
    with TestClient(app) as client:
        yield client


def signup(client, email):
    data = {"full_name": "Тестовый пользователь", "email": email, "password": "TestPassword123"}
    response = client.post("/api/auth/register", json=data)
    assert response.status_code == 201
    token = client.post("/api/auth/login", json={"email": email, "password": data["password"]}).json()["access_token"]
    return response.json()["id"], {"Authorization": "Bearer " + token}


def test_anonymous_denied_and_bad_credentials(anonymous):
    assert anonymous.get("/api/users").status_code == 401
    assert anonymous.post("/api/entries", json={"plate": "А111АА77"}).status_code == 401
    assert anonymous.post("/api/auth/login", json={"email": "none@test.ru", "password": "wrong"}).status_code == 401


def test_password_session_expiry_and_logout(anonymous, db):
    uid, headers = signup(anonymous, "one@test.ru")
    account = db.query(auth.Account).filter_by(user_id=uid).one()
    assert account.password_hash != "TestPassword123"
    assert auth.verify_password("TestPassword123", account.password_hash)
    session = db.query(auth.LoginSession).one()
    assert session.token_hash != headers["Authorization"].split()[1]
    assert anonymous.get("/api/auth/me", headers=headers).status_code == 200
    session.expires_at = datetime.now() - timedelta(seconds=1)
    db.commit()
    assert anonymous.get("/api/auth/me", headers=headers).status_code == 401
    token = anonymous.post("/api/auth/login", json={"email": "one@test.ru", "password": "TestPassword123"}).json()["access_token"]
    headers = {"Authorization": "Bearer " + token}
    assert anonymous.post("/api/auth/logout", headers=headers).status_code == 200
    assert anonymous.get("/api/auth/me", headers=headers).status_code == 401


def test_roles_and_owner_isolation(anonymous, db):
    first, a = signup(anonymous, "a@test.ru")
    second, b = signup(anonymous, "b@test.ru")
    assert anonymous.post("/api/zones", headers=a, json={"name": "Зона", "spots_count": 2}).status_code == 403
    car = {"plate": "А111АА77", "owner_id": first}
    assert anonymous.post("/api/cars", headers=b, json=car).status_code == 403
    assert anonymous.post("/api/cars", headers=a, json=car).status_code == 201
    assert anonymous.get("/api/cars", headers=b).json() == []
    assert anonymous.post("/api/entries", headers=a, json={"plate": car["plate"]}).status_code == 403
    record = db.query(auth.Account).filter_by(user_id=second).one()
    record.access_role = "admin"
    db.commit()
    assert anonymous.post("/api/zones", headers=b, json={"name": "Зона", "spots_count": 2}).status_code == 201
    start = datetime.now() + timedelta(hours=1)
    payload = {"plate": car["plate"], "spot_id": 1, "start_time": start.isoformat(), "end_time": (start + timedelta(hours=1)).isoformat()}
    reservation = anonymous.post("/api/reservations", headers=a, json=payload)
    assert reservation.status_code == 201
    record.access_role = "user"
    db.commit()
    assert anonymous.post("/api/reservations", headers=b, json=payload).status_code == 403
    assert anonymous.get("/api/reservations", headers=b).json() == []
    assert anonymous.post(f"/api/reservations/{reservation.json()['id']}/cancel", headers=b).status_code == 403


def test_register_cannot_grant_admin(anonymous, db):
    uid, _ = signup(anonymous, "normal@test.ru")
    assert db.query(auth.Account).filter_by(user_id=uid).one().access_role == "user"
