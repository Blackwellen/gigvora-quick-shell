from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

def test_match_score():
    r = client.post("/match/score", json={
        "candidate": {"skills": ["python", "ml"]},
        "target": {"skills": ["python", "react"]},
    })
    assert r.status_code == 200
    assert 0 <= r.json()["score"] <= 100

def test_moderate_flag():
    r = client.post("/moderate", json={"content": "this is a SCAM offer"})
    assert r.json()["safe"] is False
