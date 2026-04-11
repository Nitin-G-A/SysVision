from flask import Flask
from flask_cors import CORS
from routes.system import system_bp
from routes.processes import processes_bp     # ← Add this

app = Flask(__name__)
CORS(app)

app.register_blueprint(system_bp)
app.register_blueprint(processes_bp)          # ← Add this

@app.route('/')
def home():
    return {
        "message": "SysVision Backend Running ✅",
        "version": "1.0",
        "status": "ok"
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)