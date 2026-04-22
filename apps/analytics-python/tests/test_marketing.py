from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_funnel_summary_healthy():
    r = client.post("/marketing/funnel/summary", json={
        "impressions": 10000, "clicks": 500, "leads": 80, "conversions": 12,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["ctr"] == 0.05
    assert data["health"] in {"healthy", "warning"}


def test_funnel_summary_critical_low_ctr():
    r = client.post("/marketing/funnel/summary", json={
        "impressions": 10000, "clicks": 50, "leads": 5, "conversions": 1,
    })
    assert r.json()["health"] == "critical"


def test_experiment_verdict_low_confidence_small_sample():
    r = client.post("/marketing/experiments/verdict", json={
        "key": "home.hero.cta",
        "variants": [
            {"label": "control", "impressions": 50, "clicks": 5, "conversions": 1},
            {"label": "challenger-a", "impressions": 50, "clicks": 6, "conversions": 2},
        ],
    })
    body = r.json()
    assert body["confidence"] == "low"


def test_experiment_verdict_high_confidence():
    r = client.post("/marketing/experiments/verdict", json={
        "key": "pricing.primary",
        "variants": [
            {"label": "control", "impressions": 5000, "clicks": 200, "conversions": 50},
            {"label": "challenger-a", "impressions": 5000, "clicks": 250, "conversions": 200},
        ],
    })
    body = r.json()
    assert body["leader"] == "challenger-a"
    assert body["confidence"] == "high"
