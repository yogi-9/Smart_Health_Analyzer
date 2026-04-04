from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json, httpx, asyncio, time

router = APIRouter(prefix="/ai", tags=["AI"])

NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# Simple cache to avoid hammering the API
_cache = {}  # key -> (timestamp, response)
CACHE_TTL = 3600  # 1 hour


def get_nvidia_key():
    """Read key at call time, not import time, so .env is loaded first."""
    return os.getenv("NVIDIA_API_KEY")


async def nvidia_request(payload, retries=3):
    """Call NVIDIA API with automatic retry on 429 rate limit."""
    key = get_nvidia_key()
    if not key:
        raise HTTPException(status_code=503, detail="NVIDIA API key not configured")

    headers = {
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }

    last_response = None
    for attempt in range(retries):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(NVIDIA_URL, headers=headers, json=payload)
            last_response = r
            if r.status_code == 429:
                wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
                print(f"NVIDIA 429 rate limit, retrying in {wait}s (attempt {attempt+1}/{retries})")
                await asyncio.sleep(wait)
                continue
            return r
    return last_response  # Return last response even if still 429


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
    force_refresh: Optional[bool] = False


# ─── Chat endpoint (AI Coach) ───────────────────────────────────────

@router.post("/chat")
async def ai_chat(req: ChatRequest):
    key = get_nvidia_key()
    if not key:
        return {"reply": "I'm currently offline. Please check back later or ask your doctor for advice."}

    system = req.system_prompt or (
        "You are a friendly, supportive health coach. "
        "Give short, practical advice. Use simple language. "
        "Keep responses under 3 sentences."
    )
    if req.user_context:
        system += f"\n\nUser's health data:\n{req.user_context}"

    # Build OpenAI-compatible messages list
    messages = [{"role": "system", "content": system}]
    for msg in req.messages:
        role = "user" if msg.role == "user" else "assistant"
        messages.append({"role": role, "content": msg.content})

    # Ensure we have at least one user message beyond the system prompt
    if len(messages) == 1:
        return {"reply": "Please send me a message and I'll help you with your health questions!"}

    payload = {
        "model": "google/gemma-3n-e4b-it",
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.7,
        "stream": False,
    }

    try:
        r = await nvidia_request(payload)
        if r.status_code != 200:
            error_text = r.text[:500]
            print(f"NVIDIA error {r.status_code}: {error_text}")
            if r.status_code == 401:
                return {"reply": "API key issue. Please check your NVIDIA API key in the backend .env file."}
            if r.status_code == 429:
                return {"reply": "I'm getting a lot of questions right now! Please wait 30 seconds and try again."}
            return {"reply": "Sorry, I couldn't process that right now. Please try again."}

        data = r.json()
        text = data["choices"][0]["message"]["content"]
        return {"reply": text}
    except httpx.TimeoutException:
        return {"reply": "The AI took too long to respond. Please try a shorter question."}
    except HTTPException:
        return {"reply": "I'm currently offline. Please check back later or ask your doctor for advice."}
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
    key = get_nvidia_key()
    if not key:
        return FALLBACK_MEALS

    # Check cache first (skip if force_refresh requested)
    cache_key = f"meal:{req.health_context}:{req.preferences}"
    if not req.force_refresh and cache_key in _cache:
        ts, cached = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return cached

    prompt = MEAL_PROMPT.format(
        context=f"User health: {req.health_context}" if req.health_context else "",
        prefs=f"Preferences: {req.preferences}" if req.preferences else ""
    )

    payload = {
        "model": "google/gemma-3n-e4b-it",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 800,
        "temperature": 0.8,
        "top_p": 0.9,
        "stream": False,
    }

    try:
        r = await nvidia_request(payload)
        if r.status_code != 200:
            print(f"NVIDIA meal error: {r.status_code} {r.text[:200]}")
            return FALLBACK_MEALS

        data = r.json()
        text = data["choices"][0]["message"]["content"].strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        meal_plan = json.loads(text)
        _cache[cache_key] = (time.time(), meal_plan)  # Cache result
        return meal_plan
    except HTTPException:
        return FALLBACK_MEALS
    except Exception as e:
        print(f"Meal plan error: {type(e).__name__}: {e}")
        return FALLBACK_MEALS
