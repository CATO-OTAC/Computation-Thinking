# Smart Travel Planner Assistant (Group 02)
**Course:** CSC10014 - Computational Thinking (Tư duy tính toán) / 2026   
**Group ID:** Group 02  
**Domain:** Personalized Travel Planner Assistant  

---

## 👥 THÀNH VIÊN NHÓM (TEAM MEMBERS)

| No. | Full Name | Student ID | Role in Project |
| :---: | :--- | :---: | :--- |
| 1 | Từ Nguyễn Thuận Thiên | 25127146 | Developer & Data/API Handler |
| 2 | Nguyễn Huỳnh Khánh Như | 25127222 | Team leader & Presenter |
| 3 | Nguyễn Thị Hoàng Châu | 25127022 | Front-end |
| 4 | Nguyễn Bạch Thành Nhân | 25127111 | QA/Tester & Documentation |
| 5 | Nguyễn Bình An | 23127149 | Developer & Logic Implementer |

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (QUICK START)

Toàn bộ hệ thống Backend và Frontend đã được hợp nhất tại thư mục `src/` và chạy duy nhất trên một cổng (`8000`).

### 1. Kích hoạt môi trường & Cài đặt thư viện
```bash
# Kích hoạt virtual environment có sẵn
source .venv/bin/activate

# Cài đặt các gói phụ thuộc (nếu cần)
pip install -r src/backend/requirements.txt
```

### 2. Khởi chạy máy chủ (FastAPI Server)
```bash
python src/backend/main.py
# Hoặc khởi chạy qua uvicorn
uvicorn src.backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Truy cập các phân hệ qua trình duyệt Web
* 🏠 **Trang chủ & Cổng thông tin:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* 🗺️ **Trình lập kế hoạch du lịch & Bản đồ Leaflet (F02–F09):** [http://127.0.0.1:8000/planner.html](http://127.0.0.1:8000/planner.html)
* ⚡ **Đăng nhập một chạm (Demo Traveler & Demo Manager - F01):** [http://127.0.0.1:8000/login.html](http://127.0.0.1:8000/login.html)
* ⚙️ **Bảng điều khiển Quản trị viên (F11 / TC07):** [http://127.0.0.1:8000/manager.html](http://127.0.0.1:8000/manager.html)
* 📝 **Khảo sát đánh giá thuật toán Likert (F10):** [http://127.0.0.1:8000/survey.html](http://127.0.0.1:8000/survey.html)
* 📚 **Tài liệu API Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 CHẠY BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống có sẵn bộ test case kiểm chứng toàn bộ 7 ca kiểm thử theo đúng báo cáo (`TC01` đến `TC07`):

```bash
python -m unittest tests/test_computational_thinking.py
```

### Kết quả kiểm thử:
* **TC01:** Bắt cảnh báo sớm khi ngân sách thấp dưới ngưỡng sàn $B_{min}$ -> **PASS**
* **TC02:** Bắt lỗi ngày đi/về không hợp lệ ($End < Start$) -> **PASS**
* **TC03:** Chấm điểm sở thích Jaccard Similarity chính xác -> **PASS**
* **TC04:** Chuyến đi 2 thành phố Đà Lạt + Nha Trang cam kết không vượt trần $B_{max}$ -> **PASS**
* **TC05:** Gom cụm địa lý loại bỏ hoàn toàn di chuyển lòng vòng (Zero Zigzagging) -> **PASS**
* **TC06:** Nút gạt mô phỏng trời mưa tự động đổi sang điểm trong nhà & thêm đồ đi mưa -> **PASS**
* **TC07:** Phân quyền Manager và thêm/xóa điểm POI thời gian thực -> **PASS**
