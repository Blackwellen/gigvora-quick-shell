"""Domain 69 — Dispute Ops analytics insights (deterministic, locked envelope)."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/dispute-ops", tags=["dispute-ops"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    by_status = s.get("byStatus") or {}
    by_queue = s.get("byQueue") or {}
    breached = int(s.get("slaBreached") or 0)
    escalated = int(by_status.get("escalated") or 0)
    triage = int(by_queue.get("triage") or 0)
    arb = int(by_queue.get("arbitration") or 0)

    if breached:  out.append({"id": "sla_breached",  "severity": "critical",
                              "title": f"{breached} cases past SLA — work them now."})
    if escalated: out.append({"id": "escalations",   "severity": "warn",
                              "title": f"{escalated} escalated cases need admin review."})
    if triage > 10:
                  out.append({"id": "triage_backlog","severity": "warn",
                              "title": f"{triage} cases waiting in triage."})
    if arb:       out.append({"id": "arbitration_open","severity": "info",
                              "title": f"{arb} cases under arbitration."})
    if not out:   out.append({"id": "dop_healthy",   "severity": "success",
                              "title": "Dispute desk healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
