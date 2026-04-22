"""Domain 69 — Dispute Ops risk scoring (deterministic, explainable)."""
from __future__ import annotations
from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/dispute-ops", tags=["dispute-ops"])


class ScoreIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


@router.post("/score")
def score(body: ScoreIn):
    s = body.signals or {}
    by_status = s.get("byStatus") or {}
    breached = int(s.get("slaBreached") or 0)
    open_count = sum(int(by_status.get(k, 0)) for k in
                     ("pending", "triaged", "mediation", "awaiting_response", "arbitration"))
    escalated = int(by_status.get("escalated") or 0)

    score_v = 10 + min(40, open_count * 2) + min(30, escalated * 8) + min(20, breached * 5)
    score_v = min(100, score_v)
    if score_v >= 80: band = "critical"
    elif score_v >= 60: band = "high"
    elif score_v >= 35: band = "elevated"
    else: band = "normal"
    return {
        "score": score_v, "band": band, "model": "deterministic-v1",
        "factors": {"open": open_count, "escalated": escalated, "slaBreached": breached},
    }
