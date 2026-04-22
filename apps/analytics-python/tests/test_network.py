from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_rank_suggestions_orders_by_score():
    r = client.post("/network/rank-suggestions", json={"items": [
        {"user_id": "a", "degree": 3, "mutual_count": 1,  "shared_tags": 0, "activity_score": 0.1},
        {"user_id": "b", "degree": 2, "mutual_count": 25, "shared_tags": 5, "activity_score": 0.7},
        {"user_id": "c", "degree": 2, "mutual_count": 5,  "shared_tags": 2, "activity_score": 0.4},
    ]})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items[0]["user_id"] == "b"
    scores = [i["score"] for i in items]
    assert scores == sorted(scores, reverse=True)


def test_insights_flags_low_accept_rate():
    r = client.post("/network/insights", json={
        "pending_in": 2, "pending_out": 1, "accepted_30d": 1, "declined_30d": 9,
    })
    body = r.json()
    assert body["accept_rate"] == 0.1
    assert "low_accept_rate" in body["flags"]


def test_insights_flags_incoming_backlog():
    r = client.post("/network/insights", json={"pending_in": 12})
    assert "incoming_backlog" in r.json()["flags"]
