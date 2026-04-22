import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_rank_prefers_urgent_unread_recent():
    now = time.time()
    payload = {
        "now_ts": now,
        "items": [
            {"id": "a", "topic": "billing.invoice", "priority": "urgent", "category": "billing", "created_at": now - 60, "read": False, "interactions": 3},
            {"id": "b", "topic": "system.maintenance", "priority": "low", "category": "system", "created_at": now - 60, "read": False, "interactions": 0},
            {"id": "c", "topic": "message.new", "priority": "normal", "category": "social", "created_at": now - 86400 * 7, "read": False, "interactions": 0},
            {"id": "d", "topic": "message.new", "priority": "high", "category": "mention", "created_at": now - 60, "read": True, "interactions": 0},
        ],
    }
    r = client.post("/notifications/rank", json=payload)
    assert r.status_code == 200
    ranked = r.json()["ranked"]
    assert ranked[0]["id"] == "a"
    # week-old normal should rank below recent low-priority
    week_old = next(x for x in ranked if x["id"] == "c")
    low_recent = next(x for x in ranked if x["id"] == "b")
    assert low_recent["score"] > week_old["score"]


def test_digest_groups_and_prioritises_urgent():
    payload = {
        "items": [
            {"id": "1", "topic": "billing.invoice", "priority": "urgent", "created_at": 0, "read": False},
            {"id": "2", "topic": "billing.invoice", "priority": "normal", "created_at": 0, "read": False},
            {"id": "3", "topic": "message.new",     "priority": "normal", "created_at": 0, "read": True},
        ],
    }
    r = client.post("/notifications/digest", json=payload)
    assert r.status_code == 200
    cards = r.json()["cards"]
    assert cards[0]["topic"] == "billing.invoice"
    assert cards[0]["urgent"] == 1
    assert any(c["topic"] == "message.new" and c["unread"] == 0 for c in cards)
