from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _items():
    return [
        {"id": "p1", "kind": "text",        "created_at": "2026-04-17T10:00:00Z", "reaction_count": 10, "comment_count": 2, "follow_affinity": 0.8},
        {"id": "p2", "kind": "opportunity", "created_at": "2026-04-17T11:00:00Z", "reaction_count": 5,  "comment_count": 1, "follow_affinity": 0.2},
        {"id": "p3", "kind": "milestone",   "created_at": "2026-04-15T08:00:00Z", "reaction_count": 80, "comment_count": 12, "follow_affinity": 0.5},
    ]


def test_rank_returns_sorted_items_with_scores():
    r = client.post("/feed/rank", json={"items": _items()})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 3
    scores = [i["score"] for i in items]
    assert scores == sorted(scores, reverse=True)


def test_opportunity_kind_gets_boost():
    r = client.post("/feed/rank", json={"items": [
        {"id": "a", "kind": "text",        "created_at": "2026-04-17T10:00:00Z"},
        {"id": "b", "kind": "opportunity", "created_at": "2026-04-17T10:00:00Z"},
    ]})
    items = {i["id"]: i["score"] for i in r.json()["items"]}
    assert items["b"] > items["a"]


def test_digest_returns_top_5():
    r = client.post("/feed/digest", json={"items": _items()})
    body = r.json()
    assert "top" in body and len(body["top"]) <= 5
    assert "summary" in body
