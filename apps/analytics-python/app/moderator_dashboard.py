"""Domain 70 — Moderator Dashboard analytics insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/moderator-dashboard", tags=["moderator-dashboard"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    by_status = s.get("byStatus") or {}
    by_queue = s.get("byQueue") or {}
    breached = int(s.get("slaBreached") or 0)
    escalated = int(by_status.get("escalated") or 0)
    triage = int(by_queue.get("triage") or 0)
    incidents = int((s.get("messagingByStatus") or {}).get("pending") or 0)

    if breached:    out.append({"id": "sla_breached",        "severity": "critical",
                                "title": f"{breached} items past SLA — work them now."})
    if escalated:   out.append({"id": "escalations",         "severity": "warn",
                                "title": f"{escalated} items escalated for senior review."})
    if triage > 10: out.append({"id": "triage_backlog",      "severity": "warn",
                                "title": f"{triage} items waiting in triage."})
    if incidents:   out.append({"id": "messaging_incidents", "severity": "warn",
                                "title": f"{incidents} messaging incidents pending review."})
    if not out:     out.append({"id": "mod_healthy",         "severity": "success",
                                "title": "Moderation desk healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
