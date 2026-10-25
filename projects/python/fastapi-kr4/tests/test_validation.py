"""Тесты валидации пользовательских данных (задание 10.2)."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def valid_payload(**overrides) -> dict:
    """Возвращает корректный payload для /validation/users с возможностью перекрытия полей."""
    payload = {
        "username": "kik",
        "age": 25,
        "email": "kik@example.com",
        "password": "secret12",
        "phone": "+79001112233",
    }
    payload.update(overrides)
    return payload


class TestValidationSuccess:
    def test_valid_payload_returns_200(self):
        response = client.post("/validation/users", json=valid_payload())
        assert response.status_code == 200
        body = response.json()
        assert body["username"] == "kik"
        assert body["age"] == 25
        assert body["email"] == "kik@example.com"
        # password не должен возвращаться
        assert "password" not in body

    def test_phone_optional_defaults_to_unknown(self):
        payload = valid_payload()
        payload.pop("phone")
        response = client.post("/validation/users", json=payload)
        assert response.status_code == 200
        assert response.json()["phone"] == "Unknown"


class TestValidationErrors:
    """Каждый сбой валидации должен попадать в кастомный обработчик."""

    def test_invalid_email(self):
        response = client.post("/validation/users", json=valid_payload(email="not-an-email"))
        assert response.status_code == 422
        body = response.json()
        assert body["error_code"] == "validation_error"
        # хотя бы одна ошибка должна указывать на поле email
        assert any("email" in err["loc"] for err in body["errors"])

    def test_age_too_low(self):
        # gt=18 — значит 18 уже не подходит
        response = client.post("/validation/users", json=valid_payload(age=18))
        assert response.status_code == 422
        body = response.json()
        assert any("age" in err["loc"] for err in body["errors"])

    def test_password_too_short(self):
        response = client.post("/validation/users", json=valid_payload(password="short"))
        assert response.status_code == 422
        body = response.json()
        assert any("password" in err["loc"] for err in body["errors"])

    def test_password_too_long(self):
        response = client.post(
            "/validation/users", json=valid_payload(password="a" * 17)
        )
        assert response.status_code == 422

    def test_missing_required_field(self):
        payload = valid_payload()
        payload.pop("username")
        response = client.post("/validation/users", json=payload)
        assert response.status_code == 422
        body = response.json()
        assert body["error_code"] == "validation_error"
        assert any("username" in err["loc"] for err in body["errors"])

    def test_error_response_has_consistent_shape(self):
        """Структура ответа об ошибке должна соответствовать ValidationErrorResponse."""
        response = client.post("/validation/users", json={"username": "x"})
        body = response.json()
        assert set(body.keys()) == {"error_code", "message", "errors"}
        assert isinstance(body["errors"], list)
        for err in body["errors"]:
            assert "loc" in err and "msg" in err and "type" in err
