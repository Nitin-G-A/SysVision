# SysVision — Real-Time OS Intelligence Dashboard

> A full-stack system monitoring dashboard with live CPU/RAM tracking, process management, AES-256 file encryption, priority-based task scheduling, and JWT authentication.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Flask](https://img.shields.io/badge/Flask-3.1-black?style=flat-square&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)
![JWT](https://img.shields.io/badge/JWT-Auth-orange?style=flat-square)
![AES-256](https://img.shields.io/badge/AES--256-Encryption-green?style=flat-square)

---

## Live Demo

| Module | Preview |
|--------|---------|
| Real-time CPU & RAM charts | Line chart + per-core bar chart, updates every 2s |
| Process Manager | 257 live processes, sort by CPU/RAM, kill button |
| File Vault | AES-256 encrypt/decrypt any file → downloads `.vault` |
| Task Scheduler | Priority Queue — HIGH tasks always shown first |
| Authentication | JWT login/register with bcrypt password hashing |

---

## Features

### Dashboard
- Real-time CPU usage % with 20-point history line chart
- Per-core CPU usage bar chart (12 cores detected)
- RAM usage (used/free/total in GB)
- Disk storage monitoring
- Auto-refreshes every 2 seconds

### Process Manager
- Lists all running OS processes (257 on test machine)
- Sort by CPU % or RAM %
- Search by process name (real-time filter)
- Kill any process (sends SIGTERM signal)

### File Vault
- AES-256-CBC encryption via Python `cryptography.fernet`
- Auto-generates and stores 256-bit secret key
- Encrypt any file → downloads as `.vault`
- Decrypt `.vault` → restores original file perfectly
- HMAC-SHA256 integrity verification

### Task Scheduler
- Add tasks with title, description, priority, due date
- Priority Queue implemented with Python `heapq` (min-heap)
- Priority 1 (HIGH) always shown before Priority 2/3
- Mark complete, undo, delete
- SQLite persistence — survives server restarts

### Authentication
- Register/Login with JWT tokens (24-hour expiry)
- bcrypt password hashing with random salt
- Protected routes — dashboard requires valid token
- Secure logout clears all state from memory

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, Axios, React Router |
| Backend | Python Flask, Flask-JWT-Extended, Flask-CORS |
| Database | SQLite3 (tasks + users tables) |
| Security | bcrypt, Fernet AES-256, JWT HS256 |
| OS Interface | psutil (CPU, RAM, Disk, Processes) |

---

## Project Structure

```
SysVision/
├── backend/
│   ├── app.py                  # Flask entry point + JWT config
│   ├── routes/
│   │   ├── system.py           # CPU & RAM API endpoints
│   │   ├── processes.py        # Process list + kill endpoint
│   │   ├── file_vault.py       # Encrypt/decrypt endpoints
│   │   ├── tasks.py            # CRUD + Priority Queue
│   │   └── auth.py             # Register/Login/JWT
│   ├── services/
│   │   └── vault.py            # AES-256 encryption service
│   ├── database/
│   │   └── db.py               # SQLite connection + schema
│   ├── secret.key              # AES-256 key (auto-generated)
│   ├── tasks.db                # SQLite database file
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js              # Main React component
        └── index.js
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd SysVision/backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install flask flask-cors flask-jwt-extended psutil cryptography bcrypt
python app.py
```

Backend runs at: `http://localhost:5000`

### Frontend Setup

```bash
cd SysVision/frontend
npm install
npm install axios recharts react-router-dom
npm start
```

Frontend runs at: `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cpu` | CPU usage, cores, frequency | No |
| GET | `/api/memory` | RAM and disk usage | No |
| GET | `/api/processes` | All running processes (sorted) | No |
| POST | `/api/processes/kill` | Kill process by PID | No |
| POST | `/api/vault/encrypt` | Encrypt uploaded file | No |
| POST | `/api/vault/decrypt` | Decrypt .vault file | No |
| GET | `/api/tasks` | All tasks (priority sorted) | No |
| POST | `/api/tasks` | Create new task | No |
| PUT | `/api/tasks/<id>` | Update task status | No |
| DELETE | `/api/tasks/<id>` | Delete task | No |
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login → get JWT token | No |
| GET | `/api/auth/me` | Get current user |  Yes |

---

## CS Concepts Implemented

| Concept | Implementation |
|---------|---------------|
| **Operating Systems** | psutil reads CPU, RAM, disk, processes from OS kernel |
| **OS Signals** | `proc.terminate()` sends SIGTERM to processes |
| **DSA — Priority Queue** | `heapq` min-heap sorts tasks by priority |
| **DSA — Sorting** | TimSort O(n log n) with lambda comparator |
| **DSA — Linear Search** | O(n) process name filter |
| **Cryptography** | AES-256-CBC with IV + HMAC-SHA256 (Fernet) |
| **Password Security** | bcrypt with salt, 4096 rounds |
| **Authentication** | JWT stateless tokens with HS256 signature |
| **Database** | SQLite CRUD with parameterized queries (SQL injection safe) |
| **REST API** | GET/POST/PUT/DELETE with proper HTTP status codes |
| **Computer Networks** | CORS, HTTP headers, Bearer token auth |

---

## Security Features

- AES-256 file encryption (same standard used by US Government)
- bcrypt password hashing (intentionally slow — brute force resistant)
- JWT tokens with 24-hour expiry
- Parameterized SQL queries (SQL injection prevention)
- HMAC-SHA256 file integrity verification
- Vague auth error messages (prevents username enumeration)

---

## Author

**Nitin G A**
- University: Reva University, Bengaluru
- Branch: Computer Science & Information Technology
- Batch: 2027
- CGPA: 8.5

---

## License

This project is built for educational purposes and portfolio demonstration.
