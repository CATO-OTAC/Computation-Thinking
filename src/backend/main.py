"""Entrypoint chính khởi chạy máy chủ FastAPI thống nhất cho Trợ lý Du lịch Thông minh.

Tích hợp tất cả các phân hệ:
1. Xác thực người dùng & Phân quyền (Traveler & Manager) + 1-Click Demo (F01)
2. Bộ máy Lập Lịch Trình Tối Ưu Đa Ràng Buộc (F02, F03, F04, F05, F06, F07, F08, F09)
3. Vòng lặp Khảo sát & Đánh giá chất lượng thuật toán (F10)
4. Dashboard Quản trị dữ liệu POI cho Quản trị viên (F11 / TC07)
5. Phục vụ Web Frontend tĩnh (HTML/CSS/JS) tại địa chỉ gốc /
"""

import os
import sys
from pathlib import Path

# Thêm thư mục gốc dự án vào sys.path để luôn import được 'src' bất kể chạy từ đâu
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.backend.app.api.auth import router as auth_router
from src.backend.app.api.itinerary import router as itinerary_router
from src.backend.app.api.manager import router as manager_router
from src.backend.app.api.survey import router as survey_router

app = FastAPI(
    title="Smart Travel Planner Assistant - Group 02",
    description="Hệ thống Trợ lý Ảo Lập Kế hoạch Du lịch Cá nhân hóa dựa trên Tư duy tính toán (Computational Thinking).",
    version="2.0.0"
)

# Cấu hình CORS để frontend tương tác mượt mà
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các API Routers
app.include_router(auth_router)
app.include_router(itinerary_router)
app.include_router(manager_router)
app.include_router(survey_router)

@app.get("/api/health", tags=["Health Check"])
def health_check():
    """Kiểm tra sức khỏe hệ thống."""
    return {
        "status": "healthy",
        "service": "Smart Travel Planner Engine",
        "version": "2.0.0",
        "course": "CSC10014 - Computational Thinking 2026"
    }

# Phục vụ Frontend tĩnh
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.backend.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=str(ROOT_DIR))
