"""Khung mẫu triển khai SupabaseAuthRepository (sẵn sàng cho giai đoạn sau).

Lưu ý:
- Lần triển khai này nhóm sử dụng JSON làm kho lưu trữ chính.
- Module này định hình sẵn cấu trúc tương thích với Supabase client (supabase-py).
- Khi nhóm quyết định chuyển sang Supabase, chỉ cần cài đặt thư viện `supabase`,
  cung cấp SUPABASE_URL / SUPABASE_KEY và kích hoạt class này qua biến môi trường
  STORAGE_TYPE=supabase mà KHÔNG cần chỉnh sửa bất kỳ dòng code nào ở Router hay Frontend!
"""

from typing import Any, Dict, Optional
from src.backend.app.database.base import AuthRepositoryBase


class SupabaseAuthRepository(AuthRepositoryBase):
    """Triển khai kết nối Supabase (Mock / Stub giai đoạn chuẩn bị)."""

    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        # Trong tương lai khi cài đặt supabase-py:
        # from supabase import create_client, Client
        # self.client: Client = create_client(self.supabase_url, self.supabase_key)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        # Tương lai:
        # res = self.client.table("users").select("*").eq("email", email.strip().lower()).execute()
        # return res.data[0] if res.data else None
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def create_user(self, name: str, email: str, hashed_password: str) -> Dict[str, Any]:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def update_password(self, user_id: str, new_hashed_password: str) -> bool:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def save_reset_token(self, email: str, token: str, expires_at_iso: str) -> None:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def get_reset_token_record(self, token: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def invalidate_reset_token(self, token: str) -> None:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def create_session(self, token: str, user_id: str, expires_at_iso: str) -> None:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def get_session(self, token: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

    def delete_session(self, token: str) -> bool:
        raise NotImplementedError("SupabaseAuthRepository sẽ được kích hoạt khi nhóm cấu hình dự án Supabase.")

