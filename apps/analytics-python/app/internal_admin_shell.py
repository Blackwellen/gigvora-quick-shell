"""Domain 66 — Internal Admin Shell insights.

Deterministic operational summaries for the shell domain. Locked envelope:
{ insights: [...], meta: { computed_at } }.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/internal-admin-shell", tags=["internal-admin-shell"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    total = int(s.get("totalDepth") or 0)
    health = s.get("healthBreakdown") or {}
    blocked = int(health.get("blocked") or 0)
    degraded = int(health.get("degraded") or 0)
    caution = int(health.get("caution") or 0)
    workspaces = int(s.get("workspaces") or 0)
    visible = int(s.get("visibleWorkspaces") or 0)

    if total > 200:
        out.append({"id": "depth_critical", "severity": "critical",
                    "title": f"Queue depth at {total} items — staff up immediately."})
    elif total > 100:
        out.append({"id": "depth_warn", "severity": "warn",
                    "title": f"Queue depth elevated at {total} items."})
    if blocked:
        out.append({"id": "blocked_queues", "severity": "critical",
                    "title": f"{blocked} queue(s) blocked — investigate dependencies."})
    if degraded:
        out.append({"id": "degraded_queues", "severity": "warn",
                    "title": f"{degraded} queue(s) degraded — review SLAs."})
    if caution and not (blocked or degraded):
        out.append({"id": "caution_queues", "severity": "info",
                    "title": f"{caution} queue(s) under caution — monitor closely."})
    if workspaces and visible < workspaces:
        out.append({"id": "role_scoped",
                    "severity": "info",
                    "title": f"{workspaces - visible} workspace(s) hidden from this role."})
    if not out:
        out.append({"id": "shell_healthy", "severity": "success",
                    "title": "Internal admin shell posture healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
