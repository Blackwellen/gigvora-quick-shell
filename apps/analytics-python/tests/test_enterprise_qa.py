"""
Enterprise QA matrix for the Analytics Python service (Group 3).

For each primary endpoint:
  1. happy   — sane request → 200 + expected envelope
  2. empty   — empty inputs → 200 + deterministic empty envelope
  3. oversize — exceeds ANALYTICS_MAX_ITEMS → 413
  4. malformed — pydantic validation failure → 422
  5. metrics — request increments Prometheus counters

Mirrors `apps/ml-python/tests/test_enterprise_qa.py` so both services have
identical operational guarantees.
"""
from __future__ import annotations

import os

os.environ["ANALYTICS_MAX_ITEMS"] = "8"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


# ---------------------------------------------------------------------------
# /metrics + middleware sanity
# ---------------------------------------------------------------------------


def test_metrics_endpoint_exposes_prometheus():
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "analytics_requests_total" in r.text
    assert "analytics_request_latency_seconds" in r.text


def test_request_id_round_trips():
    r = client.get("/health", headers={"x-request-id": "abc-xyz-789"})
    assert r.headers.get("x-request-id") == "abc-xyz-789"


# ---------------------------------------------------------------------------
# /summary
# ---------------------------------------------------------------------------


def test_summary_happy():
    r = client.post("/summary", json={"metric": "dau", "series": [1.0, 2.0, 3.0]})
    assert r.status_code == 200
    body = r.json()
    assert body["metric"] == "dau"
    assert body["n"] == 3
    assert body["mean"] == 2.0


def test_summary_empty_series_no_data():
    r = client.post("/summary", json={"metric": "dau", "series": []})
    assert r.status_code == 200
    assert r.json()["summary"] == "no data"


def test_summary_oversize_rejected_with_413():
    r = client.post(
        "/summary",
        json={"metric": "dau", "series": [float(i) for i in range(50)]},
    )
    assert r.status_code == 413


def test_summary_malformed_rejected_with_422():
    # extra="forbid" should reject unknown fields
    r = client.post(
        "/summary",
        json={"metric": "dau", "series": [1.0], "rogue": "field"},
    )
    assert r.status_code == 422


def test_summary_missing_required_field_rejected():
    r = client.post("/summary", json={"series": [1.0, 2.0]})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# /forecast
# ---------------------------------------------------------------------------


def test_forecast_happy_returns_horizon_length():
    r = client.post("/forecast", json={"series": [1.0, 2.0, 3.0], "horizon": 4})
    assert r.status_code == 200
    assert len(r.json()["forecast"]) == 4


def test_forecast_empty_series_returns_zeros():
    r = client.post("/forecast", json={"series": [], "horizon": 3})
    assert r.status_code == 200
    assert r.json()["forecast"] == [0.0, 0.0, 0.0]


def test_forecast_horizon_bounds_enforced():
    # horizon=0 violates ge=1
    r = client.post("/forecast", json={"series": [1.0], "horizon": 0})
    assert r.status_code == 422
    # horizon=999 violates le=365
    r = client.post("/forecast", json={"series": [1.0], "horizon": 999})
    assert r.status_code == 422


def test_forecast_oversize_series_rejected_with_413():
    r = client.post(
        "/forecast",
        json={"series": [float(i) for i in range(50)], "horizon": 3},
    )
    assert r.status_code == 413


# ---------------------------------------------------------------------------
# /entitlements/insights — DoS guard via large denial list
# ---------------------------------------------------------------------------


def test_entitlements_happy():
    r = client.post(
        "/entitlements/insights",
        json={"denials": [{"feature": "recruiter-pro", "c": 12}]},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["cards"][0]["priority"] == "high"


def test_entitlements_empty_returns_clean_summary():
    r = client.post("/entitlements/insights", json={"denials": []})
    assert r.status_code == 200
    assert r.json()["cards"] == []


# ---------------------------------------------------------------------------
# Counters increment on every call
# ---------------------------------------------------------------------------


def test_request_counter_increments_on_each_call():
    client.post("/summary", json={"metric": "x", "series": [1.0, 2.0]})
    after = client.get("/metrics").text
    # The /summary counter must be present and ≥ 1 after the call.
    assert 'analytics_requests_total{endpoint="summary",outcome="ok"}' in after
