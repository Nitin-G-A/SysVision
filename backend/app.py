from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta

from routes.system import system_bp
from routes.processes import processes_bp
from routes.file_vault import vault_bp
from routes.tasks import tasks_bp
from routes.auth import auth_bp          # ← this line must exist
from database.db import init_db

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "sysvision-secret-key-nitin-2025"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
jwt = JWTManager(app)

app.register_blueprint(system_bp)
app.register_blueprint(processes_bp)
app.register_blueprint(vault_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(auth_bp)          # ← this line must exist

init_db()

@app.route('/')
def home():
    return {
        "message": "SysVision Backend Running ✅",
        "version": "1.0",
        "status": "ok"
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)