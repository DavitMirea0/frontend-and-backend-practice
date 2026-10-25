"""Локальное управление доступом и резервными копиями без HTTP-маршрута повышения прав."""
import argparse
import getpass
import sqlite3
from pathlib import Path

from app import models, auth
from app.database import Base, SessionLocal, engine


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    account = commands.add_parser("account")
    account.add_argument("email")
    account.add_argument("--role", choices=["user", "operator", "admin"], default="user")
    account.add_argument("--name", default="Администратор парковки")
    backup = commands.add_parser("backup")
    backup.add_argument("destination")
    args = parser.parse_args()
    if args.command == "backup":
        if engine.dialect.name != "sqlite":
            parser.error("Для PostgreSQL используйте pg_dump")
        destination = Path(args.destination)
        if destination.exists():
            parser.error("Файл назначения уже существует")
        destination.parent.mkdir(parents=True, exist_ok=True)
        with engine.connect() as connection, sqlite3.connect(destination) as target:
            connection.connection.driver_connection.backup(target)
        print("Резервная копия создана:", destination)
        return
    password = getpass.getpass("Новый пароль (не менее 10 символов): ")
    if len(password) < 10 or len(password) > 128:
        parser.error("Длина пароля должна быть от 10 до 128 символов")
    if password != getpass.getpass("Повторите пароль: "):
        parser.error("Пароли не совпадают")
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        user = db.query(models.User).filter_by(email=args.email).first()
        if user is None:
            user = models.User(full_name=args.name, email=args.email, role="staff")
            db.add(user)
            db.flush()
        record = db.query(auth.Account).filter_by(user_id=user.id).first()
        if record is None:
            record = auth.Account(user_id=user.id)
            db.add(record)
        record.password_hash = auth.hash_password(password)
        record.access_role = args.role
        db.flush()
        db.query(auth.LoginSession).filter_by(account_id=record.id).delete()
        db.commit()
    print("Учётная запись обновлена. Старые сессии отозваны.")


if __name__ == "__main__":
    main()
