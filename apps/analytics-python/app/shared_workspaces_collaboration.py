"""Domain 55 — Shared workspaces & collaboration analytics.

Operational summaries + prioritisation hints for handoff backlog,
note hygiene, workspace activity, and stale-collaboration risk.
Deterministic so NestJS can degrade gracefully when warehouse is offline.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/shared-workspaces-collaboration", tags=["shared-workspaces-collaboration"])


class InsightsIn(BaseModel):
    org_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    pending = int(s.get("pendingHandoffsForMe") or 0)
    active = int(s.get("activeWorkspaces") or 0)
    notes = int(s.get("publishedNotes") or 0)
    overdue = int(s.get("overdueHandoffs") or 0)
    stale_drafts = int(s.get("staleDrafts") or 0)

    if pending > 0:
        out.append({"id": "pending-handoffs", "severity": "warn",
                    "title": f"{pending} handoff(s) await your action",
                    "body": "Accept, reject, or reassign before they go stale."})
    if overdue > 0:
        out.append({"id": "overdue-handoffs", "severity": "error",
                    "title": f"{overdue} overdue handoff(s)",
                    "body": "Past due — escalate or extend the due date."})
    if stale_drafts > 0:
        out.append({"id": "stale-drafts", "severity": "info",
                    "title": f"{stale_drafts} draft note(s) untouched in 14d+",
                    "body": "Publish, archive, or delete to keep the workspace tidy."})
    if active == 0:
        out.append({"id": "no-ws", "severity": "info",
                    "title": "No active workspaces",
                    "body": "Create a shared workspace to start collaborating."})
    if active > 0 and notes == 0:
        out.append({"id": "no-notes", "severity": "info",
                    "title": "No published notes yet",
                    "body": "Capture playbooks and decisions so future teammates can self-serve."})

    if not out:
        out.append({"id": "all-clear", "severity": "success",
                    "title": "Collaboration healthy",
                    "body": "No outstanding handoffs or stale notes."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
