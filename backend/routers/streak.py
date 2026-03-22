# backend/routers/streaks.py
from fastapi import APIRouter, Header, HTTPException
import os
from supabase import create_client
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/streaks", tags=["streaks"])

def get_supabase(token: str):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    client = create_client(url, key)
    client.postgrest.auth(token)
    return client


@router.get("/")
def get_streaks(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase(token)
        user = supabase.auth.get_user(token)
        user_id = user.user.id

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
def record_login_streak(authorization: str = Header(...)):
    """Call this every time user logs in"""
    try:
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase(token)
        user = supabase.auth.get_user(token)
        user_id = user.user.id

        today = date.today()
        yesterday = today - timedelta(days=1)

        existing = (
            supabase.table("streaks")
            .select("*")
            .eq("user_id", user_id)
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
                "user_id": user_id,
                "streak_type": "login",
                "activity_date": str(today),
            }).execute()

            return {"success": True, "current_streak": new_streak,
                    "longest_streak": longest}
        else:
            supabase.table("streaks").insert({
                "user_id": user_id,
                "streak_type": "login",
                "current_streak": 1,
                "longest_streak": 1,
                "last_activity_date": str(today),
            }).execute()
            return {"success": True, "current_streak": 1, "longest_streak": 1}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))