from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from models_loader import diabetes_model, diabetes_features
from database import supabase_client

router = APIRouter(prefix="/diabetes", tags=["Diabetes"])

class DiabetesInput(BaseModel):
    pregnancies: int
    glucose: float
    blood_pressure: float
    skin_thickness: float
    insulin: float
    bmi: float
    diabetes_pedigree: float
    age: int
    user_id: Optional[str] = None

class DiabetesResult(BaseModel):
    diabetes_probability: float
    risk_level: str
    risk_score: float
    message: str
    tips: List[str]
    saved: bool = False

def get_diabetes_tips(risk_level, data):
    tips = []
    if data.glucose > 140:
        tips.append("Your glucose is high — reduce sugary foods, white rice, and refined carbs")
        tips.append("Eat smaller meals more frequently to keep blood sugar stable")
    if data.bmi > 30:
        tips.append("Losing even 5-10% of body weight significantly reduces diabetes risk")
        tips.append("Try 30 minutes of brisk walking daily — it improves insulin sensitivity")
    if data.blood_pressure > 90:
        tips.append("Reduce salt intake and avoid processed foods to manage blood pressure")
    if risk_level == "High":
        tips.append("Get a HbA1c blood test — it gives a 3-month average of blood sugar levels")
        tips.append("Consult a doctor about diabetes prevention if recommended")
    elif risk_level == "Medium":
        tips.append("Consider getting a fasting blood glucose test annually")
    tips.extend([
        "Replace white rice with brown rice or millets in your meals",
        "Drink 8-10 glasses of water daily",
        "Eat whole fruits instead of fruit juices for the fiber"
    ])
    return tips[:6]

@router.post("/predict", response_model=DiabetesResult)
def predict_diabetes(data: DiabetesInput):
    if diabetes_model is None:
        raise HTTPException(status_code=503, detail="Diabetes model not loaded")

    input_df = pd.DataFrame([[
        data.pregnancies, data.glucose, data.blood_pressure,
        data.skin_thickness, data.insulin, data.bmi,
        data.diabetes_pedigree, data.age
    ]], columns=diabetes_features)

    probability = float(diabetes_model.predict_proba(input_df)[0][1])
    risk_score = round(probability * 100, 1)

    if probability > 0.6:
        risk_level = "High"
        message = "High diabetes risk detected. Please consult a doctor for proper diagnosis."
    elif probability > 0.3:
        risk_level = "Medium"
        message = "Moderate diabetes risk. Lifestyle changes can significantly reduce your risk."
    else:
        risk_level = "Low"
        message = "Low diabetes risk. Keep maintaining your healthy lifestyle!"

    tips = get_diabetes_tips(risk_level, data)
    saved = False

    if data.user_id and supabase_client:
        try:
            # Save health record first
            record = supabase_client.table('health_records').insert({
                'user_id': data.user_id,
                'systolic_bp': 120,
                'diastolic_bp': int(data.blood_pressure),
                'cholesterol': 200,
                'glucose': int(data.glucose),
                'smoking': False,
                'bmi': float(data.bmi)
            }).execute()

            record_id = record.data[0]['id']

            # Save prediction
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
            print(f"Failed to save diabetes record: {e}")

    return DiabetesResult(
        diabetes_probability=round(probability * 100, 1),
        risk_level=risk_level,
        risk_score=risk_score,
        message=message,
        tips=tips,
        saved=saved
    )