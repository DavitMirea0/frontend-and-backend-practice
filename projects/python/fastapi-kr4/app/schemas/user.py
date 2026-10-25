"""Pydantic-схемы User (задание 10.2)."""
from typing import Optional

from pydantic import BaseModel, EmailStr, conint, constr


class User(BaseModel):
    """Модель пользовательских данных с валидацией (точно по спецификации задания)."""

    username: str
    age: conint(gt=18)  # type: ignore[valid-type]
    email: EmailStr
    password: constr(min_length=8, max_length=16)  # type: ignore[valid-type]
    phone: Optional[str] = "Unknown"


class UserOut(BaseModel):
    """Безопасный ответ — без пароля."""

    username: str
    age: int
    email: EmailStr
    phone: Optional[str] = "Unknown"
