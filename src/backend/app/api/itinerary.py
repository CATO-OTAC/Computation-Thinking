"""API Router cho tính năng Đề Xuất & Lập Lịch Trình (Itinerary Engine).

Hỗ trợ:
- POST /api/itinerary/generate: Sinh lịch trình tối ưu đa ràng buộc (F02, F03, F04, F05, F06, F07, F08)
- POST /api/itinerary/rebalance-budget: Điều chỉnh ngân sách động theo thanh trượt (F09)
- GET  /api/itinerary/config: Cung cấp danh sách thành phố, vibes, types có sẵn
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.backend.app.algorithms.planner import (
    PRESET_TYPES,
    PRESET_VIBES,
    generate_optimized_itinerary,
)

router = APIRouter(prefix="/api/itinerary", tags=["Itinerary Planner"])

class TripPlannerRequest(BaseModel):
    destination: str = Field(..., description="Thành phố hoặc chuyến kết hợp: 'Đà Lạt', 'Nha Trang', hoặc 'Đà Lạt + Nha Trang'")
    budget_vnd: float = Field(..., description="Tổng ngân sách chuyến đi (VNĐ)")
    days: Optional[int] = Field(3, description="Số ngày dự kiến")
    party_size: int = Field(2, ge=1, description="Số lượng thành viên trong đoàn")
    vibes: Optional[List[str]] = Field(default_factory=lambda: ["Chill", "Nature"])
    is_rainy: Optional[bool] = Field(False, description="Mô phỏng thời tiết mưa (F07 / TC06)")
    start_date: Optional[str] = Field(None, description="Ngày khởi hành (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="Ngày kết thúc (YYYY-MM-DD)")
    special_notes: Optional[str] = Field("", description="Ghi chú yêu cầu đặc biệt")

class RebalanceBudgetRequest(BaseModel):
    current_request: TripPlannerRequest
    new_budget_vnd: float

@router.get("/config")
def get_itinerary_config() -> Dict[str, Any]:
    """Cung cấp các thông số cấu hình mặc định cho giao diện."""
    return {
        "destinations": [
            {"id": "Đà Lạt", "name": "Đà Lạt (Thành phố ngàn hoa / Cao nguyên)"},
            {"id": "Nha Trang", "name": "Nha Trang (Thành phố biển vịnh ngọc)"},
            {"id": "Đà Lạt + Nha Trang", "name": "Chuyến đi kết hợp: Đà Lạt + Nha Trang (Highland & Coastal)"}
        ],
        "preset_vibes": PRESET_VIBES,
        "preset_types": PRESET_TYPES
    }

@router.post("/generate")
def create_itinerary(payload: TripPlannerRequest) -> Dict[str, Any]:
    """Sinh lịch trình du lịch thông minh, tối ưu ngân sách và quãng đường."""
    result = generate_optimized_itinerary(
        destination=payload.destination,
        budget_vnd=payload.budget_vnd,
        days=payload.days or 3,
        party_size=payload.party_size,
        global_vibes=payload.vibes or ["Chill", "Nature"],
        is_rainy=bool(payload.is_rainy),
        start_date_str=payload.start_date,
        end_date_str=payload.end_date,
        special_notes=payload.special_notes or ""
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    
    return result

@router.post("/rebalance-budget")
def rebalance_budget(payload: RebalanceBudgetRequest) -> Dict[str, Any]:
    """Điều chỉnh lại ngân sách tức thời qua Slider (F09)."""
    req = payload.current_request
    result = generate_optimized_itinerary(
        destination=req.destination,
        budget_vnd=payload.new_budget_vnd,
        days=req.days or 3,
        party_size=req.party_size,
        global_vibes=req.vibes or ["Chill", "Nature"],
        is_rainy=bool(req.is_rainy),
        start_date_str=req.start_date,
        end_date_str=req.end_date,
        special_notes=req.special_notes or ""
    )
    return result
