from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from models_loader import heart_model, heart_features
from database import supabase_client

router = APIRouter(prefix="/heart", tags=["Heart Disease"])

class HeartInput(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    fbs: int
    restecg: int
    thalach: int
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int
    user_id: Optional[str] = None

class HeartResult(BaseModel):
    heart_disease_probability: float
    risk_level: str
    risk_score: float
    message: str
    tips: List[str]
    saved: bool = False

def get_heart_tips(risk_level, data):
    tips = []
    if data.chol > 240:
        tips.append("Your cholesterol is high — reduce saturated fats, fried food, and red meat")
        tips.append("Eat more fiber-rich foods like oats, beans, and vegetables")
    if data.trestbps > 140:
        tips.append("Your blood pressure is elevated — reduce salt, alcohol, and manage stress")
        tips.append("Monitor your blood pressure at home regularly")
    if data.fbs == 1:
        tips.append("High fasting blood sugar increases heart risk — manage your diabetes carefully")
    if data.exang == 1:
        tips.append("Exercise-induced chest pain needs medical evaluation — see a cardiologist")
    if risk_level == "High":
        tips.append("Get an ECG and echocardiogram done — early detection saves lives")
        tips.append("Avoid smoking completely — it doubles heart disease risk")
    tips.extend([
        "Eat a heart-healthy diet rich in fruits, vegetables, and whole grains",
        "Manage stress through yoga, meditation, or deep breathing exercises",
        "Get 7-8 hours of quality sleep every night"
    ])
    return tips[:6]

@router.post("/predict", response_model=HeartResult)
def predict_heart_disease(data: HeartInput):
    if heart_model is None:
        raise HTTPException(status_code=503, detail="Heart disease model not loaded")

    input_df = pd.DataFrame([[
        data.age, data.sex, data.cp, data.trestbps,
        data.chol, data.fbs, data.restecg, data.thalach,
        data.exang, data.oldpeak, data.slope, data.ca, data.thal
    ]], columns=heart_features)

    probability = float(heart_model.predict_proba(input_df)[0][1])
    risk_score = round(probability * 100, 1)

    if probability > 0.6:
        risk_level = "High"
        message = "High heart disease risk detected. Please consult a cardiologist immediately."
    elif probability > 0.3:
        risk_level = "Medium"
        message = "Moderate heart disease risk. Lifestyle changes are strongly recommended."
    else:
        risk_level = "Low"
        message = "Low heart disease risk. Keep up your heart-healthy lifestyle!"

    tips = get_heart_tips(risk_level, data)
    saved = False

    if data.user_id and supabase_client:
        try:
            record = supabase_client.table('health_records').insert({
                'user_id': data.user_id,
                'systolic_bp': data.trestbps,
                'diastolic_bp': 80,
                'cholesterol': data.chol,
                'glucose': 100,
                'smoking': False,
                'bmi': 25.0
            }).execute()

            record_id = record.data[0]['id']

            supabase_client.table('predictions').insert({
                'user_id': data.user_id,
                'record_id': record_id,
                'risk_level': risk_level,
                'risk_score': risk_score,
                'message': message,
                'tips': tips
            }).execute()
            saved = True
        except Exception as e:
            print(f"Failed to save heart record: {e}")

    return HeartResult(
        heart_disease_probability=round(probability * 100, 1),
        risk_level=risk_level,
        risk_score=risk_score,
        message=message,
        tips=tips,
        saved=saved
    )
