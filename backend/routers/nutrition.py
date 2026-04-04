from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timedelta
from database import supabase_client

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


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
    date: Optional[str] = None


@router.post("/log")
def log_meal(data: NutritionLogInput):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
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
            "log_date": log_date,
        }
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        result = supabase_client.table("nutrition_logs").insert(payload).execute()

        # Try to update streaks (don't fail if table missing)
        try:
            _update_streak(data.user_id, log_date)
        except Exception:
            pass

        return {"success": True, "data": result.data}
    except Exception as e:
        print(f"Nutrition log error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/logs")
def get_logs(user_id: str, log_date: Optional[str] = None):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
        query_date = log_date or str(date.today())
        result = (
            supabase_client.table("nutrition_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("log_date", query_date)
            .order("created_at", desc=False)
            .execute()
        )
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary")
def get_summary(user_id: str, log_date: Optional[str] = None):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
        query_date = log_date or str(date.today())
        # Calculate summary from nutrition_logs directly
        result = (
            supabase_client.table("nutrition_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("log_date", query_date)
            .execute()
        )
        logs = result.data or []
        summary = {
            "total_calories": sum(l.get("calories", 0) or 0 for l in logs),
            "total_protein": sum(l.get("protein", 0) or 0 for l in logs),
            "total_carbs": sum(l.get("carbs", 0) or 0 for l in logs),
            "total_fat": sum(l.get("fat", 0) or 0 for l in logs),
            "meal_count": len(logs),
            "date": query_date,
        }
        return {"success": True, "data": [summary] if logs else []}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _update_streak(user_id, log_date):
    """Update food streak when meal is logged."""
    today = datetime.strptime(log_date, "%Y-%m-%d").date()
    yesterday = today - timedelta(days=1)
    existing = (
        supabase_client.table("streaks")
        .select("*")
        .eq("user_id", user_id)
        .eq("streak_type", "food")
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        if row["last_activity_date"] == str(today):
            return
        new_streak = row["current_streak"] + 1 if row["last_activity_date"] == str(yesterday) else 1
        longest = max(row["longest_streak"], new_streak)
        supabase_client.table("streaks").update({
            "current_streak": new_streak,
            "longest_streak": longest,
            "last_activity_date": str(today),
        }).eq("id", row["id"]).execute()
    else:
        supabase_client.table("streaks").insert({
            "user_id": user_id,
            "streak_type": "food",
            "current_streak": 1,
            "longest_streak": 1,
            "last_activity_date": str(today),
        }).execute()