"""Domain 71 — Trust & Safety analytics insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/trust-safety-ml", tags=["trust-safety-ml"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    by_status = s.get("casesByStatus") or {}
    by_queue = s.get("casesByQueue") or {}
    by_band = s.get("signalsByBand") or {}
    breached = int(s.get("slaBreached") or 0)
    escalated = int(by_status.get("escalated") or 0)
    triage = int(by_queue.get("triage") or 0)
    crit_sig = int(by_band.get("critical") or 0)
    high_sig = int(by_band.get("high") or 0)

    if breached:    out.append({"id": "sla_breached",     "severity": "critical",
                                "title": f"{breached} cases past SLA — work them now."})
    if escalated:   out.append({"id": "escalations",      "severity": "warn",
                                "title": f"{escalated} cases escalated."})
    if triage > 10: out.append({"id": "triage_backlog",   "severity": "warn",
                                "title": f"{triage} cases waiting in triage."})
    if crit_sig:    out.append({"id": "critical_signals", "severity": "critical",
                                "title": f"{crit_sig} critical fraud signals open."})
    elif high_sig > 5: out.append({"id": "high_signals",  "severity": "warn",
                                   "title": f"{high_sig} high-band signals waiting."})
    if not out: out.append({"id": "tsml_healthy", "severity": "success",
                            "title": "Trust & Safety desk healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
