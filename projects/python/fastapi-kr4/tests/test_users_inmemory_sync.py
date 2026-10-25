"""Модульные тесты для /users — синхронные, через TestClient (задание 11.1).

Изоляция состояния обеспечивается фикстурой _reset_inmemory_users из conftest.py.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestCreateUser:
    def test_create_returns_201(self):
        response = client.post("/users", json={"username": "alice", "age": 30})
        assert response.status_code == 201

    def test_create_response_structure(self):
        response = client.post("/users", json={"username": "bob", "age": 25})
        body = response.json()
        assert set(body.keys()) == {"id", "username", "age"}
        assert body["username"] == "bob"
        assert body["age"] == 25
        assert isinstance(body["id"], int)
        assert body["id"] >= 1

    def test_create_assigns_unique_incrementing_ids(self):
        r1 = client.post("/users", json={"username": "u1", "age": 20})
        r2 = client.post("/users", json={"username": "u2", "age": 21})
        assert r1.json()["id"] != r2.json()["id"]
        assert r2.json()["id"] == r1.json()["id"] + 1

    def test_create_with_missing_field_returns_422(self):
        response = client.post("/users", json={"username": "no_age"})
        assert response.status_code == 422


class TestGetUser:
    def test_get_existing_user(self):
        created = client.post("/users", json={"username": "carol", "age": 28}).json()
        response = client.get(f"/users/{created['id']}")
        assert response.status_code == 200
        assert response.json() == created

    def test_get_missing_user_returns_404(self):
        response = client.get("/users/9999")
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"


class TestDeleteUser:
    def test_delete_existing_user_returns_204(self):
        created = client.post("/users", json={"username": "dave", "age": 35}).json()
        response = client.delete(f"/users/{created['id']}")
        assert response.status_code == 204
        # тело пустое для 204
        assert response.content == b""

    def test_user_is_gone_after_delete(self):
        created = client.post("/users", json={"username": "eve", "age": 40}).json()
        client.delete(f"/users/{created['id']}")
        response = client.get(f"/users/{created['id']}")
        assert response.status_code == 404

    def test_delete_missing_user_returns_404(self):
        response = client.delete("/users/9999")
        assert response.status_code == 404

    def test_delete_twice_returns_404_second_time(self):
        created = client.post("/users", json={"username": "frank", "age": 45}).json()
        first = client.delete(f"/users/{created['id']}")
        second = client.delete(f"/users/{created['id']}")
        assert first.status_code == 204
        assert second.status_code == 404


class TestStateIsolation:
    """Проверяем, что фикстура очистки реально работает между тестами."""

    def test_first_state_is_empty(self):
        # Если фикстура очистки работает, id должен снова начинаться с 1
        response = client.post("/users", json={"username": "first", "age": 20})
        assert response.json()["id"] == 1

    def test_second_state_is_also_empty(self):
        response = client.post("/users", json={"username": "again", "age": 21})
        assert response.json()["id"] == 1
