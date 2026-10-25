"""Модели Pydantic для ответов с ошибками (задание 10.1).

Используются для согласованного форматирования ответов на ошибки во всём приложении.
"""
from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Базовая модель ответа с ошибкой."""

    error_code: str = Field(..., description="Короткий машиночитаемый код ошибки")
    message: str = Field(..., description="Понятное человеку сообщение об ошибке")
    details: dict[str, Any] | None = Field(default=None, description="Дополнительные детали")


class ValidationErrorResponse(BaseModel):
    """Модель ответа для ошибок валидации запроса."""

    error_code: str = "validation_error"
    message: str = "Ошибка валидации входных данных"
    errors: list[dict[str, Any]] = Field(default_factory=list)
