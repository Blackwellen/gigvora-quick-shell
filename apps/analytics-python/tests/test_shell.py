from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)

def test_shell_health():
    r = c.get("/shell/health")
    assert r.status_code == 200
    assert r.json()["service"] == "shell-analytics"

def test_shell_insights_empty_user():
    r = c.post("/shell/insights", json={
        "user_id": "u1", "saved_view_count": 0, "recent_count": 0,
        "role_switches_24h": 0, "org_switches_24h": 0,
    })
    assert r.status_code == 200
    body = r.json()
    ids = {c["id"] for c in body["cards"]}
    assert "no-saved-views" in ids and "no-recents" in ids
    assert body["prioritised_routes"][0] == "/dashboard"

def test_shell_insights_role_thrash():
    r = c.post("/shell/insights", json={
        "user_id": "u1", "saved_view_count": 3, "recent_count": 5,
        "role_switches_24h": 7, "org_switches_24h": 0,
    })
    body = r.json()
    severities = {c["severity"] for c in body["cards"]}
    assert "anomaly" in severities
