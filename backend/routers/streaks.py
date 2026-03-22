# backend/routers/streaks.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client
from datetime import date, timedelta

router = APIRouter(prefix="/streaks", tags=["streaks"])

def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

class StreakInput(BaseModel):
    user_id: str

@router.get("/")
def get_streaks(user_id: str):
    try:
        supabase = get_supabase()
        result = (
            supabase.table("streaks")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def record_login_streak(data: StreakInput):
    try:
        supabase = get_supabase()
        today = date.today()
        yesterday = today - timedelta(days=1)

        existing = (
            supabase.table("streaks")
            .select("*")
            .eq("user_id", data.user_id)
            .eq("streak_type", "login")
            .execute()
        )

        if existing.data:
            row = existing.data[0]
            last_date = row["last_activity_date"]

            if last_date == str(today):
                return {"success": True, "message": "Already logged today",
                        "current_streak": row["current_streak"]}

            new_streak = row["current_streak"] + 1 if last_date == str(yesterday) else 1
            longest = max(row["longest_streak"], new_streak)

            supabase.table("streaks").update({
                "current_streak": new_streak,
                "longest_streak": longest,
                "last_activity_date": str(today),
                "updated_at": "now()",
            }).eq("id", row["id"]).execute()

            supabase.table("streak_logs").insert({
                "user_id": data.user_id,
                "streak_type": "login",
                "activity_date": str(today),
            }).execute()

            return {"success": True, "current_streak": new_streak,
                    "longest_streak": longest}
        else:
            supabase.table("streaks").insert({
                "user_id": data.user_id,
                "streak_type": "login",
                "current_streak": 1,
                "longest_streak": 1,
                "last_activity_date": str(today),
            }).execute()
            return {"success": True, "current_streak": 1, "longest_streak": 1}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))