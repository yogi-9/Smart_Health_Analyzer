"""
Integration tests for the /diabetes/predict and /heart/predict endpoints.
These tests verify that the routers are correctly registered in main.py and
that the prediction endpoints return valid risk score responses.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

DIABETES_PAYLOAD = {
    "pregnancies": 0,
    "glucose": 120.0,
    "blood_pressure": 80.0,
    "skin_thickness": 0.0,
    "insulin": 0.0,
    "bmi": 24.5,
    "diabetes_pedigree": 0.5,
    "age": 30,
    "user_id": None,
}

HEART_PAYLOAD = {
    "age": 45,
    "sex": 1,
    "cp": 0,
    "trestbps": 130,
    "chol": 200,
    "fbs": 0,
    "restecg": 0,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 1.0,
    "slope": 1,
    "ca": 0,
    "thal": 2,
    "user_id": None,
}


class TestDiabetesPredict:
    def test_route_is_registered_not_404(self):
        """POST /diabetes/predict must be reachable (not 404)."""
        res = client.post("/diabetes/predict", json=DIABETES_PAYLOAD)
        assert res.status_code != 404, (
            "/diabetes/predict returned 404 – the router is not registered in main.py"
        )

    def test_returns_risk_score_fields(self):
        """Successful call returns all required risk score fields."""
        res = client.post("/diabetes/predict", json=DIABETES_PAYLOAD)
        # If model is missing the endpoint returns 503; that's a config issue, not a routing bug.
        if res.status_code == 503:
            pytest.skip("Diabetes model not loaded – skipping field assertion")
        assert res.status_code == 200
        data = res.json()
        assert "risk_score" in data
        assert "risk_level" in data
        assert "message" in data
        assert "tips" in data
        assert data["risk_level"] in ("Low", "Medium", "High")
        assert 0.0 <= data["risk_score"] <= 100.0

    def test_invalid_payload_returns_422(self):
        """Sending a payload with a missing required field must return 422, not 404."""
        res = client.post("/diabetes/predict", json={"age": 30})
        assert res.status_code == 422


class TestHeartPredict:
    def test_route_is_registered_not_404(self):
        """POST /heart/predict must be reachable (not 404)."""
        res = client.post("/heart/predict", json=HEART_PAYLOAD)
        assert res.status_code != 404, (
            "/heart/predict returned 404 – the router is not registered in main.py"
        )

    def test_returns_risk_score_fields(self):
        """Successful call returns all required risk score fields."""
        res = client.post("/heart/predict", json=HEART_PAYLOAD)
        if res.status_code == 503:
            pytest.skip("Heart model not loaded – skipping field assertion")
        assert res.status_code == 200
        data = res.json()
        assert "risk_score" in data
        assert "risk_level" in data
        assert "message" in data
        assert "tips" in data
        assert data["risk_level"] in ("Low", "Medium", "High")
        assert 0.0 <= data["risk_score"] <= 100.0

    def test_invalid_payload_returns_422(self):
        """Sending a payload with a missing required field must return 422, not 404."""
        res = client.post("/heart/predict", json={"age": 45})
        assert res.status_code == 422
