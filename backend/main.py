from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

from routes_mental import router as mental_router
from routes_diabetes import router as diabetes_router
from routes_heart import router as heart_router

app = FastAPI(
    title="Smart Health Analyzer API",
    description="ML-powered health risk prediction — Mental Health, Diabetes, Heart Disease",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://smart-health-analyzer.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(mental_router)
app.include_router(diabetes_router)
app.include_router(heart_router)

@app.get("/")
def root():
    return {
        "message": "Smart Health Analyzer API is running",
        "status": "ok",
        "version": "2.0.0",
        "modules": ["mental_health", "diabetes", "heart_disease"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
