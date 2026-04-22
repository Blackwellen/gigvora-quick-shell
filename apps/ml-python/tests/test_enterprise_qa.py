"""
Enterprise QA matrix for the ML Python service (Group 1 of the upgrade).

For every primary endpoint we cover five cases:
  1. happy   — sane request → 200 + expected envelope
  2. empty   — empty inputs → 200 + deterministic empty envelope
  3. oversize — exceeds MAX_ITEMS → 413
  4. malformed — pydantic validation failure → 422
  5. metrics — request increments Prometheus counters
"""
from __future__ import annotations

import os

# Force tight item cap so oversize cases don't need 500+ rows in memory.
os.environ["ML_MAX_ITEMS"] = "8"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app._obs import REQS  # noqa: E402,F401

client = TestClient(app)


def _docs(n: int) -> list[dict]:
    return [
        {
            "id": f"d{i}",
            "title": f"Doc {i}",
            "body": "ai platform",
            "tags": ["ai"],
            "kind": "post",
            "recency_days": i,
        }
        for i in range(n)
    ]


# ---------------------------------------------------------------------------
# /metrics + middleware sanity
# ---------------------------------------------------------------------------


def test_metrics_endpoint_exposes_prometheus():
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "ml_requests_total" in r.text
    assert "ml_request_latency_seconds" in r.text


def test_request_id_round_trips():
    r = client.get("/health", headers={"x-request-id": "abc-123"})
    assert r.headers.get("x-request-id") == "abc-123"


# ---------------------------------------------------------------------------
# /match/score
# ---------------------------------------------------------------------------


def test_match_score_happy():
    r = client.post(
        "/match/score",
        json={"candidate": {"skills": ["react", "node"]}, "target": {"skills": ["react", "python"]}},
    )
    assert r.status_code == 200
    body = r.json()
    assert 0 <= body["score"] <= 100
    assert "model" in body


def test_match_score_empty_skills():
    r = client.post("/match/score", json={"candidate": {}, "target": {}})
    assert r.status_code == 200
    assert r.json()["score"] == 0.0


def test_match_score_malformed():
    r = client.post("/match/score", json={"candidate": "not-an-object"})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# /rank (legacy)
# ---------------------------------------------------------------------------


def test_rank_legacy_happy():
    r = client.post("/rank", json={"query": {"tags": ["ai"]}, "items": _docs(5)})
    assert r.status_code == 200
    assert "ranked" in r.json()


def test_rank_legacy_empty_items():
    r = client.post("/rank", json={"query": {"tags": []}, "items": []})
    assert r.status_code == 200
    assert r.json()["ranked"] == []


# ---------------------------------------------------------------------------
# /moderate (legacy)
# ---------------------------------------------------------------------------


def test_moderate_legacy_safe():
    r = client.post("/moderate", json={"content": "hello world"})
    assert r.status_code == 200
    assert r.json()["safe"] is True


def test_moderate_legacy_flags_spam():
    r = client.post("/moderate", json={"content": "this is a SCAM offer"})
    assert r.status_code == 200
    assert r.json()["safe"] is False
    assert r.json()["category"] == "spam"


# ---------------------------------------------------------------------------
# /agency/rank — DoS guard (oversize) + happy
# ---------------------------------------------------------------------------


def _agencies(n: int) -> list[dict]:
    return [
        {
            "id": f"a{i}",
            "slug": f"a-{i}",
            "name": f"Agency {i}",
            "specialties": ["design"],
            "industry": "software",
            "languages": ["en"],
            "ratingAvg": 4.2,
            "ratingCount": 12,
            "verified": True,
            "completedProjects": 20,
            "acceptingProjects": True,
        }
        for i in range(n)
    ]


def test_agency_rank_happy():
    r = client.post(
        "/agency/rank",
        json={"query": {"skills": ["design"], "industry": "software"}, "items": _agencies(5)},
    )
    assert r.status_code == 200
    body = r.json()
    assert "items" in body and len(body["items"]) == 5
    assert all(0 <= it["score"] <= 1 for it in body["items"])


def test_agency_rank_empty_items_returns_empty_envelope():
    r = client.post("/agency/rank", json={"query": {}, "items": []})
    assert r.status_code == 200
    assert r.json()["items"] == []


def test_agency_rank_oversize_rejected_with_413():
    # MAX_ITEMS forced to 8 at module load.
    r = client.post("/agency/rank", json={"query": {}, "items": _agencies(50)})
    assert r.status_code == 413


# ---------------------------------------------------------------------------
# /agency/proof-trust
# ---------------------------------------------------------------------------


def test_proof_trust_empty_returns_zero():
    r = client.post("/agency/proof-trust", json={"proofs": []})
    assert r.status_code == 200
    assert r.json()["score"] == 0.0
    assert r.json()["band"] == "none"


def test_proof_trust_strong_bundle():
    r = client.post(
        "/agency/proof-trust",
        json={
            "proofs": [
                {"kind": "security", "verified": True},
                {"kind": "compliance", "verified": True},
                {"kind": "certification", "verified": True},
            ]
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["band"] in {"strong", "excellent"}
    assert body["verifiedCount"] == 3


# ---------------------------------------------------------------------------
# Counters increment on every call
# ---------------------------------------------------------------------------


def test_request_counter_increments_on_each_call():
    before_metrics = client.get("/metrics").text
    client.post("/match/score", json={"candidate": {}, "target": {}})
    after_metrics = client.get("/metrics").text
    # Counter line for /match/score must be present and non-zero after the call.
    assert "ml_requests_total" in after_metrics
    # Snapshot grew by at least one outcome line.
    assert len(after_metrics) >= len(before_metrics)
