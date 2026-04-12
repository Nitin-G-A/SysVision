# file_vault.py — File Vault API endpoints
from flask import Blueprint, request, jsonify, send_file
from services.vault import encrypt_file, decrypt_file
import io   # io.BytesIO lets us send bytes as a file response

vault_bp = Blueprint('vault', __name__)


# ENCRYPT ENDPOINT
# URL: POST http://localhost:5000/api/vault/encrypt
@vault_bp.route('/api/vault/encrypt', methods=['POST'])
def encrypt():
    # Check if file was sent in request
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']      # Get the uploaded file
    filename = file.filename          # Original filename e.g. notes.txt

    if filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Read file content as bytes
    file_bytes = file.read()

    # Encrypt the bytes
    encrypted_bytes = encrypt_file(file_bytes)

    # Send encrypted file back as download
    # io.BytesIO wraps bytes as a file-like object
    return send_file(
        io.BytesIO(encrypted_bytes),
        as_attachment=True,                    # triggers download
        download_name=filename + '.vault',     # adds .vault extension
        mimetype='application/octet-stream'   # binary file type
    )


# DECRYPT ENDPOINT
# URL: POST http://localhost:5000/api/vault/decrypt
@vault_bp.route('/api/vault/decrypt', methods=['POST'])
def decrypt():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    filename = file.filename   # e.g. notes.txt.vault

    encrypted_bytes = file.read()   # Read encrypted bytes

    try:
        decrypted_bytes = decrypt_file(encrypted_bytes)

        # Remove .vault extension from filename
        original_name = filename.replace('.vault', '')

        return send_file(
            io.BytesIO(decrypted_bytes),
            as_attachment=True,
            download_name=original_name,
            mimetype='application/octet-stream'
        )

    except ValueError as e:
        return jsonify({"error": str(e)}), 400