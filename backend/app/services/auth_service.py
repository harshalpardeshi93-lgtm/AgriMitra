import hashlib
import os
import secrets
from typing import Optional

def hash_password(password: str) -> str:
    """
    Hash password using PBKDF2-HMAC-SHA256 with a random salt.
    Never stores plaintext passwords.
    """
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{pw_hash.hex()}"

def verify_password(password: str, stored_hash: Optional[str]) -> bool:
    """
    Verify password against stored salt:hash string.
    """
    if not stored_hash or ':' not in stored_hash:
        return False
    try:
        salt_hex, pw_hash_hex = stored_hash.split(':', 1)
        salt = bytes.fromhex(salt_hex)
        pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return secrets.compare_digest(pw_hash.hex(), pw_hash_hex)
    except Exception:
        return False

import jwt
from datetime import datetime, timedelta

# Default to a safe string for dev if not present, but document it's prototype only
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "agrimitra_unsafe_prototype_secret_key_123")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def generate_token(user_id: int, role: str) -> str:
    """
    Generate a secure JWT for session management.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt
