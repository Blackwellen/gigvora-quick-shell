from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_no_denials_returns_clean_summary():
    r = c.post("/entitlements/insights", json={"denials": []})
    body = r.json()
    assert body["cards"] == []
    assert "No upgrade friction" in body["summary"]


def test_high_priority_for_frequent_denials():
    r = c.post("/entitlements/insights", json={
        "denials": [{"feature": "recruiter-pro", "c": 12}],
    })
    body = r.json()
    assert body["cards"][0]["priority"] == "high"
    assert body["cards"][0]["suggestedPlan"] == "pro"


def test_skips_features_user_already_owns():
    r = c.post("/entitlements/insights", json={
        "denials": [{"feature": "recruiter-pro", "c": 5}],
        "currentPlan": "pro",
    })
    assert r.json()["cards"] == []
