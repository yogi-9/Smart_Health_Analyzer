 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Smart Health Analyzer API",
    description="ML-powered health risk prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthInput(BaseModel):
    age: int
    gender: int
    height: float
    weight: float
    systolic_bp: int
    diastolic_bp: int
    cholesterol: int
    glucose: int
    smoking: int

class PredictionResult(BaseModel):
    risk_level: str
    risk_score: float
    message: str
    tips: list[str]

@app.get("/")
def root():
    return {
        "message": "Smart Health Analyzer API is running",
        "status": "ok",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictionResult)
def predict(data: HealthInput):
    bmi = data.weight / ((data.height / 100) ** 2)
    score = 0

    if data.age > 50: score += 20
    elif data.age > 35: score += 10

    if bmi > 30: score += 20
    elif bmi > 25: score += 10

    if data.systolic_bp > 140: score += 20
    elif data.systolic_bp > 120: score += 10

    if data.cholesterol > 240: score += 15
    elif data.cholesterol > 200: score += 8

    if data.glucose > 126: score += 15
    elif data.glucose > 100: score += 8

    if data.smoking == 1: score += 15

    if score >= 60:
        risk_level = "High"
        message = "High health risk detected. Please consult a doctor."
        tips = [
            "Visit a doctor for a full checkup immediately",
            "Reduce sodium and saturated fat in your diet",
            "Start light exercise — even 20 min walking daily helps",
        ]
    elif score >= 30:
        risk_level = "Medium"
        message = "Moderate health risk. Some lifestyle changes recommended."
        tips = [
            "Exercise at least 30 minutes 5 days a week",
            "Reduce processed food and sugar intake",
            "Monitor your blood pressure weekly",
        ]
    else:
        risk_level = "Low"
        message = "Low health risk. Keep up the good work!"
        tips = [
            "Maintain your current healthy habits",
            "Stay hydrated — drink 8 glasses of water daily",
            "Get 7-8 hours of sleep every night",
        ]

    return PredictionResult(
        risk_level=risk_level,
        risk_score=round(score, 1),
        message=message,
        tips=tips
    )
