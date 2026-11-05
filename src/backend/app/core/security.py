"""Module xử lý bảo mật cho tính năng Authentication.

Bao gồm:
- Băm và xác thực mật khẩu an toàn (PBKDF2-HMAC-SHA256 kết hợp Salt ngẫu nhiên).
- Kiểm tra độ mạnh của mật khẩu theo quy tắc thống nhất.
- Sinh token ngẫu nhiên bảo mật cao cho Session và Reset Password.
- Xác thực định dạng email.
"""

import hashlib
import hmac
import os
import re
import secrets
from typing import Tuple

# Cấu hình PBKDF2
PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 100_000
SALT_SIZE_BYTES = 16


def hash_password(password: str) -> str:
    """Băm mật khẩu bằng PBKDF2-HMAC-SHA256 với Salt ngẫu nhiên."""
    if not isinstance(password, str) or not password:
        raise ValueError("Mật khẩu không được để trống")
    
    salt = os.urandom(SALT_SIZE_BYTES)
    derived = hashlib.pbkdf2_hmac(
        hash_name=PBKDF2_ALGORITHM,
        password=password.encode("utf-8"),
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    salt_hex = salt.hex()
    hash_hex = derived.hex()
    return f"pbkdf2_{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt_hex}${hash_hex}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác thực mật khẩu người dùng nhập vào với chuỗi hash đã lưu."""
    if not plain_password or not hashed_password:
        return False
    
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != f"pbkdf2_{PBKDF2_ALGORITHM}":
            return False
        
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_hash = bytes.fromhex(parts[3])
        
        derived = hashlib.pbkdf2_hmac(
            hash_name=PBKDF2_ALGORITHM,
            password=plain_password.encode("utf-8"),
            salt=salt,
            iterations=iterations,
        )
        return hmac.compare_digest(derived, expected_hash)
    except Exception:
        return False


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Kiểm tra quy tắc mật khẩu (dùng chung cho Đăng ký và Đặt lại mật khẩu).
    
    Quy tắc:
    - Tối thiểu 8 ký tự.
    - Có ít nhất 1 chữ hoa (A-Z).
    - Có ít nhất 1 chữ thường (a-z).
    - Có ít nhất 1 chữ số (0-9).
    """
    if not password:
        return False, "Mật khẩu không được để trống."
    if len(password) < 8:
        return False, "Mật khẩu phải có tối thiểu 8 ký tự."
    if not re.search(r"[A-Z]", password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ cái viết thường (a-z)."
    if not re.search(r"[0-9]", password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ số (0-9)."
    return True, "Mật khẩu hợp lệ."


def validate_email_format(email: str) -> bool:
    """Kiểm tra định dạng email chuẩn RFC cơ bản."""
    if not email or not isinstance(email, str):
        return False
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email.strip()))


def generate_secure_token(nbytes: int = 32) -> str:
    """Sinh chuỗi token bảo mật an toàn ngẫu nhiên (URL-safe)."""
    return secrets.token_urlsafe(nbytes)

