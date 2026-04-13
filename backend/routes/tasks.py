# tasks.py — Task Scheduler CRUD API

from flask import Blueprint, jsonify, request
from database.db import get_db
import heapq   # Python's built-in Priority Queue (min-heap)

tasks_bp = Blueprint('tasks', __name__)


# GET ALL TASKS (Priority Queue sorted)
# URL: GET /api/tasks
@tasks_bp.route('/api/tasks')
def get_tasks():
    conn = get_db()

    # Fetch all tasks ordered by priority (1=HIGH first)
    # then by due_date within same priority
    rows = conn.execute('''
        SELECT * FROM tasks
        ORDER BY priority ASC, due_date ASC
    ''').fetchall()
    conn.close()

    # Convert sqlite3.Row objects to plain dicts
    tasks = [dict(row) for row in rows]

    # Apply Priority Queue using heapq
    # heapq treats list as a min-heap (smallest first)
    # We push (priority, task) tuples and pop in order
    heap = []
    for task in tasks:
        # heappush maintains heap property automatically
        heapq.heappush(heap, (task['priority'], task['id'], task))

    # Pop all in priority order (smallest priority number first)
    sorted_tasks = []
    while heap:
        _, _, task = heapq.heappop(heap)
        sorted_tasks.append(task)

    return jsonify(sorted_tasks)


# CREATE TASK
# URL: POST /api/tasks
@tasks_bp.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()

    # Validate required fields
    if not data.get('title'):
        return jsonify({"error": "Title is required"}), 400

    conn = get_db()
    conn.execute('''
        INSERT INTO tasks (title, description, priority, due_date)
        VALUES (?, ?, ?, ?)
    ''',  # ? = parameterized query (prevents SQL injection!)
    (
        data.get('title'),
        data.get('description', ''),
        data.get('priority', 2),    # default medium priority
        data.get('due_date', '')
    ))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Task created!"}), 201
    # 201 = Created (standard HTTP for successful POST creation)



# UPDATE TASK STATUS (Complete/Pending)
# URL: PUT /api/tasks/<id>
@tasks_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    new_status = data.get('status', 'completed')

    conn = get_db()
    conn.execute('''
        UPDATE tasks SET status = ? WHERE id = ?
    ''', (new_status, task_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True})


# DELETE TASK
# URL: DELETE /api/tasks/<id>
@tasks_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db()
    conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Task deleted!"})