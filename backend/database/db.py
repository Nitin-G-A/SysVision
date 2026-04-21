import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'tasks.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()

    # Tasks table (same as before)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            description TEXT,
            priority    INTEGER NOT NULL DEFAULT 2,
            status      TEXT    DEFAULT 'pending',
            due_date    TEXT,
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    ''')

    # NEW: Users table for authentication
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            created_at    TEXT    DEFAULT (datetime('now'))
        )
    ''')
    # UNIQUE = no two users can have same username or email

    conn.commit()
    conn.close()
    print("✅ Database initialized with users table!")