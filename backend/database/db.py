# db.py — SQLite database setup and connection

import sqlite3
import os

# Database file location
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'tasks.db')

def get_db():
    """Create a connection to SQLite database."""
    # sqlite3.connect() opens DB file (creates if not exists)
    conn = sqlite3.connect(DB_PATH)

    # row_factory lets us access columns by name (like a dict)
    # Without this: row[0], row[1]
    # With this:    row['title'], row['priority']
    conn.row_factory = sqlite3.Row

    return conn

def init_db():
    """Create the tasks table if it doesn't exist."""
    conn = get_db()

    # cursor executes SQL commands
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
    # AUTOINCREMENT = auto-assigns unique ID (1, 2, 3...)
    # NOT NULL = field cannot be empty
    # DEFAULT = value used if not provided

    conn.commit()  # save changes to disk
    conn.close()   # always close connection
    print("✅ Database initialized!")