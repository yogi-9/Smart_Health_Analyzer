from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from mental_health_analyzer import MentalHealthAnalyzer
mental_analyzer = MentalHealthAnalyzer()

router = APIRouter(prefix="/mental", tags=["Mental Health"])

class MentalHealthInput(BaseModel):
    # PHQ-9: 9 questions about depression (0=not at all, 3=nearly every day)
    phq9_q1: int  # Little interest or pleasure in doing things
    phq9_q2: int  # Feeling down, depressed, or hopeless
    phq9_q3: int  # Trouble sleeping or sleeping too much
    phq9_q4: int  # Feeling tired or having little energy
    phq9_q5: int  # Poor appetite or overeating
    phq9_q6: int  # Feeling bad about yourself
    phq9_q7: int  # Trouble concentrating
    phq9_q8: int  # Moving or speaking slowly / being fidgety
    phq9_q9: int  # Thoughts of being better off dead

    # GAD-7: 7 questions about anxiety (0=not at all, 3=nearly every day)
    gad7_q1: int  # Feeling nervous or anxious
    gad7_q2: int  # Not being able to stop worrying
    gad7_q3: int  # Worrying too much about different things
    gad7_q4: int  # Trouble relaxing
    gad7_q5: int  # Being so restless it's hard to sit still
    gad7_q6: int  # Becoming easily annoyed or irritable
    gad7_q7: int  # Feeling afraid something awful might happen

class MentalHealthResult(BaseModel):
    phq9_score: int
    gad7_score: int
    depression_level: str
    anxiety_level: str
    mental_health_score: int
    tips: List[str]
    seek_help: bool
    message: str

@router.post("/analyze", response_model=MentalHealthResult)
def analyze_mental_health(data: MentalHealthInput):
    if mental_analyzer is None:
        raise HTTPException(status_code=503,
            detail="Mental health model not loaded")

    phq9 = [data.phq9_q1, data.phq9_q2, data.phq9_q3,
            data.phq9_q4, data.phq9_q5, data.phq9_q6,
            data.phq9_q7, data.phq9_q8, data.phq9_q9]

    gad7 = [data.gad7_q1, data.gad7_q2, data.gad7_q3,
            data.gad7_q4, data.gad7_q5, data.gad7_q6,
            data.gad7_q7]

    # Validate scores
    for score in phq9 + gad7:
        if score < 0 or score > 3:
            raise HTTPException(status_code=400,
                detail="All scores must be between 0 and 3")

    result = mental_analyzer.analyze(phq9, gad7)

    # Add message
    if result['depression_level'] in ['Severe', 'Moderately Severe'] or \
       result['anxiety_level'] == 'Severe':
        message = "Your results suggest you may be experiencing significant distress. Please consider speaking with a mental health professional."
    elif result['depression_level'] == 'Moderate' or \
         result['anxiety_level'] == 'Moderate':
        message = "Your results suggest moderate symptoms. Lifestyle changes and support can help significantly."
    elif result['depression_level'] == 'Mild' or \
         result['anxiety_level'] == 'Mild':
        message = "Your results suggest mild symptoms. Small daily habits can make a big difference."
    else:
        message = "Your mental health looks good! Keep maintaining healthy habits."

    result['message'] = message
    return result