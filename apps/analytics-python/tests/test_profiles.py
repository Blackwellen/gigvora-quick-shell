from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_score_top_band():
    r = client.post("/profiles/score", json={"components": {
        "reviews": 5, "completion": 1, "verifications": 3, "activity": 1, "endorsements": 60,
    }})
    assert r.status_code == 200
    body = r.json()
    assert body["band"] in ("top", "trusted")
    assert 0 <= body["score"] <= 100


def test_score_new_band_for_empty_profile():
    r = client.post("/profiles/score", json={"components": {
        "reviews": 0, "completion": 0, "verifications": 0, "activity": 0, "endorsements": 0,
    }})
    assert r.json()["band"] == "new"


def test_insights_emits_suggestions_for_empty_profile():
    r = client.post("/profiles/insights", json={
        "profile": {}, "skills": [], "portfolio": [], "reviews": [], "verifications": [],
    })
    body = r.json()
    keys = {s["key"] for s in body["suggestions"]}
    assert "headline" in keys and "summary" in keys and "skills" in keys
    assert body["completeness"] == 0
