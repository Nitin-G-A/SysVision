# system.py — Reads real CPU and RAM data from your OS
import psutil                          # Library to read hardware info
from flask import Blueprint, jsonify   # Flask tools

# Blueprint = a mini-app inside Flask
# Think of it like a "module" for routes
system_bp = Blueprint('system', __name__)


# ─────────────────────────────────────
#  CPU ENDPOINT
#  URL: http://localhost:5000/api/cpu
# ─────────────────────────────────────
@system_bp.route('/api/cpu')
def get_cpu():
    return jsonify({
        # cpu_percent = how busy your processor is (0-100%)
        # interval=1 means measure for 1 second (more accurate)
        "cpu_percent": psutil.cpu_percent(interval=1),

        # How many CPU cores your computer has
        "cpu_count": psutil.cpu_count(),

        # Per-core usage — list of percentages for each core
        "cpu_per_core": psutil.cpu_percent(interval=1, percpu=True),

        # CPU frequency (speed in MHz)
        "cpu_freq_mhz": round(psutil.cpu_freq().current, 2)
    })


# ─────────────────────────────────────
#  MEMORY ENDPOINT
#  URL: http://localhost:5000/api/memory
# ─────────────────────────────────────
@system_bp.route('/api/memory')
def get_memory():
    # virtual_memory() returns full RAM info
    ram = psutil.virtual_memory()

    # disk_usage('/') returns storage info
    disk = psutil.disk_usage('/')

    return jsonify({
        # RAM info
        # psutil gives bytes, we convert to GB by dividing by 1024^3
        "ram_total_gb":  round(ram.total  / (1024**3), 2),
        "ram_used_gb":   round(ram.used   / (1024**3), 2),
        "ram_free_gb":   round(ram.free   / (1024**3), 2),
        "ram_percent":   ram.percent,

        # Disk/Storage info
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_used_gb":  round(disk.used  / (1024**3), 2),
        "disk_free_gb":  round(disk.free  / (1024**3), 2),
        "disk_percent":  disk.percent
    })