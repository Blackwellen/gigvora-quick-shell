"""Domain 70 — Moderator Dashboard ML scorers (deterministic, explainable)."""
from __future__ import annotations
from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/moderator-dashboard", tags=["moderator-dashboard"])


class ContentIn(BaseModel):
    surface: str | None = None
    targetId: str | None = None
    reasonCode: str = "other"
    severity: str = "normal"
    reporterId: str | None = None
    evidence: list = Field(default_factory=list)
    meta: Dict[str, Any] = Field(default_factory=dict)


@router.post("/score")
def score(body: ContentIn):
    sev_map = {"low": 20, "normal": 40, "high": 70, "critical": 90}
    sev = sev_map.get(body.severity, 40)
    high_risk = {"csam", "illegal", "self_harm", "hate"}
    med_risk = {"harassment", "impersonation", "scam", "phishing"}
    boost = 25 if body.reasonCode in high_risk else 15 if body.reasonCode in med_risk else 0
    s = min(100, sev + boost)
    if s >= 80: band = "critical"
    elif s >= 60: band = "high"
    elif s >= 35: band = "elevated"
    else: band = "normal"
    return {
        "score": s, "band": band,
        "reasons": [f"reason:{body.reasonCode}", f"severity:{body.severity}"],
    }


class RiskIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


@router.post("/risk")
def risk(body: RiskIn):
    s = body.signals or {}
    by_status = s.get("byStatus") or {}
    breached = int(s.get("slaBreached") or 0)
    incidents = int((s.get("messagingByStatus") or {}).get("pending") or 0)
    open_count = sum(int(by_status.get(k, 0)) for k in ("open", "triaging", "holding"))
    escalated = int(by_status.get("escalated") or 0)
    score_v = 10 + min(40, open_count * 2) + min(25, escalated * 8) + min(15, breached * 5) + min(10, incidents * 3)
    score_v = min(100, score_v)
    if score_v >= 80: band = "critical"
    elif score_v >= 60: band = "high"
    elif score_v >= 35: band = "elevated"
    else: band = "normal"
    return {
        "score": score_v, "band": band, "model": "deterministic-v1",
        "factors": {
            "open": open_count, "escalated": escalated,
            "slaBreached": breached, "pendingIncidents": incidents,
        },
    }
