import os
import secrets
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

# Импорты из наших модулей
from database import init_all_tables, create_user_in_db, get_user_by_username
from database import create_todo_in_db, get_todo_by_id, get_all_todos, update_todo_in_db, delete_todo_from_db
from models import User, UserInDB, TodoCreate, TodoUpdate, Todo
from rbac import create_rbac_routes, user_roles_db, ROLE_ADMIN, ROLE_USER, ROLE_GUEST

# Загрузка переменных окружения
load_dotenv()

# ================= CONFIGURATION =================
MODE = os.getenv("MODE", "DEV")
if MODE not in ("DEV", "PROD"):
    raise ValueError("Invalid MODE. Must be 'DEV' or 'PROD'.")

DOCS_USER = os.getenv("DOCS_USER", "admin")
DOCS_PASSWORD = os.getenv("DOCS_PASSWORD", "secret")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_jwt_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ================= APP & RATE LIMITING =================
app = FastAPI(title="Server Apps Tech - KR3", docs_url=None, redoc_url=None, openapi_url=None)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests"})

# ================= Инициализация БД =================
init_all_tables()

# ================= PYDANTIC MODELS =================
class UserInDB(UserInDB):
    role: str = ROLE_GUEST

# ================= DB & SECURITY =================
fake_users_db: dict[str, UserInDB] = {}
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
basic_security = HTTPBasic()
bearer_security = HTTPBearer()

# ================= AUTH DEPENDENCIES =================

def auth_user(credentials: HTTPBasicCredentials = Depends(basic_security)) -> UserInDB:
    user = fake_users_db.get(credentials.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"}
        )
    if not secrets.compare_digest(credentials.username, user.username):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"}
        )
    if not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"}
        )
    return user

def authenticate_docs(credentials: HTTPBasicCredentials = Depends(basic_security)):
    if not secrets.compare_digest(credentials.username, DOCS_USER) or \
       not secrets.compare_digest(credentials.password, DOCS_PASSWORD):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid docs credentials",
            headers={"WWW-Authenticate": "Basic"}
        )

# ================= DOCS ROUTING =================
if MODE == "DEV":
    @app.get("/docs", dependencies=[Depends(authenticate_docs)], include_in_schema=False)
    async def swagger_ui():
        return get_swagger_ui_html(openapi_url="/openapi.json", title="API Docs")

    @app.get("/openapi.json", dependencies=[Depends(authenticate_docs)], include_in_schema=False)
    async def openapi_schema():
        return app.openapi()

    @app.get("/redoc", include_in_schema=False)
    async def hide_redoc():
        raise HTTPException(status_code=404, detail="Not Found")

elif MODE == "PROD":
    @app.get("/docs", include_in_schema=False)
    @app.get("/openapi.json", include_in_schema=False)
    @app.get("/redoc", include_in_schema=False)
    async def hide_all_docs():
        raise HTTPException(status_code=404, detail="Not Found")

# ================= JWT HELPERS =================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_jwt_user(token: str = Depends(bearer_security)) -> str:
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ================= ENDPOINTS - Задания 6.2, 6.4, 6.5 =================

@app.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("1/minute")
async def register_user(request: Request, user_data: User):
    if user_data.username in fake_users_db:
        raise HTTPException(status_code=409, detail="User already exists")
    
    hashed_pwd = pwd_context.hash(user_data.password)
    new_user = UserInDB(username=user_data.username, hashed_password=hashed_pwd)
    fake_users_db[user_data.username] = new_user
    return {"message": "New user created"}

@app.get("/login")
async def login_basic(user: UserInDB = Depends(auth_user)):
    return {"message": f"Welcome, {user.username}!"}

@app.post("/login")
@limiter.limit("5/minute")
async def login_jwt(request: Request, login_data: User):
    user = fake_users_db.get(login_data.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not secrets.compare_digest(login_data.username, user.username):
        raise HTTPException(status_code=401, detail="Authorization failed")
    if not pwd_context.verify(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Authorization failed")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/protected_resource")
async def protected_route(current_user: str = Depends(get_current_jwt_user)):
    return {"message": "Access granted"}

# ================= Задание 8.1 - Регистрация с SQLite =================

@app.post("/db/register", status_code=status.HTTP_201_CREATED)
async def register_user_db(user_data: User):
    """Регистрация пользователя с сохранением в SQLite (Задание 8.1)"""
    existing_user = get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")
    
    # В реальном приложении пароль нужно хешировать!
    created_user = create_user_in_db(user_data.username, user_data.password)
    return {"message": "User registered successfully", "user": created_user}

# ================= Задание 8.2 - CRUD для Todo =================

@app.post("/todos", status_code=status.HTTP_201_CREATED)
async def create_todo(todo: TodoCreate):
    """Создание нового Todo элемента"""
    created_todo = create_todo_in_db(todo.title, todo.description)
    return created_todo

@app.get("/todos")
async def get_todos():
    """Получение всех Todo элементов"""
    return get_all_todos()

@app.get("/todos/{todo_id}")
async def get_todo(todo_id: int):
    """Получение Todo по ID"""
    todo = get_todo_by_id(todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/todos/{todo_id}")
async def update_todo(todo_id: int, todo: TodoUpdate):
    """Обновление Todo элемента"""
    updated_todo = update_todo_in_db(todo_id, todo.title, todo.description, todo.completed)
    if not updated_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated_todo

@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: int):
    """Удаление Todo элемента"""
    success = delete_todo_from_db(todo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": f"Todo {todo_id} deleted successfully"}

# ================= Задание 7.1 - RBAC =================

# Добавляем RBAC маршруты
create_rbac_routes(app)

# Эндпоинт для назначения ролей (только для демонстрации)
@app.post("/rbac/assign-role/{username}/{role}")
async def assign_role(username: str, role: str):
    """Назначение роли пользователю (для тестирования)"""
    if role not in [ROLE_ADMIN, ROLE_USER, ROLE_GUEST]:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {ROLE_ADMIN}, {ROLE_USER}, {ROLE_GUEST}")
    
    user_roles_db[username] = role
    return {"message": f"Role {role} assigned to {username}"}

# ================= Root endpoint =================

@app.get("/")
async def root():
    return {
        "message": "FastAPI KR3 - All assignments completed",
        "assignments": {
            "6.1-6.5": "Basic Auth, JWT, Rate Limiting",
            "7.1": "Role-Based Access Control (RBAC)",
            "8.1": "SQLite Integration - Users",
            "8.2": "CRUD Operations - Todos"
        },
        "docs": "/docs (DEV mode only with auth)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)