# backend/routers/nutrition.py
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client
from datetime import date

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

def get_supabase(token: str):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    client = create_client(url, key)
    client.postgrest.auth(token)
    return client

# --- Models ---
class NutritionLogInput(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    food_name: str
    quantity: Optional[float] = 1
    unit: Optional[str] = "serving"
    calories: Optional[int] = 0
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    fiber: Optional[float] = 0
    meal_time: Optional[str] = None  # "08:30"
    date: Optional[str] = None       # "2026-03-22"

# --- Routes ---

@router.post("/log")
def log_meal(
    data: NutritionLogInput,
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase(token)

        # Get user id
        user = supabase.auth.get_user(token)
        user_id = user.user.id

        log_date = data.date or str(date.today())

        # Insert nutrition log
        payload = {
            "user_id": user_id,
            "meal_type": data.meal_type,
            "food_name": data.food_name,
            "quantity": data.quantity,
            "unit": data.unit,
            "calories": data.calories,
            "protein": data.protein,
            "carbs": data.carbs,
            "fat": data.fat,
            "fiber": data.fiber,
            "meal_time": data.meal_time,
            "date": log_date,
        }
        result = supabase.table("nutrition_logs").insert(payload).execute()

        # Update daily summary
        _update_daily_summary(supabase, user_id, log_date, data)

        # Update healthy_eating streak
        _update_streak(supabase, user_id, log_date)

        return {"success": True, "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/logs")
def get_logs(
    log_date: Optional[str] = None,
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase(token)
        user = supabase.auth.get_user(token)
        user_id = user.user.id

        query_date = log_date or str(date.today())

        result = (
            supabase.table("nutrition_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", query_date)
            .order("logged_at", desc=False)
            .execute()
        )
        return {"success": True, "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary")
def get_summary(
    log_date: Optional[str] = None,
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase(token)
        user = supabase.auth.get_user(token)
        user_id = user.user.id

        query_date = log_date or str(date.today())

        result = (
            supabase.table("nutrition_daily_summary")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", query_date)
            .execute()
        )
        return {"success": True, "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Helpers ---

def _update_daily_summary(supabase, user_id, log_date, data: NutritionLogInput):
    existing = (
        supabase.table("nutrition_daily_summary")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", log_date)
        .execute()
    )

    meal_count_field = f"{data.meal_type}_count"

    if existing.data:
        row = existing.data[0]
        update_payload = {
            "total_calories": row["total_calories"] + (data.calories or 0),
            "total_protein": row["total_protein"] + (data.protein or 0),
            "total_carbs": row["total_carbs"] + (data.carbs or 0),
            "total_fat": row["total_fat"] + (data.fat or 0),
            meal_count_field: row[meal_count_field] + 1,
        }
        new_calories = update_payload["total_calories"]
        update_payload["goal_met"] = new_calories >= row.get("calorie_goal", 2000)

        supabase.table("nutrition_daily_summary").update(
            update_payload
        ).eq("id", row["id"]).execute()
    else:
        insert_payload = {
            "user_id": user_id,
            "date": log_date,
            "total_calories": data.calories or 0,
            "total_protein": data.protein or 0,
            "total_carbs": data.carbs or 0,
            "total_fat": data.fat or 0,
            meal_count_field: 1,
            "calorie_goal": 2000,
            "goal_met": (data.calories or 0) >= 2000,
        }
        supabase.table("nutrition_daily_summary").insert(insert_payload).execute()


def _update_streak(supabase, user_id, log_date):
    from datetime import datetime, timedelta

    existing = (
        supabase.table("streaks")
        .select("*")
        .eq("user_id", user_id)
        .eq("streak_type", "healthy_eating")
        .execute()
    )

    today = datetime.strptime(log_date, "%Y-%m-%d").date()
    yesterday = today - timedelta(days=1)

    if existing.data:
        row = existing.data[0]
        last_date = row["last_activity_date"]

        if last_date == str(today):
            return  # Already logged today

        new_streak = row["current_streak"] + 1 if last_date == str(yesterday) else 1
        longest = max(row["longest_streak"], new_streak)

        supabase.table("streaks").update({
            "current_streak": new_streak,
            "longest_streak": longest,
            "last_activity_date": str(today),
            "updated_at": "now()",
        }).eq("id", row["id"]).execute()

        # Log it
        supabase.table("streak_logs").insert({
            "user_id": user_id,
            "streak_type": "healthy_eating",
            "activity_date": str(today),
            "goal_met": True,
        }).execute()
    else:
        # First time — create streak row
        supabase.table("streaks").insert({
            "user_id": user_id,
            "streak_type": "healthy_eating",
            "current_streak": 1,
            "longest_streak": 1,
            "last_activity_date": str(today),
        }).execute()