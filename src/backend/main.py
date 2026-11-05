"""Entrypoint khởi chạy máy chủ backend FastAPI cho dự án Travel Planner Assistant.

Hỗ trợ:
- API Routes cho module xác thực Authentication (/api/auth).
- CORS Middleware cho phép frontend kết nối linh hoạt từ nhiều cổng/nguồn.
- Phục vụ tệp tĩnh Frontend từ thư mục src/frontend.
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.backend.app.api.auth import router as auth_router

app = FastAPI(
    title="Travel Planner Assistant - API",
    description="Backend API cho Trợ lý Ảo Lập Kế hoạch Du lịch Cá nhân hóa (Travel Planner Assistant).",
    version="1.0.0",
)

# Cấu hình CORS để frontend HTML/JS thuần có thể gọi fetch()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Môi trường phát triển cho phép truy cập linh hoạt
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn router Authentication
app.include_router(auth_router)


@app.get("/api/health", tags=["Health Check"])
def health_check():
    """Kiểm tra tình trạng hoạt động của API server."""
    return {"status": "ok", "service": "Travel Planner Assistant Backend"}


# Tự động phục vụ giao diện tĩnh Frontend nếu thư mục src/frontend tồn tại
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.backend.main:app", host="127.0.0.1", port=8000, reload=True)

