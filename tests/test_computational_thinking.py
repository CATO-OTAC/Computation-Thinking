"""Bộ kiểm thử tự động toàn diện cho 7 Ca Kiểm Thử (TC01 - TC07) trong Báo cáo Dự án.

Nhóm: Group 02
Môn học: CSC10014 - Tư duy tính toán (Computational Thinking)
"""

import unittest
from fastapi.testclient import TestClient
from src.backend.main import app

class TestComputationalThinkingSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_tc01_budget_too_low_warning(self):
        """TC01: Ngân sách nhập vào quá thấp (dưới ngưỡng Bmin) phải bị cảnh báo và từ chối."""
        res = self.client.post("/api/itinerary/generate", json={
            "destination": "Đà Lạt",
            "days": 3,
            "party_size": 4,
            "budget_vnd": 300_000,
            "vibes": ["Nature", "Chill"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "warning")
        self.assertIn("quá thấp", data.get("message", "").lower())
        self.assertGreater(data.get("min_required_budget", 0), 1_000_000)

    def test_tc02_invalid_chronological_dates(self):
        """TC02: Ngày kết thúc sớm hơn ngày khởi hành phải bị chặn với thông báo rõ ràng."""
        res = self.client.post("/api/itinerary/generate", json={
            "destination": "Đà Lạt",
            "budget_vnd": 8_000_000,
            "party_size": 2,
            "start_date": "2026-12-10",
            "end_date": "2026-12-08",
            "vibes": ["Nature"]
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("không thể trước ngày khởi hành", res.json().get("detail", ""))

    def test_tc03_preference_matching_accuracy(self):
        """TC03: Độ chính xác của thuật toán khớp sở thích Jaccard."""
        res = self.client.post("/api/itinerary/generate", json={
            "destination": "Đà Lạt",
            "budget_vnd": 8_000_000,
            "days": 2,
            "party_size": 2,
            "vibes": ["Nature", "Chill", "Coffee"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        trans = data.get("algorithm_transparency", {})
        self.assertGreaterEqual(trans.get("jaccard_match_pct", 0), 70.0)

    def test_tc04_two_city_hard_budget_ceiling(self):
        """TC04: Chuyến đi kết hợp 2 thành phố (Đà Lạt + Nha Trang, 4 ngày, 2 người, ngân sách 12 triệu)."""
        max_budget = 12_000_000
        res = self.client.post("/api/itinerary/generate", json={
            "destination": "Đà Lạt + Nha Trang",
            "days": 4,
            "party_size": 2,
            "budget_vnd": max_budget,
            "vibes": ["Nature", "Chill", "Culinary"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        
        trip_info = data.get("trip_info", {})
        total_spent = trip_info.get("total_projected_spent_vnd", 0)
        self.assertLessEqual(total_spent, max_budget)
        self.assertGreaterEqual(trip_info.get("contingency_fund_vnd", 0), 0)
        
        # Kiểm tra đủ 5 nhóm ngân sách
        breakdown = data.get("budget_breakdown", {})
        self.assertIn("transportation", breakdown)
        self.assertIn("accommodation", breakdown)
        self.assertIn("dining", breakdown)
        self.assertIn("activities", breakdown)
        self.assertIn("contingency", breakdown)

    def test_tc05_geographic_clustering_no_zigzag(self):
        """TC05: Gom cụm địa lý theo khu vực để tránh tuyến đường zigzag."""
        res = self.client.post("/api/itinerary/generate", json={
            "destination": "Đà Lạt",
            "days": 2,
            "party_size": 2,
            "budget_vnd": 8_000_000,
            "vibes": ["Nature", "Sightseeing"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        trans = data.get("algorithm_transparency", {})
        self.assertGreater(trans.get("distance_saved_km", 0), 0)
        self.assertTrue(trans.get("hard_ceiling_complied"))

    def test_tc06_simulate_rainy_day_weather_adaptation(self):
        """TC06: Mô phỏng trời mưa tự động tráo đổi điểm ngoài trời sang điểm trong nhà."""
        res = self.client.post("/api/itinerary/generate", json={
            "destination": "Đà Lạt",
            "days": 2,
            "party_size": 2,
            "budget_vnd": 8_000_000,
            "vibes": ["Nature", "Chill"],
            "is_rainy": True
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        
        # Kiểm tra checklist có đồ đi mưa
        checklist = data.get("packing_checklist", [])
        rain_items = [i for i in checklist if "Trời Mưa" in i.get("category", "")]
        self.assertGreater(len(rain_items), 0)

    def test_tc07_manager_role_and_crud(self):
        """TC07: Phân quyền Quản Trị Viên và chức năng thêm/xóa POI."""
        # 1. Đăng nhập nhanh Demo Manager
        res_login = self.client.post("/api/auth/demo-manager")
        self.assertEqual(res_login.status_code, 200)
        self.assertEqual(res_login.json()["user"]["role"], "manager")

        # 2. Thêm POI mới
        res_add = self.client.post("/api/manager/pois", json={
            "city": "Nha Trang",
            "name": "Khu Du Lịch Hòn Mun Mới",
            "type": "Attraction",
            "area": "South Nha Trang",
            "weather_suitability": "Outdoor",
            "vibes": ["Nature", "Adventure"],
            "avg_price": 50_000,
            "lat": 12.17,
            "lng": 109.30,
            "new_address": "Vịnh Nha Trang, Khánh Hòa"
        })
        self.assertEqual(res_add.status_code, 200)
        created_stt = res_add.json()["poi"]["stt"]

        # 3. Xóa POI vừa tạo để dọn dẹp
        res_del = self.client.delete(f"/api/manager/pois/Nha Trang/{created_stt}")
        self.assertEqual(res_del.status_code, 200)

    def test_tc08_reverse_geocode_and_location_resolution(self):
        """TC08: Trích xuất tọa độ từ link Google Maps và Reverse Geocoding lấy địa chỉ thực tế."""
        # 1. Trích xuất tọa độ từ link Google Maps chứa !3d và !4d
        gmaps_url = "https://www.google.com/maps/place/Dalat+Wonder+Resort/@11.8973,108.4168,17z/data=!3m1!4b1!4m6!3m5!1s0x317112dc26a0b22f:0xb9da544dcfd34200!8m2!3d11.8973!4d108.4168"
        res = self.client.get(f"/api/manager/resolve-location?query={gmaps_url}&city=Đà Lạt")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertAlmostEqual(data.get("lat"), 11.8973, places=3)
        self.assertAlmostEqual(data.get("lng"), 108.4168, places=3)

        # 2. Reverse Geocode endpoint
        res_geo = self.client.get("/api/manager/reverse-geocode?lat=11.9392&lng=108.4375")
        self.assertEqual(res_geo.status_code, 200)
        data_geo = res_geo.json()
        self.assertIn("address", data_geo)

if __name__ == "__main__":
    unittest.main()
