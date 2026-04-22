from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_insights_summarises_history():
    r = c.post("/search/insights", json={"rows": [
        {"query": "react", "result_count": 12, "clicks": 5},
        {"query": "blockchain", "result_count": 0, "clicks": 0},
        {"query": "logo", "result_count": 8, "clicks": 0},
    ]}).json()
    assert "blockchain" in r["zeroResults"]
    assert "react" in r["topClicked"]
    assert "logo" in r["underperforming"]


def test_insights_handles_empty():
    assert c.post("/search/insights", json={"rows": []}).json()["summary"] == "No search history yet."


def test_rerank_boosts_query_overlap():
    r = c.post("/search/rerank", json={
        "query": "react london",
        "items": [
            {"id": "a", "title": "Senior React Engineer", "body": "London hybrid", "rank": 0.5},
            {"id": "b", "title": "Backend Go Developer", "body": "Berlin", "rank": 0.9},
        ],
    }).json()
    assert r["items"][0]["id"] == "a"
    assert r["model"] == "jaccard-fallback"
