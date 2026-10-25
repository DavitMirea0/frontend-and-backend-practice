"""Пароли PBKDF2 и отзывные серверные сессии с ограниченным сроком."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Session

from .database import Base, get_db


class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    password_hash = Column(String(256), nullable=False)
    access_role = Column(String(20), nullable=False, default="user")


class LoginSession(Base):
    __tablename__ = "login_sessions"
    token_hash = Column(String(64), primary_key=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600_000).hex()
    return salt + ":" + digest


def verify_password(password, stored):
    salt, expected = stored.split(":")
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600_000).hex()
    return hmac.compare_digest(actual, expected)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


bearer = HTTPBearer(auto_error=False)


def current_account(credentials: HTTPAuthorizationCredentials = Depends(bearer),
                    db: Session = Depends(get_db)):
    if credentials is None:
        raise HTTPException(401, "Войдите в систему", headers={"WWW-Authenticate": "Bearer"})
    session = db.get(LoginSession, token_hash(credentials.credentials))
    if session is None or session.expires_at <= datetime.now():
        raise HTTPException(401, "Сессия истекла. Войдите снова")
    account = db.get(Account, session.account_id)
    if account is None:
        raise HTTPException(401, "Учётная запись не найдена")
    return account


def administrator(account=Depends(current_account)):
    if account.access_role != "admin":
        raise HTTPException(403, "Требуются права администратора")
    return account


def operator(account=Depends(current_account)):
    if account.access_role not in ("admin", "operator"):
        raise HTTPException(403, "Требуются права охраны или администратора")
    return account


def check_owner(account, owner_id):
    if account.access_role == "user" and account.user_id != owner_id:
        raise HTTPException(403, "Нет доступа к чужим данным")
