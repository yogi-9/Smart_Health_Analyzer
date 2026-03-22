from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

class NutritionLogInput(BaseModel):
    user_id: str
    meal_type: str
    food_name: str
    quantity: Optional[float] = 1
    unit: Optional[str] = "serving"
    calories: Optional[int] = 0
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    fiber: Optional[float] = 0
    meal_time: Optional[str] = None
    date: Optional[str] = None

@router.post("/log")
def log_meal(data: NutritionLogInput):
    try:
        supabase = get_supabase()
        log_date = data.date or str(date.today())

        payload = {
            "user_id": data.user_id,
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
        _update_daily_summary(supabase, data.user_id, log_date, data)
        _update_streak(supabase, data.user_id, log_date)
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/logs")
def get_logs(user_id: str, log_date: Optional[str] = None):
    try:
        supabase = get_supabase()
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
def get_summary(user_id: str, log_date: Optional[str] = None):
    try:
        supabase = get_supabase()
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

def _update_daily_summary(supabase, user_id, log_date, data):
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
        update_payload["goal_met"] = update_payload["total_calories"] >= row.get("calorie_goal", 2000)
        supabase.table("nutrition_daily_summary").update(
            update_payload).eq("id", row["id"]).execute()
    else:
        supabase.table("nutrition_daily_summary").insert({
            "user_id": user_id,
            "date": log_date,
            "total_calories": data.calories or 0,
            "total_protein": data.protein or 0,
            "total_carbs": data.carbs or 0,
            "total_fat": data.fat or 0,
            meal_count_field: 1,
            "calorie_goal": 2000,
            "goal_met": False,
        }).execute()

def _update_streak(supabase, user_id, log_date):
    today = datetime.strptime(log_date, "%Y-%m-%d").date()
    yesterday = today - timedelta(days=1)
    existing = (
        supabase.table("streaks")
        .select("*")
        .eq("user_id", user_id)
        .eq("streak_type", "healthy_eating")
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        if row["last_activity_date"] == str(today):
            return
        new_streak = row["current_streak"] + 1 if row["last_activity_date"] == str(yesterday) else 1
        longest = max(row["longest_streak"], new_streak)
        supabase.table("streaks").update({
            "current_streak": new_streak,
            "longest_streak": longest,
            "last_activity_date": str(today),
        }).eq("id", row["id"]).execute()
    else:
        supabase.table("streaks").insert({
            "user_id": user_id,
            "streak_type": "healthy_eating",
            "current_streak": 1,
            "longest_streak": 1,
            "last_activity_date": str(today),
        }).execute()