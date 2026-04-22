"""Turn 3 — Identity & graph ML smoke tests."""
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_profiles_similar_ranks_skill_matches_first():
    target = {"id": "t", "headline": "Senior Python engineer", "skills": ["python", "ml", "fastapi"], "industries": ["tech"], "seniority": 4}
    candidates = [
        {"id": "a", "headline": "Junior chef", "skills": ["cooking"], "industries": ["food"], "seniority": 1},
        {"id": "b", "headline": "ML engineer", "skills": ["python", "ml"], "industries": ["tech"], "seniority": 4},
        {"id": "c", "headline": "Frontend dev", "skills": ["react"], "industries": ["tech"], "seniority": 3},
    ]
    r = c.post("/profiles/similar", json={"target": target, "candidates": candidates})
    assert r.status_code == 200
    body = r.json()
    assert body["meta"]["model"] == "profiles-hashed-ngram"
    ids = [h["id"] for h in body["data"]]
    assert ids[0] == "b"
    assert "a" in ids[-1:]


def test_companies_competitors_only_share_industries():
    target = {"id": "t", "name": "Acme", "industries": ["fintech"], "size_band": "mid", "keywords": ["payments"]}
    universe = [
        {"id": "x", "name": "Beta", "industries": ["fintech"], "size_band": "mid", "keywords": ["payments"]},
        {"id": "y", "name": "Foodie", "industries": ["food"], "size_band": "mid", "keywords": ["dining"]},
    ]
    r = c.post("/companies/competitors", json={"target": target, "universe": universe})
    assert r.status_code == 200
    ids = [h["id"] for h in r.json()["data"]]
    assert ids == ["x"]


def test_notifications_priority_promotes_mentions_and_dms():
    recipient = {"id": "u", "follows": ["a"], "important_authors": ["b"]}
    notifs = [
        {"id": "n1", "type": "marketing", "sender_id": "z", "created_hours_ago": 0.5, "is_unread": True},
        {"id": "n2", "type": "mention", "sender_id": "b", "created_hours_ago": 0.5, "is_mention": True, "is_unread": True},
        {"id": "n3", "type": "like", "sender_id": "a", "created_hours_ago": 48, "is_unread": False},
    ]
    r = c.post("/notifications/priority", json={"recipient": recipient, "notifications": notifs})
    assert r.status_code == 200
    items = r.json()["data"]
    assert items[0]["id"] == "n2"
    assert items[0]["bucket"] == "high"
