"""Тесты пользовательских исключений и их обработчиков (задание 10.1)."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestCustomExceptionA:
    """CustomExceptionA — нарушение бизнес-условия (деление на ноль)."""

    def test_divide_normal(self):
        response = client.get("/errors/divide", params={"a": 10, "b": 2})
        assert response.status_code == 200
        assert response.json() == {"a": 10, "b": 2, "result": 5}

    def test_divide_by_zero_returns_custom_status(self):
        response = client.get("/errors/divide", params={"a": 10, "b": 0})
        # CustomExceptionA имеет уникальный код состояния 418
        assert response.status_code == 418

    def test_divide_by_zero_error_format(self):
        response = client.get("/errors/divide", params={"a": 5, "b": 0})
        body = response.json()
        assert body["error_code"] == "custom_exception_a"
        assert "Делитель" in body["message"]
        assert body["details"] == {"a": 5, "b": 0}


class TestCustomExceptionB:
    """CustomExceptionB — ресурс не найден."""

    def test_get_existing_item(self):
        response = client.get("/errors/items/1")
        assert response.status_code == 200
        assert response.json()["id"] == 1

    def test_get_missing_item_returns_404(self):
        response = client.get("/errors/items/999")
        assert response.status_code == 404

    def test_missing_item_error_format(self):
        response = client.get("/errors/items/999")
        body = response.json()
        assert body["error_code"] == "resource_not_found"
        assert "999" in body["message"]
        assert body["details"] == {"item_id": 999}
