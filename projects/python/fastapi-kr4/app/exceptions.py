"""Пользовательские классы исключений (задание 10.1).

Каждое исключение имеет уникальный HTTP-код состояния и сообщение об ошибке.
"""


class CustomExceptionA(Exception):
    """Бросается, когда не выполнено бизнес-условие (например, отрицательное значение)."""

    status_code: int = 418  # I'm a teapot — нарочито уникальный код
    error_code: str = "custom_exception_a"
    default_message: str = "Бизнес-условие A не выполнено"

    def __init__(self, message: str | None = None, details: dict | None = None) -> None:
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)


class CustomExceptionB(Exception):
    """Бросается, когда запрошенный ресурс не найден."""

    status_code: int = 404
    error_code: str = "resource_not_found"
    default_message: str = "Ресурс не найден"

    def __init__(self, message: str | None = None, details: dict | None = None) -> None:
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)
