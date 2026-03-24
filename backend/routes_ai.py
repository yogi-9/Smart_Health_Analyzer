from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json, httpx

router = APIRouter(prefix="/ai", tags=["AI"])

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


# ─── Models ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    user_context: Optional[str] = None

class MealRequest(BaseModel):
    health_context: Optional[str] = None
    preferences: Optional[str] = None


# ─── Chat endpoint (AI Coach) ───────────────────────────────────────

@router.post("/chat")
async def ai_chat(req: ChatRequest):
    if not GEMINI_KEY:
        # Fallback when no key configured
        return {"reply": "I'm currently offline. Please check back later or ask your doctor for advice."}

    system = req.system_prompt or "You are a friendly, supportive health coach. Give short, practical advice. Use simple language."
    if req.user_context:
        system += f"\n\nUser's health data:\n{req.user_context}"

    # Convert messages to Gemini format
    contents = []
    for msg in req.messages:
        contents.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}]
        })

    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 500,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{GEMINI_URL}?key={GEMINI_KEY}", json=payload)
            if r.status_code != 200:
                print(f"Gemini error: {r.status_code} {r.text[:300]}")
                return {"reply": "Sorry, I couldn't process that right now. Please try again."}

            data = r.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": text}
    except Exception as e:
        print(f"AI chat error: {e}")
        return {"reply": "Connection issue. Please try again in a moment."}


# ─── Meal plan endpoint (AI Meals) ──────────────────────────────────

MEAL_PROMPT = """Generate a personalized Indian meal plan.
{context}
{prefs}

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{{
  "meals": [
    {{"type": "Breakfast", "name": "...", "ingredients": "...", "calories": 350, "prep_time": "15 min"}},
    {{"type": "Lunch", "name": "...", "ingredients": "...", "calories": 500, "prep_time": "30 min"}},
    {{"type": "Dinner", "name": "...", "ingredients": "...", "calories": 450, "prep_time": "25 min"}},
    {{"type": "Snacks", "name": "...", "ingredients": "...", "calories": 200, "prep_time": "5 min"}}
  ],
  "total_calories": 1500
}}"""

FALLBACK_MEALS = {
    "meals": [
        {"type": "Breakfast", "name": "Poha with Vegetables", "ingredients": "Flattened rice, onion, peas, turmeric, lemon", "calories": 320, "prep_time": "15 min"},
        {"type": "Lunch", "name": "Dal Chawal with Sabzi", "ingredients": "Toor dal, rice, seasonal vegetables, roti", "calories": 520, "prep_time": "30 min"},
        {"type": "Dinner", "name": "Chapati with Paneer Bhurji", "ingredients": "Whole wheat chapati, paneer, tomato, onion", "calories": 450, "prep_time": "25 min"},
        {"type": "Snacks", "name": "Fruit Chaat & Green Tea", "ingredients": "Apple, banana, pomegranate, chaat masala", "calories": 180, "prep_time": "5 min"},
    ],
    "total_calories": 1470
}

@router.post("/meal-plan")
async def ai_meal_plan(req: MealRequest):
    if not GEMINI_KEY:
        return FALLBACK_MEALS

    prompt = MEAL_PROMPT.format(
        context=f"User health: {req.health_context}" if req.health_context else "",
        prefs=f"Preferences: {req.preferences}" if req.preferences else ""
    )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 800}
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{GEMINI_URL}?key={GEMINI_KEY}", json=payload)
            if r.status_code != 200:
                print(f"Gemini meal error: {r.status_code}")
                return FALLBACK_MEALS

            data = r.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

            meal_plan = json.loads(text)
            return meal_plan
    except Exception as e:
        print(f"Meal plan error: {e}")
        return FALLBACK_MEALS
