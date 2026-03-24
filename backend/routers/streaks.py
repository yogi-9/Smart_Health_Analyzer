# backend/routers/streaks.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from database import supabase_client

router = APIRouter(prefix="/streaks", tags=["streaks"])


class StreakInput(BaseModel):
    user_id: str
    streak_type: Optional[str] = "login"  # login, water, food, health


# ─── Badge definitions ───────────────────────────────────────────────

BADGE_RULES = [
    {"name": "first_check",      "label": "⭐ First Check",       "condition": lambda s: any(x["streak_type"] == "health" and x["current_streak"] >= 1 for x in s)},
    {"name": "hydration_hero",   "label": "💧 Hydration Hero",    "condition": lambda s: any(x["streak_type"] == "water" and x["current_streak"] >= 7 for x in s)},
    {"name": "nutrition_ninja",  "label": "🥗 Nutrition Ninja",   "condition": lambda s: any(x["streak_type"] == "food" and x["current_streak"] >= 7 for x in s)},
    {"name": "heart_guardian",   "label": "❤️ Heart Guardian",    "condition": lambda s: any(x["streak_type"] == "health" and x["current_streak"] >= 3 for x in s)},
    {"name": "streak_master",    "label": "🔥 Streak Master",     "condition": lambda s: any(x["streak_type"] == "login" and x["current_streak"] >= 14 for x in s)},
    {"name": "thirty_day_champ", "label": "🏆 30-Day Champion",   "condition": lambda s: any(x["current_streak"] >= 30 for x in s)},
]


# ─── Get all streaks ─────────────────────────────────────────────────

@router.get("/")
def get_streaks(user_id: str):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
        result = (
            supabase_client.table("streaks")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        streaks = result.data or []

        # Calculate overall streak (max of all types)
        overall = max((s["current_streak"] for s in streaks), default=0)
        longest = max((s["longest_streak"] for s in streaks), default=0)

        # Build per-type summary
        summary = {}
        for s in streaks:
            summary[s["streak_type"]] = {
                "current": s["current_streak"],
                "longest": s["longest_streak"],
                "last_date": s["last_activity_date"],
            }

        return {
            "success": True,
            "overall_streak": overall,
            "longest_streak": longest,
            "streaks": summary,
            "raw": streaks,
        }
    except Exception as e:
        raise HTTPException(400, str(e))


# ─── Record a streak ─────────────────────────────────────────────────

@router.post("/record")
def record_streak(data: StreakInput):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
        today = date.today()
        yesterday = today - timedelta(days=1)
        stype = data.streak_type

        existing = (
            supabase_client.table("streaks")
            .select("*")
            .eq("user_id", data.user_id)
            .eq("streak_type", stype)
            .execute()
        )

        if existing.data:
            row = existing.data[0]
            last_date = row["last_activity_date"]

            if last_date == str(today):
                return {
                    "success": True,
                    "message": f"Already recorded {stype} today",
                    "current_streak": row["current_streak"],
                }

            new_streak = row["current_streak"] + 1 if last_date == str(yesterday) else 1
            longest = max(row["longest_streak"], new_streak)

            supabase_client.table("streaks").update({
                "current_streak": new_streak,
                "longest_streak": longest,
                "last_activity_date": str(today),
                "updated_at": "now()",
            }).eq("id", row["id"]).execute()

            # Log activity
            try:
                supabase_client.table("streak_logs").insert({
                    "user_id": data.user_id,
                    "streak_type": stype,
                    "activity_date": str(today),
                }).execute()
            except Exception:
                pass  # Ignore duplicate log errors

            return {"success": True, "current_streak": new_streak, "longest_streak": longest}
        else:
            supabase_client.table("streaks").insert({
                "user_id": data.user_id,
                "streak_type": stype,
                "current_streak": 1,
                "longest_streak": 1,
                "last_activity_date": str(today),
            }).execute()

            try:
                supabase_client.table("streak_logs").insert({
                    "user_id": data.user_id,
                    "streak_type": stype,
                    "activity_date": str(today),
                }).execute()
            except Exception:
                pass

            return {"success": True, "current_streak": 1, "longest_streak": 1}

    except Exception as e:
        raise HTTPException(400, str(e))


# ─── Login streak (backward compatible) ──────────────────────────────

@router.post("/login")
def record_login_streak(data: StreakInput):
    data.streak_type = "login"
    return record_streak(data)


# ─── Get badges ──────────────────────────────────────────────────────

@router.get("/badges")
def get_badges(user_id: str):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
        # Get user's streaks
        streak_res = supabase_client.table("streaks").select("*").eq("user_id", user_id).execute()
        streaks = streak_res.data or []

        # Get already earned badges
        badge_res = supabase_client.table("badges").select("*").eq("user_id", user_id).execute()
        earned = {b["badge_name"] for b in (badge_res.data or [])}

        # Check and award new badges
        all_badges = []
        newly_earned = []

        for rule in BADGE_RULES:
            is_earned = rule["name"] in earned
            qualifies = rule["condition"](streaks)

            if qualifies and not is_earned:
                # Award badge!
                try:
                    supabase_client.table("badges").insert({
                        "user_id": user_id,
                        "badge_name": rule["name"],
                    }).execute()
                    is_earned = True
                    newly_earned.append(rule["label"])
                except Exception:
                    pass

            all_badges.append({
                "name": rule["name"],
                "label": rule["label"],
                "earned": is_earned or qualifies,
            })

        return {
            "success": True,
            "badges": all_badges,
            "newly_earned": newly_earned,
        }
    except Exception as e:
        raise HTTPException(400, str(e))


# ─── Activity heatmap (last 90 days) ─────────────────────────────────

@router.get("/heatmap")
def get_heatmap(user_id: str):
    if not supabase_client:
        raise HTTPException(500, "Database not configured")
    try:
        since = str(date.today() - timedelta(days=90))
        result = (
            supabase_client.table("streak_logs")
            .select("activity_date, streak_type")
            .eq("user_id", user_id)
            .gte("activity_date", since)
            .execute()
        )
        # Count activities per date
        heatmap = {}
        for log in (result.data or []):
            d = log["activity_date"]
            heatmap[d] = heatmap.get(d, 0) + 1

        return {"success": True, "heatmap": heatmap}
    except Exception as e:
        raise HTTPException(400, str(e))