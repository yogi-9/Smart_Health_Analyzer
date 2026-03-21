from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
from models_loader import diabetes_model, diabetes_features

router = APIRouter(prefix="/diabetes", tags=["Diabetes"])

class DiabetesInput(BaseModel):
    pregnancies: int       # Number of pregnancies (0 if male)
    glucose: float         # Plasma glucose concentration (mg/dL)
    blood_pressure: float  # Diastolic blood pressure (mm Hg)
    skin_thickness: float  # Triceps skin fold thickness (mm)
    insulin: float         # 2-Hour serum insulin (mu U/ml) - 0 if unknown
    bmi: float             # Body mass index
    diabetes_pedigree: float  # Diabetes pedigree function (family history)
    age: int               # Age in years

class DiabetesResult(BaseModel):
    diabetes_probability: float
    risk_level: str
    risk_score: float
    message: str
    tips: List[str]

def get_diabetes_tips(risk_level, data):
    tips = []

    if data.glucose > 140:
        tips.append("Your glucose level is high — reduce sugary foods, white rice, and refined carbs")
        tips.append("Eat smaller meals more frequently to keep blood sugar stable")

    if data.bmi > 30:
        tips.append("Losing even 5-10% of body weight can significantly reduce diabetes risk")
        tips.append("Try 30 minutes of brisk walking daily — it improves insulin sensitivity")

    if data.blood_pressure > 90:
        tips.append("Reduce salt intake and avoid processed foods to manage blood pressure")

    if risk_level == "High":
        tips.append("Get a HbA1c blood test — it gives a 3-month average of blood sugar levels")
        tips.append("Consult a doctor about diabetes prevention medication if recommended")
    elif risk_level == "Medium":
        tips.append("Consider getting a fasting blood glucose test annually")

    # General tips
    tips.extend([
        "Replace white rice with brown rice or millets in your meals",
        "Drink plenty of water — aim for 8-10 glasses daily",
        "Avoid fruit juices — eat whole fruits instead for the fiber"
    ])

    return tips[:6]

@router.post("/predict", response_model=DiabetesResult)
def predict_diabetes(data: DiabetesInput):
    if diabetes_model is None:
        raise HTTPException(status_code=503,
            detail="Diabetes model not loaded")

    # Create DataFrame with correct feature order
    input_df = pd.DataFrame([[
        data.pregnancies, data.glucose, data.blood_pressure,
        data.skin_thickness, data.insulin, data.bmi,
        data.diabetes_pedigree, data.age
    ]], columns=diabetes_features)

    # Predict
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

    return DiabetesResult(
        diabetes_probability=round(probability * 100, 1),
        risk_level=risk_level,
        risk_score=risk_score,
        message=message,
        tips=tips
    )
