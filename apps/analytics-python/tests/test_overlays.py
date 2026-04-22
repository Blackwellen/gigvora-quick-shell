from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_overlay_insights_ranks_high_abandonment_first():
    payload = {
        "sessions": [
            *[{"surface_key": "jobs.editor", "status": "dismissed", "opened_at": 0, "closed_at": 90} for _ in range(7)],
            *[{"surface_key": "jobs.editor", "status": "completed", "opened_at": 0, "closed_at": 30} for _ in range(2)],
            *[{"surface_key": "profile.preview", "status": "completed", "opened_at": 0, "closed_at": 5} for _ in range(10)],
        ],
    }
    r = client.post("/overlays/insights", json=payload)
    assert r.status_code == 200
    cards = r.json()["cards"]
    assert cards[0]["surface"] == "jobs.editor"
    assert cards[0]["priority"] == "high"
    assert cards[0]["dismissRate"] > 0.6
    assert any(c["surface"] == "profile.preview" and c["priority"] == "low" for c in cards)


def test_overlay_insights_handles_empty():
    r = client.post("/overlays/insights", json={"sessions": []})
    assert r.status_code == 200
    assert r.json() == {"cards": [], "fallback": True}
