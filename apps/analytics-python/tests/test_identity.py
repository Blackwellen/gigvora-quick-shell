from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_low_risk_known_user_clean():
    r = client.post("/identity/risk/score", json={
        "email": "a@b.co", "ip": "1.2.3.4", "userAgent": "ua", "knownIdentity": True,
    })
    body = r.json()
    assert body["band"] == "low"
    assert body["mfaRequired"] is False


def test_high_risk_many_failures():
    r = client.post("/identity/risk/score", json={
        "email": "a@b.co", "ip": "1.2.3.4", "userAgent": "ua",
        "knownIdentity": True, "recent_failed": 6, "recent_blocked": 1,
    })
    body = r.json()
    assert body["band"] == "high"
    assert body["mfaRequired"] is True


def test_medium_risk_unknown_identity_no_history():
    r = client.post("/identity/risk/score", json={
        "email": "new@b.co", "knownIdentity": False, "recent_failed": 3,
    })
    assert r.json()["band"] in {"medium", "high"}
