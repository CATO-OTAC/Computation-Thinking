"""API router cho các nghiệp vụ xác thực (Authentication).

Cung cấp các endpoint:
- POST /api/auth/register: Đăng ký tài khoản mới.
- POST /api/auth/login: Đăng nhập hệ thống, cấp token phiên.
- POST /api/auth/logout: Đăng xuất, hủy token phiên.
- POST /api/auth/forgot-password: Yêu cầu đặt lại mật khẩu (tạo link demo môi trường local).
- POST /api/auth/reset-password: Xác nhận mật khẩu mới qua token.
- GET  /api/auth/me: Kiểm tra thông tin phiên đăng nhập hiện tại.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from src.backend.app.core.security import (
    generate_secure_token,
    hash_password,
    validate_email_format,
    validate_password_strength,
    verify_password,
)
from src.backend.app.database import get_auth_repository
from src.backend.app.database.base import AuthRepositoryBase

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Thời hạn phiên đăng nhập và token đặt lại mật khẩu
SESSION_DURATION_DAYS = 7
RESET_TOKEN_DURATION_MINUTES = 15


# ============================================================================
# Pydantic Schemas
# ============================================================================

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Họ và tên")
    email: str = Field(..., description="Địa chỉ email")
    password: str = Field(..., min_length=8, description="Mật khẩu")
    confirm_password: str = Field(..., min_length=8, description="Xác nhận mật khẩu")


class LoginRequest(BaseModel):
    email: str = Field(..., description="Địa chỉ email")
    password: str = Field(..., description="Mật khẩu")


class LogoutRequest(BaseModel):
    token: Optional[str] = Field(None, description="Session token (nếu không truyền qua Header)")


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Địa chỉ email đã đăng ký")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Mã token đặt lại mật khẩu")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới")
    confirm_password: str = Field(..., min_length=8, description="Xác nhận mật khẩu mới")


# ============================================================================
# Helper dependency
# ============================================================================

def get_current_user_from_token(
    authorization: Optional[str] = Header(None),
    repo: AuthRepositoryBase = Depends(get_auth_repository),
) -> Optional[Dict[str, Any]]:
    """Trích xuất và xác thực token phiên từ header Authorization: Bearer <token>."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    session = repo.get_session(token)
    if not session:
        return None
    user = repo.get_user_by_id(session["user_id"])
    return user


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    repo: AuthRepositoryBase = Depends(get_auth_repository),
) -> Dict[str, Any]:
    """Đăng ký tài khoản người dùng mới."""
    name = payload.name.strip()
    email = payload.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Họ và tên không được để trống.",
        )

    if not validate_email_format(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Địa chỉ email không đúng định dạng.",
        )

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu xác nhận không khớp với mật khẩu đã nhập.",
        )

    is_valid, msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    existing = repo.get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.",
        )

    hashed_pw = hash_password(payload.password)
    user = repo.create_user(name=name, email=email, hashed_password=hashed_pw)

    return {
        "success": True,
        "message": "Đăng ký tài khoản thành công!",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "traveler"),
            "created_at": user.get("created_at"),
        },
    }


@router.post("/login", status_code=status.HTTP_200_OK)
def login(
    payload: LoginRequest,
    repo: AuthRepositoryBase = Depends(get_auth_repository),
) -> Dict[str, Any]:
    """Đăng nhập hệ thống bằng email và mật khẩu."""
    email = payload.email.strip().lower()
    user = repo.get_user_by_email(email)

    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác.",
        )

    # Sinh session token
    token = generate_secure_token(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    repo.create_session(token=token, user_id=user["id"], expires_at_iso=expires_at.isoformat())

    return {
        "success": True,
        "message": "Đăng nhập thành công!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "traveler"),
        },
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    payload: Optional[LogoutRequest] = None,
    authorization: Optional[str] = Header(None),
    repo: AuthRepositoryBase = Depends(get_auth_repository),
) -> Dict[str, Any]:
    """Đăng xuất khỏi hệ thống và hủy phiên đăng nhập."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split()[1].strip()
    elif payload and payload.token:
        token = payload.token.strip()

    if token:
        repo.delete_session(token)

    return {
        "success": True,
        "message": "Đăng xuất thành công.",
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    payload: ForgotPasswordRequest,
    repo: AuthRepositoryBase = Depends(get_auth_repository),
) -> Dict[str, Any]:
    """Gửi yêu cầu đặt lại mật khẩu.
    
    Lưu ý môi trường Local/Demo:
    Do project chưa tích hợp dịch vụ gửi email thực tế (như SendGrid/SMTP),
    hệ thống tạo reset token an toàn, lưu vào cơ sở dữ liệu và trả về link demo
    để người dùng có thể thử nghiệm luồng đặt lại mật khẩu ngay trên trình duyệt.
    """
    email = payload.email.strip().lower()
    if not validate_email_format(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Địa chỉ email không đúng định dạng.",
        )

    user = repo.get_user_by_email(email)
    if not user:
        # Nhằm bảo mật (chống rà quét tài khoản), vẫn trả thông báo chung,
        # nhưng không sinh token
        return {
            "success": True,
            "message": "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được xử lý.",
            "demo_reset_url": None,
            "note": "Email không tìm thấy trong hệ thống cục bộ.",
        }

    # Sinh reset token có hiệu lực trong 15 phút
    reset_token = generate_secure_token(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_DURATION_MINUTES)
    repo.save_reset_token(email=email, token=reset_token, expires_at_iso=expires_at.isoformat())

    demo_url = f"?token={reset_token}#reset-password"

    return {
        "success": True,
        "message": "Yêu cầu đặt lại mật khẩu đã được tiếp nhận.",
        "demo_reset_url": demo_url,
        "reset_token": reset_token,
        "note": (
            "Giới hạn môi trường cục bộ: Chưa tích hợp dịch vụ gửi email thực tế. "
            "Liên kết đặt lại mật khẩu demo đã được tạo thành công để bạn kiểm thử luồng."
        ),
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    payload: ResetPasswordRequest,
    repo: AuthRepositoryBase = Depends(get_auth_repository),
) -> Dict[str, Any]:
    """Xác nhận mật khẩu mới thông qua reset token."""
    token = payload.token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã liên kết đặt lại mật khẩu không hợp lệ.",
        )

    record = repo.get_reset_token_record(token)
    if not record or record.get("used"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
        )

    # Kiểm tra hạn sử dụng
    expires_at_str = record.get("expires_at")
    if expires_at_str:
        try:
            exp = datetime.fromisoformat(expires_at_str)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.",
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dữ liệu thời hạn token bị lỗi.",
            )

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu xác nhận không khớp.",
        )

    is_valid, msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    # Lấy thông tin user tương ứng
    user = repo.get_user_by_email(record["email"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng tương ứng với liên kết không tồn tại.",
        )

    # Cập nhật mật khẩu băm mới
    new_hashed = hash_password(payload.new_password)
    repo.update_password(user["id"], new_hashed)

    # Vô hiệu hóa token
    repo.invalidate_reset_token(token)

    return {
        "success": True,
        "message": "Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại.",
    }


@router.get("/me", status_code=status.HTTP_200_OK)
def get_me(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_from_token),
) -> Dict[str, Any]:
    """Lấy thông tin người dùng hiện tại từ session token."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chưa đăng nhập hoặc phiên làm việc đã hết hạn.",
        )

    return {
        "authenticated": True,
        "user": {
            "id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user.get("role", "traveler"),
            "created_at": current_user.get("created_at"),
        },
    }


@router.post("/demo-traveler", status_code=status.HTTP_200_OK)
def demo_traveler_login(repo: AuthRepositoryBase = Depends(get_auth_repository)) -> Dict[str, Any]:
    """Đăng nhập một chạm vai trò Du Khách (Traveler Demo - F01)."""
    email = "demo_traveler@travelplanner.vn"
    user = repo.get_user_by_email(email)
    if not user:
        user = repo.create_user(
            name="Khách Du Lịch Demo",
            email=email,
            hashed_password=hash_password("DemoPassword123!"),
            role="traveler"
        )
    
    token = generate_secure_token(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    repo.create_session(token=token, user_id=user["id"], expires_at_iso=expires_at.isoformat())

    return {
        "success": True,
        "message": "Đăng nhập nhanh vai trò Du Khách thành công!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": "traveler",
        },
    }


@router.post("/demo-manager", status_code=status.HTTP_200_OK)
def demo_manager_login(repo: AuthRepositoryBase = Depends(get_auth_repository)) -> Dict[str, Any]:
    """Đăng nhập một chạm vai trò Quản Trị Viên (Manager Demo - F01 & TC07)."""
    email = "demo_manager@travelplanner.vn"
    user = repo.get_user_by_email(email)
    if not user:
        user = repo.create_user(
            name="Quản Trị Viên Demo",
            email=email,
            hashed_password=hash_password("ManagerPassword123!"),
            role="manager"
        )
    
    token = generate_secure_token(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    repo.create_session(token=token, user_id=user["id"], expires_at_iso=expires_at.isoformat())

    return {
        "success": True,
        "message": "Đăng nhập nhanh vai trò Quản Trị Viên thành công!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": "manager",
        },
    }


