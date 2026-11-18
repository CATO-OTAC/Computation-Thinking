"""Module Database cho Authentication.

Hỗ trợ factory function get_auth_repository() để dễ dàng chuyển đổi
giữa JSON và Supabase trong tương lai.
"""

import os
from functools import lru_cache
from src.backend.app.database.base import AuthRepositoryBase
from src.backend.app.database.json_auth_repository import JsonAuthRepository
from src.backend.app.database.supabase_auth_repository import SupabaseAuthRepository


@lru_cache()
def get_auth_repository() -> AuthRepositoryBase:
    """Trả về implementation tương ứng của AuthRepositoryBase.
    
    Mặc định: JsonAuthRepository.
    Khi đổi sang Supabase: Thiết lập STORAGE_TYPE=supabase và SUPABASE_URL / SUPABASE_KEY.
    """
    storage_type = os.getenv("STORAGE_TYPE", "json").strip().lower()
    if storage_type == "supabase":
        return SupabaseAuthRepository(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )
    return JsonAuthRepository()

