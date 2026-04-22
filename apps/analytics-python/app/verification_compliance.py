"""Domain 73 — Verification & Compliance analytics insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/verification-compliance", tags=["verification-compliance"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    by_status = s.get("casesByStatus") or {}
    by_queue = s.get("casesByQueue") or {}
    by_band = s.get("casesByBand") or {}
    breached = int(s.get("slaBreached") or 0)
    expiring = int(s.get("expiringSoon") or 0)
    escalated = int(by_status.get("escalated") or 0)
    triage = int(by_queue.get("triage") or 0)
    critical = int(by_band.get("critical") or 0)
    high = int(by_band.get("high") or 0)
    if breached:    out.append({"id": "sla_breached",   "severity": "critical",
                                "title": f"{breached} verification cases past SLA — work them now."})
    if critical:    out.append({"id": "critical_cases", "severity": "critical",
                                "title": f"{critical} critical-band cases open."})
    if escalated:   out.append({"id": "escalations",    "severity": "warn",
                                "title": f"{escalated} cases escalated."})
    if expiring:    out.append({"id": "expiring_soon",  "severity": "warn",
                                "title": f"{expiring} approvals expire within 30 days."})
    if triage > 10: out.append({"id": "triage_backlog", "severity": "warn",
                                "title": f"{triage} cases waiting in triage."})
    elif high > 5:  out.append({"id": "high_cases",     "severity": "warn",
                                "title": f"{high} high-band cases waiting."})
    if not out:     out.append({"id": "vc_healthy",     "severity": "success",
                                "title": "Verification desk healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
