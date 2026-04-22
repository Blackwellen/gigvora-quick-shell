"""Turn 4 — Groups moderation smoke tests."""
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_groups_moderate_promotes_toxic_to_top_with_remove_action():
    posts = [
        {"id": "p1", "body": "Welcome everyone, glad to be here.", "author_trust": 0.9, "reports": 0},
        {"id": "p2", "body": "this is a SCAM phishing buy now click here", "author_trust": 0.1, "reports": 4},
        {"id": "p3", "body": "Anyone else excited about the new release?", "author_trust": 0.6, "reports": 0},
    ]
    r = c.post("/groups/moderate", json={"posts": posts})
    assert r.status_code == 200
    body = r.json()
    assert body["meta"]["model"] == "groups-moderation-v1"
    items = body["data"]
    assert items[0]["id"] == "p2"
    assert items[0]["action"] == "remove"
    assert items[-1]["action"] == "allow"
