import sqlite3
from typing import Optional
from contextlib import contextmanager

DATABASE_URL = "app.db"

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row 
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_users_table():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.commit()
        print("Table 'users' created successfully")

def init_todos_table():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER DEFAULT 0
            )
        """)
        conn.commit()
        print("Table 'todos' created successfully")

def init_all_tables():
    init_users_table()
    init_todos_table()

def create_user_in_db(username: str, password: str) -> dict:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, password)
        )
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = LAST_INSERT_ROWID()")
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_username(username: str) -> Optional[dict]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return dict(row) if row else None

def create_todo_in_db(title: str, description: str = "") -> dict:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO todos (title, description, completed) VALUES (?, ?, ?)",
            (title, description, 0)
        )
        conn.commit()
        cursor.execute("SELECT * FROM todos WHERE id = LAST_INSERT_ROWID()")
        row = cursor.fetchone()
        return dict(row) if row else None

def get_todo_by_id(todo_id: int) -> Optional[dict]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_all_todos() -> list:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM todos")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def update_todo_in_db(todo_id: int, title: str, description: str, completed: bool) -> Optional[dict]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE todos 
               SET title = ?, description = ?, completed = ? 
               WHERE id = ?""",
            (title, description, 1 if completed else 0, todo_id)
        )
        conn.commit()
        return get_todo_by_id(todo_id)

def delete_todo_from_db(todo_id: int) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
        conn.commit()
        return cursor.rowcount > 0