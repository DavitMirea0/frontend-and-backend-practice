from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str

class User(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class UserWithRole(UserBase):
    password: str
    role: str = "guest" 

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = ""

class TodoCreate(TodoBase):
    pass

class TodoUpdate(TodoBase):
    completed: bool = False

class Todo(TodoBase):
    id: int
    completed: bool = False

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None