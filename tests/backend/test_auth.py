"""Unit tests and integration tests cho tính năng Authentication.

Kiểm thử:
1. Module security (băm mật khẩu, xác thực, độ mạnh mật khẩu, kiểm tra email).
2. JsonAuthRepository (lưu trữ tệp JSON tách biệt, an toàn đa luồng).
3. FastAPI Endpoints (Register, Login, Me, Logout, Forgot Password, Reset Password).
"""

import shutil
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from src.backend.app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    validate_email_format,
    generate_secure_token,
)
from src.backend.app.database.json_auth_repository import JsonAuthRepository
from src.backend.app.database import get_auth_repository
from src.backend.main import app


class TestSecurityModule(unittest.TestCase):
    def test_hash_and_verify_password(self):
        password = "SecurePassword123"
        hashed = hash_password(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(hashed.startswith("pbkdf2_sha256$"))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword123", hashed))
        self.assertFalse(verify_password("", hashed))
        self.assertFalse(verify_password(password, "invalid_hash_string"))

    def test_validate_password_strength(self):
        # Hợp lệ
        valid, _ = validate_password_strength("Pass1234")
        self.assertTrue(valid)

        # Quá ngắn (< 8 ký tự)
        valid, msg = validate_password_strength("Pass1")
        self.assertFalse(valid)
        self.assertIn("tối thiểu 8 ký tự", msg)

        # Thiếu chữ hoa
        valid, msg = validate_password_strength("password123")
        self.assertFalse(valid)
        self.assertIn("chữ cái in hoa", msg)

        # Thiếu chữ thường
        valid, msg = validate_password_strength("PASSWORD123")
        self.assertFalse(valid)
        self.assertIn("chữ cái viết thường", msg)

        # Thiếu số
        valid, msg = validate_password_strength("PasswordOnly")
        self.assertFalse(valid)
        self.assertIn("chữ số", msg)

    def test_validate_email_format(self):
        self.assertTrue(validate_email_format("traveler@example.com"))
        self.assertTrue(validate_email_format("user.name+tag@domain.co"))
        self.assertFalse(validate_email_format("invalid-email"))
        self.assertFalse(validate_email_format("@missingusername.com"))
        self.assertFalse(validate_email_format("user@.com"))
        self.assertFalse(validate_email_format(""))

    def test_generate_secure_token(self):
        token1 = generate_secure_token(32)
        token2 = generate_secure_token(32)
        self.assertNotEqual(token1, token2)
        self.assertTrue(len(token1) >= 32)


class TestJsonAuthRepository(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_file = Path(self.test_dir) / "test_auth.json"
        self.repo = JsonAuthRepository(self.test_file)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_create_and_get_user(self):
        hashed = hash_password("TravelerPass123")
        user = self.repo.create_user("Nguyen Van A", "a@example.com", hashed)
        self.assertEqual(user["email"], "a@example.com")
        self.assertEqual(user["name"], "Nguyen Van A")

        # Lấy lại theo email (case insensitive)
        fetched = self.repo.get_user_by_email("A@EXAMPLE.COM")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["id"], user["id"])

        # Trùng lặp email bị chặn
        with self.assertRaises(ValueError):
            self.repo.create_user("Nguyen Van B", "a@example.com", hashed)

    def test_update_password(self):
        hashed1 = hash_password("OldPassword123")
        user = self.repo.create_user("Nguyen Van A", "test@example.com", hashed1)
        hashed2 = hash_password("NewPassword123")

        updated = self.repo.update_password(user["id"], hashed2)
        self.assertTrue(updated)

        fetched = self.repo.get_user_by_id(user["id"])
        self.assertEqual(fetched["hashed_password"], hashed2)

    def test_sessions(self):
        token = "test_session_token_123"
        expires_at = "2099-01-01T00:00:00+00:00"
        self.repo.create_session(token, "usr_123", expires_at)

        session = self.repo.get_session(token)
        self.assertIsNotNone(session)
        self.assertEqual(session["user_id"], "usr_123")

        self.repo.delete_session(token)
        self.assertIsNone(self.repo.get_session(token))


class TestAuthAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_file = Path(self.test_dir) / "api_test_auth.json"
        self.repo = JsonAuthRepository(self.test_file)

        # Override dependency để test độc lập, không ghi vào database thật
        app.dependency_overrides[get_auth_repository] = lambda: self.repo
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_full_auth_lifecycle(self):
        # 1. Đăng ký thành công
        reg_payload = {
            "name": "Nguyễn Du Khách",
            "email": "traveler@example.com",
            "password": "StrongPassword2026",
            "confirm_password": "StrongPassword2026",
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["user"]["email"], "traveler@example.com")

        # 2. Đăng ký lại cùng email -> Báo lỗi 400
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("đã được sử dụng", res.json()["detail"])

        # 3. Đăng nhập sai mật khẩu -> Báo lỗi 401
        res = self.client.post(
            "/api/auth/login",
            json={"email": "traveler@example.com", "password": "WrongPassword123"},
        )
        self.assertEqual(res.status_code, 401)

        # 4. Đăng nhập đúng mật khẩu -> Trả về token 200
        res = self.client.post(
            "/api/auth/login",
            json={"email": "traveler@example.com", "password": "StrongPassword2026"},
        )
        self.assertEqual(res.status_code, 200)
        token = res.json()["token"]
        self.assertTrue(token)

        # 5. Gọi /api/auth/me với token hợp lệ
        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["name"], "Nguyễn Du Khách")

        # 6. Yêu cầu Quên mật khẩu
        res = self.client.post("/api/auth/forgot-password", json={"email": "traveler@example.com"})
        self.assertEqual(res.status_code, 200)
        forgot_data = res.json()
        self.assertTrue(forgot_data["success"])
        reset_token = forgot_data.get("reset_token")
        self.assertIsNotNone(reset_token)

        # 7. Đặt lại mật khẩu mới
        res = self.client.post(
            "/api/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewSecretPass2026",
                "confirm_password": "NewSecretPass2026",
            },
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # 8. Token đã sử dụng -> Thử dùng lại báo lỗi 400
        res = self.client.post(
            "/api/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "AnotherPassword123",
                "confirm_password": "AnotherPassword123",
            },
        )
        self.assertEqual(res.status_code, 400)

        # 9. Đăng nhập lại với mật khẩu cũ -> Thất bại
        res = self.client.post(
            "/api/auth/login",
            json={"email": "traveler@example.com", "password": "StrongPassword2026"},
        )
        self.assertEqual(res.status_code, 401)

        # 10. Đăng nhập với mật khẩu mới -> Thành công
        res = self.client.post(
            "/api/auth/login",
            json={"email": "traveler@example.com", "password": "NewSecretPass2026"},
        )
        self.assertEqual(res.status_code, 200)
        new_token = res.json()["token"]

        # 11. Đăng xuất
        res = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
        self.assertEqual(res.status_code, 200)

        # 12. Sau khi đăng xuất, /me trả về 401
        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

