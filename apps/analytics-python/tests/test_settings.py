from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_insights_flags_missing_essentials():
    r = client.post("/settings/insights", json={"items": []})
    assert r.status_code == 200
    cards = r.json()["cards"]
    keys = {(c["namespace"], c["key"]) for c in cards}
    assert ("locale", "timezone") in keys
    assert ("locale", "language") in keys
    assert ("general", "theme") in keys


def test_insights_flags_inconsistent_privacy():
    r = client.post("/settings/insights", json={
        "items": [
            {"namespace": "general", "key": "theme",    "value": "dark"},
            {"namespace": "locale",  "key": "language", "value": "en-GB"},
            {"namespace": "locale",  "key": "timezone", "value": "Europe/London"},
            {"namespace": "privacy", "key": "data_sharing_marketing", "value": True},
            {"namespace": "privacy", "key": "profile_visibility",     "value": "private"},
        ],
    })
    cards = r.json()["cards"]
    assert any(c["namespace"] == "privacy" and c["severity"] == "warning" for c in cards)


def test_insights_suggests_high_contrast_when_reduce_motion_on():
    r = client.post("/settings/insights", json={
        "items": [
            {"namespace": "general", "key": "theme",    "value": "dark"},
            {"namespace": "locale",  "key": "language", "value": "en-GB"},
            {"namespace": "locale",  "key": "timezone", "value": "Europe/London"},
            {"namespace": "accessibility", "key": "reduce_motion",  "value": True},
            {"namespace": "accessibility", "key": "high_contrast",  "value": False},
        ],
    })
    cards = r.json()["cards"]
    assert any(c["namespace"] == "accessibility" and c["key"] == "high_contrast" for c in cards)
