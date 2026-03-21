import joblib
import os
import sys

# Add backend directory to path so MentalHealthAnalyzer can be found
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Import the class BEFORE loading the pkl file
from mental_health_analyzer import MentalHealthAnalyzer

def load_model(filename):
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")
    return joblib.load(path)

print("Loading ML models...")

try:
    mental_analyzer = load_model('mental_health_analyzer.pkl')
    print("Mental health analyzer loaded")
except Exception as e:
    print(f"Mental health model failed, creating fresh one: {e}")
    mental_analyzer = MentalHealthAnalyzer()
    print("Mental health analyzer created fresh (no pkl needed)")

try:
    diabetes_model = load_model('diabetes_model.pkl')
    diabetes_features = load_model('diabetes_features.pkl')
    print("Diabetes model loaded")
except Exception as e:
    print(f"Warning: Diabetes model not found: {e}")
    diabetes_model = None
    diabetes_features = None

try:
    heart_model = load_model('heart_model.pkl')
    heart_features = load_model('heart_features.pkl')
    print("Heart disease model loaded")
except Exception as e:
    print(f"Warning: Heart model not found: {e}")
    heart_model = None
    heart_features = None

print("All models ready!")
