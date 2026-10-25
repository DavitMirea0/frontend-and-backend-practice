"""In-memory CRUD пользователей (для заданий 11.1 и 11.2).

Точно по образцу из методички. Используется для модульных и асинхронных тестов.
"""
from itertools import count
from threading import Lock

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users-inmemory"])

# In-memory "БД" и генератор id
db: dict[int, dict] = {}
_id_seq = count(start=1)
_id_lock = Lock()


def next_user_id() -> int:
    with _id_lock:
        return next(_id_seq)


def reset_state() -> None:
    """Сбросить состояние in-memory хранилища. Используется в тестах."""
    global _id_seq
    db.clear()
    _id_seq = count(start=1)


class UserIn(BaseModel):
    username: str
    age: int


class UserOut(BaseModel):
    id: int
    username: str
    age: int


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: UserIn) -> dict:
    user_id = next_user_id()
    db[user_id] = user.model_dump()
    return {"id": user_id, **db[user_id]}


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int) -> dict:
    if user_id not in db:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user_id, **db[user_id]}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int) -> Response:
    if db.pop(user_id, None) is None:
        raise HTTPException(status_code=404, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
