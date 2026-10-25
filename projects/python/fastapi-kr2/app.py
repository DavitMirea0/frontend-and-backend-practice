import uuid
import hmac
import hashlib
import time
import re
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Cookie, Response, Header, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

app = FastAPI(title="КР2 — FastAPI")
SECRET_KEY = "REPLACE_ME"
sessions_simple: dict[str, str] = {}
fake_users_db = {
    "user123": {
        "username": "user123",
        "password": "password123",
        "name": "Иван Иванов",
        "email": "ivan@example.com",
    },
    "admin": {
        "username": "admin",
        "password": "admin",
        "name": "Администратор",
        "email": "admin@example.com",
    },
}

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    age: Optional[int] = Field(default=None, gt=0)
    is_subscribed: Optional[bool] = None


@app.post("/create_user")
def create_user(user: UserCreate):
    return user


sample_products = [
    {"product_id": 123, "name": "Smartphone", "category": "Electronics", "price": 599.99},
    {"product_id": 456, "name": "Phone Case", "category": "Accessories", "price": 19.99},
    {"product_id": 789, "name": "Iphone", "category": "Electronics", "price": 1299.99},
    {"product_id": 101, "name": "Headphones", "category": "Accessories", "price": 99.99},
    {"product_id": 202, "name": "Smartwatch", "category": "Electronics", "price": 299.99},
]


@app.get("/product/{product_id}")
def get_product(product_id: int):
    for product in sample_products:
        if product["product_id"] == product_id:
            return product
    raise HTTPException(status_code=404, detail="Product not found")


@app.get("/products/search")
def search_products(
    keyword: str,
    category: Optional[str] = None,
    limit: int = 10,
):
    results = []
    for product in sample_products:
        # Поиск по ключевому слову (без учёта регистра) в названии
        if keyword.lower() in product["name"].lower():
            # Фильтрация по категории, если указана
            if category is None or product["category"].lower() == category.lower():
                results.append(product)
    return results[:limit]

class LoginData(BaseModel):
    username: str
    password: str


@app.post("/login")
def login(data: LoginData, response: Response):
    user = fake_users_db.get(data.username)
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = str(uuid.uuid4())
    sessions_simple[token] = data.username

    # Устанавливаем httponly cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=False,  # для тестирования
        max_age=3600,
    )
    return {"message": "Login successful"}


@app.get("/user")
def get_user(session_token: Optional[str] = Cookie(default=None)):
    if session_token is None or session_token not in sessions_simple:
        raise HTTPException(status_code=401, detail="Unauthorized")

    username = sessions_simple[session_token]
    user = fake_users_db[username]
    return {
        "username": user["username"],
        "name": user["name"],
        "email": user["email"],
    }

def make_signature(data: str) -> str:
    return hmac.new(
        SECRET_KEY.encode(), data.encode(), hashlib.sha256
    ).hexdigest()


def verify_signature(data: str, signature: str) -> bool:
    expected = make_signature(data)
    return hmac.compare_digest(expected, signature)


@app.post("/login_signed")
def login_signed(data: LoginData, response: Response):
    user = fake_users_db.get(data.username)
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(uuid.uuid4())
    signature = make_signature(user_id)
    token_value = f"{user_id}.{signature}"

    sessions_simple[user_id] = data.username

    response.set_cookie(
        key="session_token",
        value=token_value,
        httponly=True,
        secure=False,
        max_age=3600,
    )
    return {"message": "Login successful (signed)"}


@app.get("/profile_signed")
def profile_signed(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
):
    if not session_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    parts = session_token.rsplit(".", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user_id, signature = parts
    if not verify_signature(user_id, signature):
        raise HTTPException(status_code=401, detail="Unauthorized")

    username = sessions_simple.get(user_id)
    if not username:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = fake_users_db[username]
    return {
        "username": user["username"],
        "name": user["name"],
        "email": user["email"],
    }

SESSION_TIMEOUT = 300       # 5 минут
SESSION_RENEW_AFTER = 180   # 3 минуты


def make_session_token(user_id: str, ts: float) -> str:
    payload = f"{user_id}.{int(ts)}"
    sig = make_signature(payload)
    return f"{user_id}.{int(ts)}.{sig}"


def parse_session_token(token: str):
    parts = token.split(".")
    if len(parts) != 3:
        return None

    user_id, ts_str, signature = parts

    # Проверяем формат UUID
    try:
        uuid.UUID(user_id)
    except ValueError:
        return None

    # Проверяем timestamp
    try:
        ts = int(ts_str)
    except ValueError:
        return None

    # Проверяем подпись
    payload = f"{user_id}.{ts_str}"
    if not verify_signature(payload, signature):
        return None

    return user_id, ts


@app.post("/login_session")
def login_session(data: LoginData, response: Response):
    """Задание 5.3 — Логин с динамической сессией."""
    user = fake_users_db.get(data.username)
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(uuid.uuid4())
    now = time.time()
    token_value = make_session_token(user_id, now)

    # Сохраняем маппинг user_id -> username
    sessions_simple[user_id] = data.username

    response.set_cookie(
        key="session_token",
        value=token_value,
        httponly=True,
        secure=False,
        max_age=SESSION_TIMEOUT,
    )
    return {"message": "Login successful (session)"}


@app.get("/profile")
def profile_session(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
):
    """Задание 5.3 — Защищённый маршрут с динамическим продлением сессии."""
    if not session_token:
        response.status_code = 401
        return {"message": "Unauthorized"}

    parsed = parse_session_token(session_token)
    if parsed is None:
        response.status_code = 401
        return {"message": "Invalid session"}

    user_id, last_activity = parsed
    now = time.time()
    elapsed = now - last_activity

    # Сессия истекла (прошло >= 5 минут)
    if elapsed >= SESSION_TIMEOUT:
        response.status_code = 401
        return {"message": "Session expired"}

    username = sessions_simple.get(user_id)
    if not username:
        response.status_code = 401
        return {"message": "Invalid session"}

    user = fake_users_db[username]

    # Решаем, нужно ли обновлять cookie
    if SESSION_RENEW_AFTER <= elapsed < SESSION_TIMEOUT:
        # Прошло >= 3 и < 5 минут — обновляем cookie
        new_token = make_session_token(user_id, now)
        response.set_cookie(
            key="session_token",
            value=new_token,
            httponly=True,
            secure=False,
            max_age=SESSION_TIMEOUT,
        )
    # Если < 3 минут — cookie НЕ обновляется

    return {
        "username": user["username"],
        "name": user["name"],
        "email": user["email"],
    }


ACCEPT_LANG_PATTERN = re.compile(
    r"^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*(,\s*[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*(;\s*q\s*=\s*(0(\.\d{0,3})?|1(\.0{0,3})?))?)*$"
)


@app.get("/headers")
def get_headers(
    user_agent: Optional[str] = Header(default=None),
    accept_language: Optional[str] = Header(default=None),
):
    if not user_agent:
        raise HTTPException(status_code=400, detail="Missing header: User-Agent")
    if not accept_language:
        raise HTTPException(status_code=400, detail="Missing header: Accept-Language")

    # Опциональная проверка формата Accept-Language
    if not ACCEPT_LANG_PATTERN.match(accept_language):
        raise HTTPException(
            status_code=400,
            detail="Invalid Accept-Language format",
        )

    return {
        "User-Agent": user_agent,
        "Accept-Language": accept_language,
    }

    
class CommonHeaders(BaseModel):
    user_agent: str = Field(alias="user-agent")
    accept_language: str = Field(alias="accept-language")

    model_config = {"populate_by_name": True}


def get_common_headers(request: Request) -> CommonHeaders:
    """Извлекает и валидирует заголовки из запроса."""
    ua = request.headers.get("user-agent")
    al = request.headers.get("accept-language")

    if not ua:
        raise HTTPException(status_code=400, detail="Missing header: User-Agent")
    if not al:
        raise HTTPException(status_code=400, detail="Missing header: Accept-Language")

    # Опциональная проверка формата
    if not ACCEPT_LANG_PATTERN.match(al):
        raise HTTPException(status_code=400, detail="Invalid Accept-Language format")

    return CommonHeaders(**{"user-agent": ua, "accept-language": al})


@app.get("/headers2")
def get_headers_v2(request: Request):
    """Задание 5.5 — маршрут /headers с моделью CommonHeaders."""
    headers = get_common_headers(request)
    return {
        "User-Agent": headers.user_agent,
        "Accept-Language": headers.accept_language,
    }


@app.get("/info")
def get_info(request: Request, response: Response):
    """Задание 5.5 — маршрут /info с X-Server-Time."""
    headers = get_common_headers(request)

    # Добавляем заголовок ответа X-Server-Time
    server_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    response.headers["X-Server-Time"] = server_time

    return {
        "message": "Добро пожаловать! Ваши заголовки успешно обработаны.",
        "headers": {
            "User-Agent": headers.user_agent,
            "Accept-Language": headers.accept_language,
        },
    }
