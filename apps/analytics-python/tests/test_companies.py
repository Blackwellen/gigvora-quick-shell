from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_full_company_scores_high():
    r = client.post("/companies/health", json={
        "company": {"tagline": "We build", "about": "x" * 200, "logoUrl": "u", "coverUrl": "u", "verified": True},
        "members": [{"isPublic": True}] * 12,
        "locations": [{"label": "HQ"}, {"label": "EU"}],
        "links": [{"kind": "linkedin"}, {"kind": "careers"}],
        "brand": {"primaryColor": "#000"},
        "posts": [{}] * 10,
    })
    body = r.json()
    assert body["band"] in ("strong", "excellent")
    assert body["score"] > 0.6


def test_health_empty_company_emits_all_suggestions():
    r = client.post("/companies/health", json={"company": {}})
    keys = {s["key"] for s in r.json()["suggestions"]}
    for k in ["tagline", "about", "logo", "cover", "location", "links", "brand", "posts"]:
        assert k in keys


def test_rank_orders_by_signals():
    r = client.post("/companies/rank", json={"companies": [
        {"id": "a", "followerCount": 100, "employeeCount": 5, "openRolesCount": 0, "verified": False},
        {"id": "b", "followerCount": 50, "employeeCount": 100, "openRolesCount": 10, "verified": True},
    ]})
    assert r.json()["items"][0]["id"] == "b"
