"""Асинхронные модульные тесты для /users (задание 11.2).

Используется:
- pytest-asyncio (asyncio_mode=auto в pytest.ini),
- httpx.AsyncClient + ASGITransport — обращения к приложению напрямую, без Uvicorn,
- Faker — генерация реалистичных входных данных.

Изоляция состояния обеспечивается фикстурой _reset_inmemory_users из conftest.py.
"""
import pytest
from faker import Faker
from httpx import ASGITransport, AsyncClient

from app.main import app

fake = Faker()


@pytest.fixture
async def async_client():
    """Асинхронный HTTP-клиент, ходит напрямую в ASGI-приложение."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


def make_user_payload(**overrides) -> dict:
    """Генерирует валидный payload пользователя через Faker."""
    payload = {
        "username": fake.user_name(),
        "age": fake.random_int(min=1, max=99),
    }
    payload.update(overrides)
    return payload


class TestCreateUserAsync:
    async def test_create_returns_201_and_valid_structure(self, async_client):
        payload = make_user_payload()
        response = await async_client.post("/users", json=payload)
        assert response.status_code == 201
        body = response.json()
        assert set(body.keys()) == {"id", "username", "age"}
        assert body["username"] == payload["username"]
        assert body["age"] == payload["age"]
        assert isinstance(body["id"], int) and body["id"] >= 1

    async def test_create_multiple_users_with_faker(self, async_client):
        created_ids = []
        for _ in range(5):
            response = await async_client.post("/users", json=make_user_payload())
            assert response.status_code == 201
            created_ids.append(response.json()["id"])
        # Все id должны быть уникальны
        assert len(set(created_ids)) == len(created_ids)

    async def test_create_with_boundary_age_values(self, async_client):
        # Граничные значения — у нас по схеме нет жёстких ограничений, проверяем,
        # что и крайне маленький, и большой возраст принимаются (модель — обычный int).
        for age in [0, 1, 120, 200]:
            payload = make_user_payload(age=age)
            response = await async_client.post("/users", json=payload)
            assert response.status_code == 201, f"Failed for age={age}"

    async def test_create_with_missing_field_returns_422(self, async_client):
        response = await async_client.post("/users", json={"username": fake.user_name()})
        assert response.status_code == 422


class TestGetUserAsync:
    async def test_get_existing_user_returns_200(self, async_client):
        payload = make_user_payload()
        created = (await async_client.post("/users", json=payload)).json()
        response = await async_client.get(f"/users/{created['id']}")
        assert response.status_code == 200
        assert response.json() == created

    async def test_get_missing_user_returns_404(self, async_client):
        response = await async_client.get(f"/users/{fake.random_int(min=10000, max=99999)}")
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"


class TestDeleteUserAsync:
    async def test_delete_existing_user_returns_204(self, async_client):
        created = (await async_client.post("/users", json=make_user_payload())).json()
        response = await async_client.delete(f"/users/{created['id']}")
        assert response.status_code == 204

    async def test_delete_then_get_returns_404(self, async_client):
        created = (await async_client.post("/users", json=make_user_payload())).json()
        await async_client.delete(f"/users/{created['id']}")
        response = await async_client.get(f"/users/{created['id']}")
        assert response.status_code == 404

    async def test_repeated_delete_returns_404(self, async_client):
        """Повторное удаление того же пользователя — 404 (требование из задания)."""
        created = (await async_client.post("/users", json=make_user_payload())).json()
        first = await async_client.delete(f"/users/{created['id']}")
        second = await async_client.delete(f"/users/{created['id']}")
        assert first.status_code == 204
        assert second.status_code == 404


class TestFullScenarioAsync:
    """Полный сценарий с использованием Faker и нескольких пользователей."""

    async def test_create_list_delete_flow(self, async_client):
        # Создаём 3 пользователя
        users = []
        for _ in range(3):
            response = await async_client.post("/users", json=make_user_payload())
            users.append(response.json())

        # Получаем каждого
        for u in users:
            response = await async_client.get(f"/users/{u['id']}")
            assert response.status_code == 200
            assert response.json() == u

        # Удаляем первого, остальные должны остаться доступны
        await async_client.delete(f"/users/{users[0]['id']}")
        assert (await async_client.get(f"/users/{users[0]['id']}")).status_code == 404
        assert (await async_client.get(f"/users/{users[1]['id']}")).status_code == 200
        assert (await async_client.get(f"/users/{users[2]['id']}")).status_code == 200
