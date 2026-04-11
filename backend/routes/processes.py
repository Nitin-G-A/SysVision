# processes.py — Lists and manages all running OS processes

import psutil
from flask import Blueprint, jsonify, request

processes_bp = Blueprint('processes', __name__)

#  GET ALL PROCESSES
#  URL: http://localhost:5000/api/processes
@processes_bp.route('/api/processes')
def get_processes():
    processes = []

    # process_iter() loops through EVERY running process
    # We specify which attributes to fetch (faster than fetching all)
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent',
                                      'memory_percent', 'status',
                                      'username']):
        try:
            info = proc.info  # Get the process info dict
            # Filter out processes with 0% CPU and 0% memory
            # (too many zombie/idle processes otherwise)
            processes.append({
                "pid":        info['pid'],
                "name":       info['name'],
                "cpu":        round(info['cpu_percent'] or 0, 2),
                "memory":     round(info['memory_percent'] or 0, 2),
                "status":     info['status'],
                "username":   info['username'] or "system"
            })

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            # NoSuchProcess: process ended while we were reading it
            # AccessDenied: system process we can't read (normal)
            pass  # Skip it silently

    # Sort by CPU usage — highest first (DSA: sorting in action!)
    # This is like a custom comparator sort
    processes.sort(key=lambda x: x['cpu'], reverse=True)

    return jsonify(processes)


#  KILL A PROCESS
#  URL: POST http://localhost:5000/api/processes/kill
@processes_bp.route('/api/processes/kill', methods=['POST'])
def kill_process():
    # Get the PID from request body
    data = request.get_json()
    pid = data.get('pid')

    if not pid:
        return jsonify({"error": "PID required"}), 400

    try:
        proc = psutil.Process(pid)  # Find the process by PID
        proc.terminate()            # Send SIGTERM (graceful kill)
        return jsonify({
            "success": True,
            "message": f"Process {pid} terminated"
        })

    except psutil.NoSuchProcess:
        return jsonify({"error": "Process not found"}), 404

    except psutil.AccessDenied:
        return jsonify({"error": "Access denied — system process"}), 403