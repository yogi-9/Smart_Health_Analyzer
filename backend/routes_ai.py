from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json, httpx, asyncio, time

router = APIRouter(prefix="/ai", tags=["AI"])

# NVIDIA API (OpenAI-compatible endpoint — much higher rate limits than Gemini)
NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = "google/gemma-3n-e4b-it"

# Gemini API (fallback — free 15 req/min)
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Simple cache to avoid hammering the API
_cache = {}  # key -> (timestamp, response)
CACHE_TTL = 3600  # 1 hour


def get_nvidia_key():
    """Read key at call time, not import time, so .env is loaded first."""
    return os.getenv("NVIDIA_API_KEY")


def get_gemini_key():
    """Read Gemini key at call time."""
    return os.getenv("GEMINI_API_KEY")


def get_ai_provider():
    """Return (provider, key) — picks first available provider."""
    nvidia = get_nvidia_key()
    if nvidia:
        return ("nvidia", nvidia)
    gemini = get_gemini_key()
    if gemini:
        return ("gemini", gemini)
    return (None, None)


# Log which AI provider is configured on module load
_nvidia = os.getenv("NVIDIA_API_KEY")
_gemini = os.getenv("GEMINI_API_KEY")
print(f"AI config: NVIDIA={'✓' if _nvidia else '✗'}, Gemini={'✓' if _gemini else '✗'}")
if not _nvidia and not _gemini:
    print("⚠️  WARNING: No AI API key configured! Set NVIDIA_API_KEY or GEMINI_API_KEY in .env / Render environment")


async def nvidia_request(key, messages, system_prompt=None, max_tokens=400, temperature=0.7, retries=2):
    """Call NVIDIA API with automatic retry on failure."""
    # Build messages list — OpenAI format
    all_messages = []
    if system_prompt:
        all_messages.append({"role": "system", "content": system_prompt})
    all_messages.extend(messages)

    payload = {
        "model": NVIDIA_MODEL,
        "messages": all_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.7,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(NVIDIA_URL, headers=headers, json=payload)
                if r.status_code == 429:
                    wait = 2 ** (attempt + 1)
                    print(f"NVIDIA 429 rate limit, retrying in {wait}s (attempt {attempt+1}/{retries})")
                    await asyncio.sleep(wait)
                    continue
                return r
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(2)
                continue
            raise e
    return r


async def gemini_chat(key, messages, system_prompt=None, max_tokens=400, temperature=0.7):
    """Call Gemini API as fallback."""
    contents = []
    for msg in messages:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }
    if system_prompt:
        payload["system_instruction"] = {"parts": [{"text": system_prompt}]}

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{GEMINI_URL}?key={key}", json=payload)
        return r


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
    provider, key = get_ai_provider()
    if not key:
        return {"reply": "I'm currently offline. Please check back later or ask your doctor for advice."}

    system = (
        "You are a friendly, supportive health coach for the Smart Health Analyzer app. "
        "Your expertise covers: health, nutrition, fitness, wellness, medical conditions, "
        "mental health, diet, exercise, hydration, sleep, disease prevention, medications, "
        "prescriptions, home remedies, first aid, and healthy lifestyle tips.\n\n"
        "IMPORTANT RULES:\n"
        "1. Since this is a health app, ALWAYS assume the user's question is health-related "
        "unless it is CLEARLY and OBVIOUSLY about a non-health topic.\n"
        "2. For vague or short messages like 'help tip', 'give me advice', 'well prescribed', "
        "'tips please', etc. — treat them as health/wellness questions and provide useful health tips.\n"
        "3. ONLY decline if the user EXPLICITLY asks about clearly unrelated topics such as: "
        "writing code, solving math equations, political opinions, movie reviews, sports scores, "
        "homework help, recipes for non-health purposes, or other obviously non-health subjects.\n"
        "4. When declining, say: 'I'm your Smart Health Analyzer assistant — I specialize in health, "
        "nutrition, and wellness topics. Try asking me about diet tips, exercise routines, or health advice!'\n"
        "5. Give short, practical health advice. Use simple language. Keep responses under 3-4 sentences."
    )
    if req.user_context:
        system += f"\n\nUser's health data:\n{req.user_context}"

    # Convert messages to standard format
    messages = []
    for msg in req.messages:
        role = "user" if msg.role == "user" else "assistant"
        messages.append({"role": role, "content": msg.content})

    # Ensure we have at least one user message
    if not messages:
        return {"reply": "Please send me a message and I'll help you with your health questions!"}

    # NVIDIA requires strict user/assistant alternation starting with "user"
    # 1. Strip leading assistant messages (e.g. the welcome greeting)
    while messages and messages[0]["role"] == "assistant":
        messages.pop(0)

    if not messages:
        return {"reply": "Please send me a message and I'll help you with your health questions!"}

    # 2. Merge consecutive same-role messages to enforce alternation
    merged = [messages[0]]
    for msg in messages[1:]:
        if msg["role"] == merged[-1]["role"]:
            merged[-1]["content"] += "\n" + msg["content"]
        else:
            merged.append(msg)
    messages = merged

    try:
        if provider == "nvidia":
            r = await nvidia_request(key, messages, system_prompt=system, max_tokens=1024, temperature=0.7)
            if r.status_code != 200:
                error_text = r.text[:500]
                print(f"NVIDIA error {r.status_code}: {error_text}")
                # Try Gemini fallback
                gemini_key = get_gemini_key()
                if gemini_key:
                    print("Falling back to Gemini...")
                    r = await gemini_chat(gemini_key, messages, system_prompt=system, max_tokens=1024)
                    if r.status_code == 200:
                        data = r.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {"reply": text}
                if r.status_code == 401:
                    return {"reply": "API key issue. Please check your NVIDIA API key."}
                if r.status_code == 429:
                    return {"reply": "I'm getting a lot of questions right now! Please wait a moment and try again."}
                return {"reply": "Sorry, I couldn't process that right now. Please try again."}

            data = r.json()
            text = data["choices"][0]["message"]["content"]
            return {"reply": text}

        elif provider == "gemini":
            r = await gemini_chat(key, messages, system_prompt=system, max_tokens=1024)
            if r.status_code != 200:
                print(f"Gemini error {r.status_code}: {r.text[:500]}")
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
    provider, key = get_ai_provider()
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

    try:
        if provider == "nvidia":
            messages = [{"role": "user", "content": prompt}]
            system = "You are a nutritionist. Return ONLY valid JSON, no markdown, no explanation."
            r = await nvidia_request(key, messages, system_prompt=system, max_tokens=800, temperature=0.8)
            if r.status_code != 200:
                # Try Gemini fallback
                gemini_key = get_gemini_key()
                if gemini_key:
                    r = await gemini_chat(gemini_key, [{"role": "user", "content": prompt}],
                                          system_prompt=system, max_tokens=800, temperature=0.8)
                    if r.status_code == 200:
                        data = r.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if text.startswith("```"):
                            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                        meal_plan = json.loads(text)
                        _cache[cache_key] = (time.time(), meal_plan)
                        return meal_plan
                print(f"NVIDIA meal error: {r.status_code} {r.text[:200]}")
                return FALLBACK_MEALS

            data = r.json()
            text = data["choices"][0]["message"]["content"].strip()

        elif provider == "gemini":
            system = "You are a nutritionist. Return ONLY valid JSON, no markdown, no explanation."
            r = await gemini_chat(key, [{"role": "user", "content": prompt}],
                                  system_prompt=system, max_tokens=800, temperature=0.8)
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


# ─── Debug/Status endpoint ──────────────────────────────────────────

@router.get("/status")
async def ai_status():
    """Check which AI provider is configured."""
    nvidia = bool(get_nvidia_key())
    gemini = bool(get_gemini_key())
    return {
        "nvidia_configured": nvidia,
        "gemini_configured": gemini,
        "active_provider": "nvidia" if nvidia else ("gemini" if gemini else "none"),
        "status": "ready" if (nvidia or gemini) else "no_api_key",
    }

