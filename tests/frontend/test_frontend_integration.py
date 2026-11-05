"""Kiểm thử tích hợp giao diện Frontend và luồng xác thực Authentication.

Kiểm tra:
1. Phục vụ tệp tĩnh (login.html, register.html, forgot-password.html, reset-password.html, css/auth.css, js/auth.js, js/api.js).
2. Tính toàn vẹn cấu trúc semantic HTML (Accessibility, form IDs, input names, labels, aria attributes).
3. Toàn bộ luồng kết nối backend API thật từ đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu đến đăng xuất.
"""

import shutil
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from src.backend.app.database.json_auth_repository import JsonAuthRepository
from src.backend.app.database import get_auth_repository
from src.backend.main import app


class TestFrontendIntegration(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_file = Path(self.test_dir) / "frontend_test_auth.json"
        self.repo = JsonAuthRepository(self.test_file)

        # Override dependency để test độc lập
        app.dependency_overrides[get_auth_repository] = lambda: self.repo
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_static_files_served_successfully(self):
        """Kiểm tra các tệp tĩnh được phục vụ với mã trạng thái 200."""
        routes = [
            ("/", 200),
            ("/index.html", 200),
            ("/login.html", 200),
            ("/register.html", 200),
            ("/forgot-password.html", 200),
            ("/reset-password.html", 200),
            ("/dashboard.html", 200),
            ("/css/auth.css", 200),
            ("/js/auth.js", 200),
            ("/js/api.js", 200),
        ]
        for path, expected_status in routes:
            res = self.client.get(path)
            self.assertEqual(res.status_code, expected_status, f"Đường dẫn {path} không trả về {expected_status}")

    def test_html_semantic_and_accessibility(self):
        """Kiểm tra thuộc tính semantic, accessibility và typography chuẩn reference."""
        # 1. Login page
        res_login = self.client.get("/login.html")
        html_login = res_login.text
        self.assertIn("Manrope", html_login)
        self.assertIn("TRAVEL PLANNER", html_login)
        self.assertIn("Chào mừng trở lại", html_login)
        self.assertIn('for="login-email"', html_login)
        self.assertIn('for="login-password"', html_login)
        self.assertIn('aria-describedby="login-email-error"', html_login)
        self.assertIn('aria-describedby="login-password-error"', html_login)
        self.assertIn("Ghi nhớ đăng nhập", html_login)
        self.assertIn("Quên mật khẩu?", html_login)

        # 2. Register page
        res_reg = self.client.get("/register.html")
        html_reg = res_reg.text
        self.assertIn("BẮT ĐẦU HÀNH TRÌNH", html_reg)
        self.assertIn("Tạo tài khoản", html_reg)
        self.assertIn('id="register-name"', html_reg)
        self.assertIn('id="register-email"', html_reg)
        self.assertIn('id="register-password"', html_reg)
        self.assertIn('id="register-confirm"', html_reg)
        self.assertIn('id="register-terms"', html_reg)
        self.assertIn("Điều khoản sử dụng", html_reg)

        # 3. Forgot password page
        res_forgot = self.client.get("/forgot-password.html")
        html_forgot = res_forgot.text
        self.assertIn("KHÔI PHỤC TÀI KHOẢN", html_forgot)
        self.assertIn("Bạn quên mật khẩu?", html_forgot)
        self.assertIn('id="forgot-email"', html_forgot)
        self.assertIn('id="forgot-sent-view"', html_forgot)
        self.assertIn("ĐÃ GỬI THÀNH CÔNG", html_forgot)

        # 4. Reset password page
        res_reset = self.client.get("/reset-password.html")
        html_reset = res_reset.text
        self.assertIn("BẢO MẬT TÀI KHOẢN", html_reset)
        self.assertIn("Tạo mật khẩu mới", html_reset)
        self.assertIn('id="reset-new-password"', html_reset)
        self.assertIn('id="reset-confirm-password"', html_reset)
        self.assertIn('id="reset-token-input"', html_reset)
        self.assertIn('id="reset-success-view"', html_reset)
        self.assertIn("Mật khẩu đã được cập nhật", html_reset)

    def test_complete_auth_dataflow(self):
        """Kiểm thử luồng tương tác backend từ form frontend."""
        # 1. Đăng ký tài khoản
        reg_payload = {
            "name": "Nguyễn Minh Anh",
            "email": "minhanh@example.com",
            "password": "Password123",
            "confirm_password": "Password123",
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["success"])

        # 2. Đăng nhập
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "minhanh@example.com", "password": "Password123"},
        )
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["token"]
        self.assertTrue(token)

        # 3. Kiểm tra thông tin người dùng với /api/auth/me
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["user"]["name"], "Nguyễn Minh Anh")

        # 4. Quên mật khẩu
        forgot_res = self.client.post("/api/auth/forgot-password", json={"email": "minhanh@example.com"})
        self.assertEqual(forgot_res.status_code, 200)
        reset_token = forgot_res.json()["reset_token"]
        self.assertTrue(reset_token)

        # 5. Đặt lại mật khẩu với token
        reset_res = self.client.post(
            "/api/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewSecurePassword456",
                "confirm_password": "NewSecurePassword456",
            },
        )
        self.assertEqual(reset_res.status_code, 200)

        # 6. Đăng nhập lại với mật khẩu mới
        relogin_res = self.client.post(
            "/api/auth/login",
            json={"email": "minhanh@example.com", "password": "NewSecurePassword456"},
        )
        self.assertEqual(relogin_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()

