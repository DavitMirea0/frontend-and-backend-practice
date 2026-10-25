"""Точка входа FastAPI-приложения.

Объединяет все задания контрольной работы №4:
- 9.1  — роутер /products (миграции через Alembic).
- 10.1 — роутер /errors с пользовательскими исключениями и обработчиками.
- 10.2 — роутер /validation с валидацией Pydantic и кастомной обработкой ошибок валидации.
- 11.1 и 11.2 — роутер /users с in-memory хранилищем для тестов.
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.exceptions import CustomExceptionA, CustomExceptionB
from app.routers import errors_demo, products, users_inmemory, users_validation
from app.schemas.error import ErrorResponse, ValidationErrorResponse

app = FastAPI(
    title="Контрольная работа №4 — Технологии разработки серверных приложений",
    description="Объединённое решение по заданиям 9.1, 10.1, 10.2, 11.1, 11.2",
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# Обработчики пользовательских исключений (задание 10.1)
# ---------------------------------------------------------------------------
@app.exception_handler(CustomExceptionA)
async def handle_custom_exception_a(request: Request, exc: CustomExceptionA) -> JSONResponse:
    # В реальном проекте здесь был бы logger.error, а не print (см. примечание к 10.1)
    print(f"[CustomExceptionA] {request.method} {request.url.path}: {exc.message}")
    payload = ErrorResponse(
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.exception_handler(CustomExceptionB)
async def handle_custom_exception_b(request: Request, exc: CustomExceptionB) -> JSONResponse:
    print(f"[CustomExceptionB] {request.method} {request.url.path}: {exc.message}")
    payload = ErrorResponse(
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


# ---------------------------------------------------------------------------
# Обработчик ошибок валидации Pydantic (задание 10.2)
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    print(f"[ValidationError] {request.method} {request.url.path}: {exc.errors()}")
    # Превращаем ошибки в JSON-сериализуемый вид (убираем нестандартные объекты)
    serialized_errors = []
    for err in exc.errors():
        serialized_errors.append(
            {
                "loc": list(err.get("loc", [])),
                "msg": err.get("msg", ""),
                "type": err.get("type", ""),
            }
        )
    payload = ValidationErrorResponse(errors=serialized_errors)
    return JSONResponse(status_code=422, content=payload.model_dump())


# ---------------------------------------------------------------------------
# Подключение роутеров
# ---------------------------------------------------------------------------
app.include_router(products.router)
app.include_router(errors_demo.router)
app.include_router(users_validation.router)
app.include_router(users_inmemory.router)


@app.get("/", tags=["root"])
def root() -> dict:
    return {
        "message": "Контрольная работа №4. Открой /docs для Swagger UI.",
        "tasks": {
            "9.1": "/products",
            "10.1": "/errors",
            "10.2": "/validation/users",
            "11.x": "/users",
        },
    }
