"""Проверки готовности и базовых защитных заголовков."""
from sqlalchemy.exc import OperationalError

from app.database import get_db
from app.main import app


def test_health_and_headers(client):
    for path in ("/health/live", "/health/ready"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"


def test_readiness_reports_database_failure(client):
    class BrokenDatabase:
        def execute(self, statement):
            raise OperationalError("SELECT 1", {}, Exception("private database detail"))

    app.dependency_overrides[get_db] = lambda: BrokenDatabase()
    try:
        response = client.get("/health/ready")
        assert response.status_code == 503
        assert response.json() == {"status": "unavailable"}
        assert "private" not in response.text
        assert client.get("/health/live").status_code == 200
    finally:
        app.dependency_overrides.pop(get_db, None)
