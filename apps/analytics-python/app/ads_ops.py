"""Domain 72 — Ads Ops analytics insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ads-ops", tags=["ads-ops"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    by_status = s.get("reviewsByStatus") or {}
    by_queue = s.get("reviewsByQueue") or {}
    by_band = s.get("reviewsByBand") or {}
    breached = int(s.get("slaBreached") or 0)
    escalated = int(by_status.get("escalated") or 0)
    triage = int(by_queue.get("triage") or 0)
    critical = int(by_band.get("critical") or 0)
    high = int(by_band.get("high") or 0)
    if breached:    out.append({"id": "sla_breached",     "severity": "critical",
                                "title": f"{breached} reviews past SLA — work them now."})
    if critical:    out.append({"id": "critical_reviews", "severity": "critical",
                                "title": f"{critical} critical-band policy reviews open."})
    if escalated:   out.append({"id": "escalations",      "severity": "warn",
                                "title": f"{escalated} reviews escalated."})
    if triage > 10: out.append({"id": "triage_backlog",   "severity": "warn",
                                "title": f"{triage} reviews waiting in triage."})
    elif high > 5:  out.append({"id": "high_reviews",     "severity": "warn",
                                "title": f"{high} high-band reviews waiting."})
    if not out:     out.append({"id": "ads_ops_healthy",  "severity": "success",
                                "title": "Ads Ops desk healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
