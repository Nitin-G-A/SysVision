# auth.py — Register, Login, and Protected routes
from bcrypt import hashpw, gensalt, checkpw
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,   # generates JWT token
    jwt_required,          # decorator to protect routes
    get_jwt_identity       # gets user info from token
)
from database.db import get_db

auth_bp = Blueprint('auth', __name__)

# REGISTER
# URL: POST /api/auth/register

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email    = data.get('email', '').strip()
    password = data.get('password', '')

    # Validate inputs
    if not username or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Hash the password using bcrypt
    # bcrypt.gensalt() creates random salt (12 rounds by default)
    # salt makes same password produce different hash each time
    password_hash = hashpw(
        password.encode('utf-8'),    # convert string to bytes
        gensalt()                    # generate random salt
    ).decode('utf-8')                # convert bytes back to string for DB

    try:
        conn = get_db()
        conn.execute('''
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        ''', (username, email, password_hash))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Account created!"}), 201

    except Exception as e:
        # UNIQUE constraint fails if username/email already exists
        if 'UNIQUE' in str(e):
            return jsonify({"error": "Username or email already exists"}), 409
            # 409 = Conflict (resource already exists)
        return jsonify({"error": "Registration failed"}), 500

# LOGIN
# URL: POST /api/auth/login

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    # Find user in database
    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
        # 401 = Unauthorized
        # Note: never say "username not found" — security risk!

    # Verify password against stored hash
    # bcrypt.checkpw() hashes input and compares with stored hash
    password_match = checkpw(
        password.encode('utf-8'),           # input password as bytes
        user['password_hash'].encode('utf-8')  # stored hash as bytes
    )

    if not password_match:
        return jsonify({"error": "Invalid credentials"}), 401

    # Generate JWT token
    # identity = what we store inside the token
    access_token = create_access_token(
        identity={"id": user['id'], "username": user['username']}
    )

    return jsonify({
        "access_token": access_token,
        "username": user['username'],
        "message": "Login successful!"
    })


# GET CURRENT USER (Protected Route)
# URL: GET /api/auth/me
# Requires: Authorization: Bearer <token>

@auth_bp.route('/api/auth/me')
@jwt_required()   # ← This protects the route!
def get_me():
    # get_jwt_identity() extracts user data from token
    current_user = get_jwt_identity()
    return jsonify({
        "user": current_user,
        "message": "Token valid!"
    })