# vault.py — AES-256 encryption/decryption service
import os
from cryptography.fernet import Fernet


# KEY MANAGEMENT
KEY_FILE = "secret.key"  # File where key is stored on disk

def generate_key():
    """Generate a new AES-256 key and save it to disk."""
    # Fernet.generate_key() creates a random 256-bit key
    key = Fernet.generate_key()

    # Save key to file so it persists between restarts
    with open(KEY_FILE, 'wb') as f:  # 'wb' = write bytes
        f.write(key)

    return key

def load_key():
    """Load existing key or create a new one if not found."""
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'rb') as f:  # 'rb' = read bytes
            return f.read()
    else:
        # First time running — generate new key
        return generate_key()

# ENCRYPTION
def encrypt_file(file_bytes):
    """
    Encrypt file bytes using AES-256 (Fernet).
    Returns encrypted bytes.
    """
    key = load_key()

    # Fernet object is the encryption engine
    fernet = Fernet(key)

    # encrypt() takes bytes and returns encrypted bytes
    # It adds: IV (random salt) + HMAC (integrity check)
    encrypted = fernet.encrypt(file_bytes)

    return encrypted

# DECRYPTION
def decrypt_file(encrypted_bytes):
    """
    Decrypt encrypted bytes using AES-256 (Fernet).
    Returns original file bytes.
    Raises exception if key is wrong or file is tampered.
    """
    key = load_key()
    fernet = Fernet(key)

    try:
        # decrypt() reverses encryption
        # Automatically verifies HMAC (detects tampering)
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted

    except Exception:
        # Wrong key OR file was tampered with
        raise ValueError("Decryption failed — wrong key or corrupted file")