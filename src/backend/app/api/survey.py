"""API Router cho tính năng Khảo Sát & Đánh Giá Chất Lượng Thuật Toán (Survey Loop - F10 / ft4).

Hỗ trợ:
- GET  /api/survey/questions: Lấy bộ 10 câu hỏi chuẩn hóa Likert 1-5
- POST /api/survey/submit: Ghi nhận kết quả khảo sát đồng thời vào JSON và CSV (UTF-8 BOM)
"""

import csv
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
QUESTIONS_FILE = DATA_DIR / "questions.json"
SURVEY_JSON_FILE = DATA_DIR / "survey_responses.json"
SURVEY_CSV_FILE = DATA_DIR / "survey_responses.csv"

router = APIRouter(prefix="/api/survey", tags=["Survey & Feedback Loop"])

class SurveySubmitPayload(BaseModel):
    user_id: Optional[str] = Field("ANONYMOUS", description="Mã người dùng hoặc email")
    answers: Dict[str, int] = Field(..., description="Từ điển câu trả lời: {'Q1': 5, 'Q2': 4, ...}")
    comment: Optional[str] = Field("", description="Ý kiến đóng góp phản hồi")

def load_questions_data() -> List[Dict[str, Any]]:
    if not QUESTIONS_FILE.exists():
        # Fallback to ft4/questions.json
        alt = Path("ft4/questions.json")
        if alt.exists():
            with open(alt, "r", encoding="utf-8") as f:
                return json.load(f)
        raise HTTPException(status_code=500, detail="Không tìm thấy tệp questions.json!")
    
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/questions")
def get_survey_questions() -> List[Dict[str, Any]]:
    """Trả về bộ 10 câu hỏi chuẩn hóa Likert."""
    return load_questions_data()

@router.post("/submit")
def submit_survey_response(payload: SurveySubmitPayload) -> Dict[str, Any]:
    """Tiếp nhận câu trả lời khảo sát và ghi nhận vào cả JSON và CSV."""
    questions = load_questions_data()
    q_map = {q["id"]: q for q in questions}

    if len(payload.answers) < len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Vui lòng trả lời đầy đủ tất cả {len(questions)} câu hỏi khảo sát!"
        )

    survey_id = f"SRV_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    timestamp = datetime.now().isoformat()
    
    formatted_responses = []
    total_score = 0

    for q_id, score in payload.answers.items():
        if score < 1 or score > 5:
            raise HTTPException(status_code=400, detail=f"Điểm số của {q_id} phải nằm trong thang đo 1 đến 5.")
        
        q_info = q_map.get(q_id, {})
        formatted_responses.append({
            "question_id": q_id,
            "tag": q_info.get("tag", "UNKNOWN"),
            "group": q_info.get("group", ""),
            "score": score
        })
        total_score += score

    avg_score = round(total_score / len(formatted_responses), 2)

    survey_entry = {
        "survey_id": survey_id,
        "user_id": payload.user_id,
        "timestamp": timestamp,
        "average_score": avg_score,
        "comment": payload.comment or "",
        "responses": formatted_responses
    }

    # 1. Ghi tệp JSON
    json_data = []
    if SURVEY_JSON_FILE.exists():
        try:
            with open(SURVEY_JSON_FILE, "r", encoding="utf-8") as f:
                json_data = json.load(f)
                if not isinstance(json_data, list):
                    json_data = []
        except Exception:
            json_data = []
    
    json_data.append(survey_entry)
    with open(SURVEY_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    # 2. Ghi tệp CSV (UTF-8 BOM để Excel hiển thị tiếng Việt không lỗi font)
    file_exists = SURVEY_CSV_FILE.exists()
    with open(SURVEY_CSV_FILE, "a", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        if not file_exists:
            header = ["Survey_ID", "User_ID", "Timestamp", "Average_Score", "Comment"]
            for q in questions:
                header.append(f"{q['id']}_{q.get('tag', '')}")
            writer.writerow(header)

        row = [survey_id, payload.user_id, timestamp, avg_score, payload.comment or ""]
        for q in questions:
            row.append(payload.answers.get(q["id"], ""))
        writer.writerow(row)

    return {
        "status": "success",
        "message": "Cảm ơn bạn! Đã lưu kết quả đánh giá thành công để tối ưu thuật toán.",
        "survey_id": survey_id,
        "average_score": avg_score
    }
