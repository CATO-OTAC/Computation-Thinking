"""Interface trừu tượng (Abstract Base Class) cho tầng dữ liệu Authentication.

Định nghĩa hợp đồng dữ liệu chuẩn cho các nghiệp vụ:
- Tìm kiếm, tạo người dùng, đổi mật khẩu.
- Quản lý token đặt lại mật khẩu (reset token).
- Quản lý phiên đăng nhập (session token).

Nhờ interface này, hệ thống có thể chuyển từ JSON sang Supabase
mà không cần thay đổi tầng Business Logic hay API routes.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class AuthRepositoryBase(ABC):
    """Lớp cơ sở trừu tượng cho kho lưu trữ dữ liệu xác thực."""

    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin người dùng theo email (chuẩn hóa chữ thường)."""
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin người dùng theo ID."""
        pass

    @abstractmethod
    def create_user(self, name: str, email: str, hashed_password: str) -> Dict[str, Any]:
        """Tạo người dùng mới và lưu trữ."""
        pass

    @abstractmethod
    def update_password(self, user_id: str, new_hashed_password: str) -> bool:
        """Cập nhật mật khẩu băm mới cho người dùng."""
        pass

    @abstractmethod
    def save_reset_token(self, email: str, token: str, expires_at_iso: str) -> None:
        """Lưu token đặt lại mật khẩu cùng thời hạn hiệu lực."""
        pass

    @abstractmethod
    def get_reset_token_record(self, token: str) -> Optional[Dict[str, Any]]:
        """Lấy bản ghi reset token theo chuỗi token."""
        pass

    @abstractmethod
    def invalidate_reset_token(self, token: str) -> None:
        """Hủy bỏ hiệu lực của reset token sau khi đã sử dụng."""
        pass

    @abstractmethod
    def create_session(self, token: str, user_id: str, expires_at_iso: str) -> None:
        """Tạo phiên đăng nhập mới với token và thời hạn."""
        pass

    @abstractmethod
    def get_session(self, token: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin phiên đăng nhập còn hiệu lực."""
        pass

    @abstractmethod
    def delete_session(self, token: str) -> bool:
        """Hủy phiên đăng nhập khi người dùng đăng xuất."""
        pass

