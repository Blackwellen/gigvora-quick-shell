"""Turn 2 — ML rankers smoke tests (deterministic, no network)."""
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_search_rank_orders_by_relevance():
    docs = [
        {"id": "a", "title": "Python tutorial", "tags": ["python"], "kind": "post", "recency_days": 5},
        {"id": "b", "title": "Cooking pasta", "tags": ["food"], "kind": "post", "recency_days": 5},
        {"id": "c", "title": "Advanced Python", "tags": ["python", "ml"], "kind": "post", "recency_days": 5},
    ]
    r = c.post("/search/rank", json={"query": "python", "docs": docs})
    assert r.status_code == 200
    body = r.json()
    assert body["meta"]["model"] == "search-bm25-lite"
    ids = [h["id"] for h in body["data"]]
    assert ids[0] in {"a", "c"}
    assert "b" not in ids[:1]


def test_feed_rank_demotes_muted_and_boosts_followed():
    viewer = {"id": "v1", "follows": ["u2"], "interests": ["ai"], "muted_authors": ["u3"]}
    items = [
        {"id": "p1", "author_id": "u2", "created_hours_ago": 1, "tags": ["ai"]},
        {"id": "p2", "author_id": "u3", "created_hours_ago": 1, "tags": ["ai"]},
        {"id": "p3", "author_id": "u4", "created_hours_ago": 48, "tags": []},
    ]
    r = c.post("/feed/rank", json={"viewer": viewer, "items": items})
    assert r.status_code == 200
    ids = [h["id"] for h in r.json()["data"]]
    assert "p2" not in ids
    assert ids[0] == "p1"


def test_network_pymk_ranks_by_mutual_connections():
    viewer = {"id": "v", "connections": ["a", "b", "c"], "city": "London"}
    candidates = [
        {"id": "x", "connections": ["a", "b"], "city": "London"},
        {"id": "y", "connections": ["z"]},
        {"id": "w", "connections": ["a", "b", "c"], "city": "London"},
    ]
    r = c.post("/network/pymk", json={"viewer": viewer, "candidates": candidates})
    assert r.status_code == 200
    ids = [h["id"] for h in r.json()["data"]]
    assert ids[0] == "w"
    assert "y" in ids
