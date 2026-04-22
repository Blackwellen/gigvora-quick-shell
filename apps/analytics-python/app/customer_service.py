"""Domain 67 — Customer Service analytics insights (deterministic, locked envelope)."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/customer-service", tags=["customer-service"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    breaches = int(s.get("breaches") or 0)
    by_pri = s.get("byPriority") or {}
    by_status = s.get("byStatus") or {}
    csat = s.get("csat") or {}

    if breaches > 5:
        out.append({"id": "sla_breach", "severity": "critical",
                    "title": f"{breaches} tickets breached SLA — escalate now."})
    elif breaches:
        out.append({"id": "sla_warn", "severity": "warn",
                    "title": f"{breaches} tickets breaching SLA."})

    urgent = int(by_pri.get("urgent") or 0)
    if urgent:
        out.append({"id": "urgent_open", "severity": "warn",
                    "title": f"{urgent} urgent open tickets."})

    pending = int(by_status.get("pending") or 0)
    if pending > 50:
        out.append({"id": "pending_backlog", "severity": "warn",
                    "title": f"Pending backlog at {pending} — staff up."})

    if csat.get("count", 0) >= 5 and (csat.get("avg") is not None) and float(csat["avg"]) < 3.5:
        out.append({"id": "csat_low", "severity": "warn",
                    "title": f"CSAT {float(csat['avg']):.2f} below 3.5 threshold."})

    if not out:
        out.append({"id": "cs_healthy", "severity": "success",
                    "title": "Customer service posture healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
