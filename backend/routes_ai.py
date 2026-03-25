from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json, httpx, asyncio, time

router = APIRouter(prefix="/ai", tags=["AI"])

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

# Simple cache to avoid hammering Gemini
_cache = {}  # key -> (timestamp, response)
CACHE_TTL = 3600  # 1 hour


def get_gemini_key():
    """Read key at call time, not import time, so .env is loaded first."""
    return os.getenv("GEMINI_API_KEY")


async def gemini_request(key, payload, retries=3):
    """Call Gemini with automatic retry on 429 rate limit."""
    for attempt in range(retries):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{GEMINI_URL}?key={key}", json=payload)
            if r.status_code == 429:
                wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
                print(f"Gemini 429 rate limit, retrying in {wait}s (attempt {attempt+1}/{retries})")
                await asyncio.sleep(wait)
                continue
            return r
    return r  # Return last response even if still 429


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
    key = get_gemini_key()
    if not key:
        return {"reply": "I'm currently offline. Please check back later or ask your doctor for advice."}

    system = req.system_prompt or "You are a friendly, supportive health coach. Give short, practical advice. Use simple language. Keep responses under 3 sentences."
    if req.user_context:
        system += f"\n\nUser's health data:\n{req.user_context}"

    # Convert messages to Gemini format
    # IMPORTANT: Gemini requires first message to be role=user
    # Filter out any assistant/model messages at the start
    contents = []
    started = False
    for msg in req.messages:
        role = "user" if msg.role == "user" else "model"
        if not started and role == "model":
            continue  # Skip leading AI messages
        started = True
        contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })

    # Ensure we have at least one user message
    if not contents:
        return {"reply": "Please send me a message and I'll help you with your health questions!"}

    # Gemini requires alternating roles - merge consecutive same-role messages
    merged = [contents[0]]
    for c in contents[1:]:
        if c["role"] == merged[-1]["role"]:
            merged[-1]["parts"][0]["text"] += "\n" + c["parts"][0]["text"]
        else:
            merged.append(c)

    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": merged,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 400,
        }
    }

    try:
        r = await gemini_request(key, payload)
        if r.status_code != 200:
            error_text = r.text[:500]
            print(f"Gemini error {r.status_code}: {error_text}")
            if "API_KEY" in error_text.upper():
                return {"reply": "API key issue. Please check your Gemini API key in the backend .env file."}
            if r.status_code == 429:
                return {"reply": "I'm getting a lot of questions right now! Please wait 30 seconds and try again."}
            return {"reply": "Sorry, I couldn't process that right now. Please try again."}

        data = r.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"reply": text}
    except httpx.TimeoutException:
        return {"reply": "The AI took too long to respond. Please try a shorter question."}
    except Exception as e:
        print(f"AI chat error: {type(e).__name__}: {e}")
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
    key = get_gemini_key()
    if not key:
        return FALLBACK_MEALS

    # Check cache first
    cache_key = f"meal:{req.health_context}:{req.preferences}"
    if cache_key in _cache:
        ts, cached = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return cached

    prompt = MEAL_PROMPT.format(
        context=f"User health: {req.health_context}" if req.health_context else "",
        prefs=f"Preferences: {req.preferences}" if req.preferences else ""
    )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 800}
    }

    try:
        r = await gemini_request(key, payload)
        if r.status_code != 200:
            print(f"Gemini meal error: {r.status_code} {r.text[:200]}")
            return FALLBACK_MEALS

        data = r.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        meal_plan = json.loads(text)
        _cache[cache_key] = (time.time(), meal_plan)  # Cache result
        return meal_plan
    except Exception as e:
        print(f"Meal plan error: {type(e).__name__}: {e}")
        return FALLBACK_MEALS
