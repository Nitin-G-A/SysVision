from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

# ----- Import Routes (we'll build these in later phases) -----
# from routes.cpu import cpu_bp
# from routes.memory import memory_bp

# ----- Register Routes -----
# app.register_blueprint(cpu_bp)
# app.register_blueprint(memory_bp)

# ---- Basic test route ----
@app.route('/')
def home():
    return {
        "message": "SysVision Backend Running ✅",
        "version": "1.0",
        "status": "ok"
    }

# Run the server
if __name__ == '__main__':
    app.run(debug=True, port=5000)