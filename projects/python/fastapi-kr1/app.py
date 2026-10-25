from fastapi import FastAPI
from pydantic import BaseModel, field_validator, Field
from models import User
import re
app = FastAPI()

user = User(name="Давид Хачатрян", id=1, age = 20)
feedbacks = []

class Feedback(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    message: str = Field(min_length=10, max_length=500)
BANNED_WORDS = [r"кринж\w*", r"рофл\w*", r"вайб\w*"]


@field_validator("message")
@classmethod
def check_banned_words(cls, value: str) -> str:
        for pattern in BANNED_WORDS:
            if re.search(pattern, value, flags=re.IGNORECASE):
                raise ValueError("Использование недопустимых слов")
        return value



@app.post("/feedback")
def receive_feedback(feedback: Feedback):
    feedbacks.append(feedback)
    return {"message": f"Спасибо, {feedback.name}! Ваш отзыв сохранён."}     

@app.get("/users")
def get_user():
    return user

@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в моё приложение FastAPI!"}


class User(BaseModel):
    name: str
    age: int


class Numbers(BaseModel):
    n1:float
    n2:float

@app.post("/calculate")
def calculate(numbers: Numbers):
    return {"result":numbers.n1 + numbers.n2}


@app.post("/user")
def check_user(user: User):
    return {
        "name": user.name,
        "age": user.age,
        "is_adult": user.age >= 18,
    }
