"""Triển khai AuthRepositoryBase sử dụng lưu trữ tệp JSON cục bộ.

Đặc điểm:
- Tách biệt dữ liệu Authentication trong tệp JSON riêng biệt (mặc định: src/backend/data/auth_data.json).
- Không ảnh hưởng đến dữ liệu lộ trình hay các tính năng khác của thành viên trong nhóm.
- Đảm bảo an toàn đa luồng (thread-safe với RLock) và ghi tệp an toàn (atomic write via temp file).
- Hỗ trợ đầy đủ tiếng Việt với ensure_ascii=False.
"""

import json
import os
import tempfile
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from src.backend.app.database.base import AuthRepositoryBase

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DEFAULT_AUTH_FILE = DEFAULT_DATA_DIR / "auth_data.json"


class JsonAuthRepository(AuthRepositoryBase):
    """Kho lưu trữ dữ liệu xác thực bằng JSON."""

    def __init__(self, file_path: Optional[Path] = None):
        self.file_path = Path(file_path or os.getenv("AUTH_DATA_FILE", str(DEFAULT_AUTH_FILE))).resolve()
        self._lock = threading.RLock()
        self._ensure_file_exists()

    def _ensure_file_exists(self) -> None:
        """Tự động tạo thư mục và tệp JSON khởi tạo nếu chưa tồn tại."""
        with self._lock:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            if not self.file_path.exists() or self.file_path.stat().st_size == 0:
                initial_data = {
                    "users": [],
                    "sessions": [],
                    "reset_tokens": [],
                }
                self._save_data_unsafe(initial_data)

    def _load_data(self) -> Dict[str, Any]:
        """Đọc toàn bộ dữ liệu từ tệp JSON."""
        with self._lock:
            if not self.file_path.exists():
                return {"users": [], "sessions": [], "reset_tokens": []}
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if not isinstance(data, dict):
                        data = {}
                    data.setdefault("users", [])
                    data.setdefault("sessions", [])
                    data.setdefault("reset_tokens", [])
                    return data
            except (json.JSONDecodeError, OSError):
                return {"users": [], "sessions": [], "reset_tokens": []}

    def _save_data_unsafe(self, data: Dict[str, Any]) -> None:
        """Ghi dữ liệu an toàn theo phương thức atomic replacement (đã có lock)."""
        temp_dir = self.file_path.parent
        temp_dir.mkdir(parents=True, exist_ok=True)
        # Tạo file tạm cùng thư mục để đảm bảo cùng filesystem khi đổi tên
        with tempfile.NamedTemporaryFile("w", dir=temp_dir, delete=False, encoding="utf-8") as tf:
            json.dump(data, tf, indent=2, ensure_ascii=False)
            temp_name = tf.name
        os.replace(temp_name, self.file_path)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        normalized = email.strip().lower()
        data = self._load_data()
        for u in data.get("users", []):
            if u.get("email", "").strip().lower() == normalized:
                return dict(u)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        data = self._load_data()
        for u in data.get("users", []):
            if u.get("id") == user_id:
                return dict(u)
        return None

    def create_user(self, name: str, email: str, hashed_password: str) -> Dict[str, Any]:
        with self._lock:
            data = self._load_data()
            normalized_email = email.strip().lower()
            
            # Kiểm tra trùng lặp email
            for u in data.get("users", []):
                if u.get("email", "").strip().lower() == normalized_email:
                    raise ValueError("Email này đã được đăng ký trong hệ thống.")

            now_iso = datetime.now(timezone.utc).isoformat()
            user_id = f"usr_{uuid.uuid4().hex[:12]}"
            new_user = {
                "id": user_id,
                "name": name.strip(),
                "email": normalized_email,
                "hashed_password": hashed_password,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            data["users"].append(new_user)
            self._save_data_unsafe(data)
            return dict(new_user)

    def update_password(self, user_id: str, new_hashed_password: str) -> bool:
        with self._lock:
            data = self._load_data()
            found = False
            now_iso = datetime.now(timezone.utc).isoformat()
            for u in data.get("users", []):
                if u.get("id") == user_id:
                    u["hashed_password"] = new_hashed_password
                    u["updated_at"] = now_iso
                    found = True
                    break
            if found:
                self._save_data_unsafe(data)
            return found

    def save_reset_token(self, email: str, token: str, expires_at_iso: str) -> None:
        with self._lock:
            data = self._load_data()
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # Vô hiệu hóa các reset token cũ chưa dùng của email này (nếu có)
            normalized_email = email.strip().lower()
            for r in data.get("reset_tokens", []):
                if r.get("email", "").strip().lower() == normalized_email and not r.get("used"):
                    r["used"] = True

            record = {
                "token": token,
                "email": normalized_email,
                "expires_at": expires_at_iso,
                "used": False,
                "created_at": now_iso,
            }
            data["reset_tokens"].append(record)
            self._save_data_unsafe(data)

    def get_reset_token_record(self, token: str) -> Optional[Dict[str, Any]]:
        data = self._load_data()
        for r in data.get("reset_tokens", []):
            if r.get("token") == token:
                return dict(r)
        return None

    def invalidate_reset_token(self, token: str) -> None:
        with self._lock:
            data = self._load_data()
            for r in data.get("reset_tokens", []):
                if r.get("token") == token:
                    r["used"] = True
            self._save_data_unsafe(data)

    def create_session(self, token: str, user_id: str, expires_at_iso: str) -> None:
        with self._lock:
            data = self._load_data()
            now_iso = datetime.now(timezone.utc).isoformat()
            session = {
                "token": token,
                "user_id": user_id,
                "expires_at": expires_at_iso,
                "created_at": now_iso,
            }
            data["sessions"].append(session)
            self._save_data_unsafe(data)

    def get_session(self, token: str) -> Optional[Dict[str, Any]]:
        data = self._load_data()
        now = datetime.now(timezone.utc)
        for s in data.get("sessions", []):
            if s.get("token") == token:
                expires_at_str = s.get("expires_at")
                if expires_at_str:
                    try:
                        exp = datetime.fromisoformat(expires_at_str)
                        if exp.tzinfo is None:
                            exp = exp.replace(tzinfo=timezone.utc)
                        if exp < now:
                            return None
                    except ValueError:
                        return None
                return dict(s)
        return None

    def delete_session(self, token: str) -> bool:
        with self._lock:
            data = self._load_data()
            before_len = len(data.get("sessions", []))
            data["sessions"] = [s for s in data.get("sessions", []) if s.get("token") != token]
            if len(data["sessions"]) != before_len:
                self._save_data_unsafe(data)
                return True
            return False

