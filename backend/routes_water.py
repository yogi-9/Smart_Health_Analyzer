from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase_client

router = APIRouter(prefix="/water", tags=["Water Tracker"])

class WaterLogInput(BaseModel):
    user_id: str
    glasses: int
    logged_date: Optional[str] = None

class WaterTodayResponse(BaseModel):
    glasses: int
    goal: int
    percentage: float
    message: str

@router.post("/log")
def log_water(data: WaterLogInput):
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database not connected")

    if data.glasses < 0 or data.glasses > 20:
        raise HTTPException(status_code=400, detail="Glasses must be between 0 and 20")

    from datetime import date
    log_date = data.logged_date or str(date.today())

    try:
        existing = supabase_client.table('water_logs') \
            .select('id, glasses') \
            .eq('user_id', data.user_id) \
            .eq('logged_date', log_date) \
            .execute()

        if existing.data:
            record_id = existing.data[0]['id']
            supabase_client.table('water_logs') \
                .update({'glasses': data.glasses}) \
                .eq('id', record_id) \
                .execute()
        else:
            supabase_client.table('water_logs').insert({
                'user_id': data.user_id,
                'glasses': data.glasses,
                'logged_date': log_date
            }).execute()

        return {"success": True, "glasses": data.glasses, "date": log_date}

    except Exception as e:
        print(f"Water log error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save water log")

@router.get("/today/{user_id}", response_model=WaterTodayResponse)
def get_today_water(user_id: str):
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database not connected")

    from datetime import date
    today = str(date.today())

    try:
        result = supabase_client.table('water_logs') \
            .select('glasses') \
            .eq('user_id', user_id) \
            .eq('logged_date', today) \
            .execute()

        glasses = result.data[0]['glasses'] if result.data else 0
        goal = 8
        percentage = round((glasses / goal) * 100, 1)

        if glasses == 0:
            message = "Start your day with a glass of water!"
        elif glasses < 4:
            message = f"Good start! {goal - glasses} more glasses to reach your goal."
        elif glasses < goal:
            message = f"Almost there! Just {goal - glasses} more glasses."
        else:
            message = "Goal reached! Great job staying hydrated."

        return WaterTodayResponse(
            glasses=glasses,
            goal=goal,
            percentage=min(percentage, 100.0),
            message=message
        )

    except Exception as e:
        print(f"Water fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch water data")

@router.get("/history/{user_id}")
def get_water_history(user_id: str):
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        result = supabase_client.table('water_logs') \
            .select('glasses, logged_date') \
            .eq('user_id', user_id) \
            .order('logged_date', desc=True) \
            .limit(7) \
            .execute()

        return {"data": result.data or []}

    except Exception as e:
        print(f"Water history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch water history")