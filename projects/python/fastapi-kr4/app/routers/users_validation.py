"""Эндпоинт с валидацией пользовательских данных (задание 10.2)."""
from fastapi import APIRouter

from app.schemas.user import User, UserOut

router = APIRouter(prefix="/validation", tags=["validation"])


@router.post("/users", response_model=UserOut)
def create_validated_user(user: User) -> UserOut:
    """Принимает JSON и валидирует его через Pydantic-модель User.

    При сбое валидации FastAPI вызывает RequestValidationError, который
    обрабатывается пользовательским обработчиком в app/main.py.
    """
    return UserOut(
        username=user.username,
        age=user.age,
        email=user.email,
        phone=user.phone,
    )
