"""Общие фикстуры pytest."""
import pytest

from app.routers import users_inmemory


@pytest.fixture(autouse=True)
def _reset_inmemory_users():
    """Гарантируем чистое состояние in-memory словаря до и после каждого теста.

    Используется во всех тестах, относящихся к /users (задания 11.1 и 11.2).
    autouse=True — фикстура применяется ко всем тестам, что безопасно: на тесты
    других роутеров она не влияет (просто очищает несвязанный словарь).
    """
    users_inmemory.reset_state()
    yield
    users_inmemory.reset_state()
