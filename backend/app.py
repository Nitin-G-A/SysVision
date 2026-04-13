from flask import Flask
from flask_cors import CORS
from routes.system import system_bp
from routes.processes import processes_bp
from flask import Flask
from flask_cors import CORS
from routes.system import system_bp
from routes.processes import processes_bp
from routes.file_vault import vault_bp
from routes.tasks import tasks_bp          # ← Add this
from database.db import init_db            # ← Add this

app = Flask(__name__)
CORS(app)

app.register_blueprint(system_bp)
app.register_blueprint(processes_bp)
app.register_blueprint(vault_bp)
app.register_blueprint(tasks_bp)           # ← Add this

# Initialize database on startup
init_db()                                  # ← Add this

@app.route('/')
def home():
    return {
        "message": "SysVision Backend Running ✅",
        "version": "1.0",
        "status": "ok"
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)