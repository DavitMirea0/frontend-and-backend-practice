"""Эндпоинты для демонстрации обработки пользовательских исключений (задание 10.1)."""
from fastapi import APIRouter

from app.exceptions import CustomExceptionA, CustomExceptionB
from app.schemas.error import ErrorResponse

router = APIRouter(prefix="/errors", tags=["errors-demo"])

# Простое in-memory хранилище для демонстрации
_items: dict[int, dict] = {1: {"id": 1, "name": "first item"}}


@router.get(
    "/divide",
    responses={418: {"model": ErrorResponse, "description": "Бизнес-условие нарушено"}},
)
def divide(a: float, b: float) -> dict:
    """Демонстрирует CustomExceptionA: бросается при делении на ноль."""
    if b == 0:
        raise CustomExceptionA(
            message="Делитель не может быть равен нулю",
            details={"a": a, "b": b},
        )
    return {"a": a, "b": b, "result": a / b}


@router.get(
    "/items/{item_id}",
    responses={404: {"model": ErrorResponse, "description": "Ресурс не найден"}},
)
def get_item(item_id: int) -> dict:
    """Демонстрирует CustomExceptionB: бросается, когда ресурс не найден."""
    if item_id not in _items:
        raise CustomExceptionB(
            message=f"Item с id={item_id} не найден",
            details={"item_id": item_id},
        )
    return _items[item_id]
