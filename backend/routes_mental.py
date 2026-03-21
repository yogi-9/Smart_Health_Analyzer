from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from mental_health_analyzer import MentalHealthAnalyzer
from database import supabase_client

router = APIRouter(prefix="/mental", tags=["Mental Health"])
mental_analyzer = MentalHealthAnalyzer()

class MentalHealthInput(BaseModel):
    phq9_q1: int
    phq9_q2: int
    phq9_q3: int
    phq9_q4: int
    phq9_q5: int
    phq9_q6: int
    phq9_q7: int
    phq9_q8: int
    phq9_q9: int
    gad7_q1: int
    gad7_q2: int
    gad7_q3: int
    gad7_q4: int
    gad7_q5: int
    gad7_q6: int
    gad7_q7: int
    user_id: Optional[str] = None

class MentalHealthResult(BaseModel):
    phq9_score: int
    gad7_score: int
    depression_level: str
    anxiety_level: str
    mental_health_score: int
    tips: List[str]
    seek_help: bool
    message: str
    saved: bool = False

@router.post("/analyze", response_model=MentalHealthResult)
def analyze_mental_health(data: MentalHealthInput):
    phq9 = [data.phq9_q1, data.phq9_q2, data.phq9_q3,
            data.phq9_q4, data.phq9_q5, data.phq9_q6,
            data.phq9_q7, data.phq9_q8, data.phq9_q9]
    gad7 = [data.gad7_q1, data.gad7_q2, data.gad7_q3,
            data.gad7_q4, data.gad7_q5, data.gad7_q6,
            data.gad7_q7]

    for score in phq9 + gad7:
        if score < 0 or score > 3:
            raise HTTPException(status_code=400,
                detail="All scores must be between 0 and 3")

    result = mental_analyzer.analyze(phq9, gad7)

    if result['depression_level'] in ['Severe', 'Moderately Severe'] or \
       result['anxiety_level'] == 'Severe':
        message = "Your results suggest significant distress. Please consider speaking with a mental health professional."
    elif result['depression_level'] == 'Moderate' or \
         result['anxiety_level'] == 'Moderate':
        message = "Your results suggest moderate symptoms. Lifestyle changes and support can help significantly."
    elif result['depression_level'] == 'Mild' or \
         result['anxiety_level'] == 'Mild':
        message = "Your results suggest mild symptoms. Small daily habits can make a big difference."
    else:
        message = "Your mental health looks good! Keep maintaining healthy habits."

    result['message'] = message
    saved = False

    # Save to Supabase if user_id provided
    if data.user_id and supabase_client:
        try:
            supabase_client.table('mental_health_records').insert({
                'user_id': data.user_id,
                'phq9_score': result['phq9_score'],
                'gad7_score': result['gad7_score'],
                'depression_level': result['depression_level'],
                'anxiety_level': result['anxiety_level'],
                'mental_health_score': result['mental_health_score'],
                'tips': result['tips'],
                'seek_help': result['seek_help'],
                'message': message
            }).execute()
            saved = True
        except Exception as e:
            print(f"Failed to save mental health record: {e}")

    result['saved'] = saved
    return result