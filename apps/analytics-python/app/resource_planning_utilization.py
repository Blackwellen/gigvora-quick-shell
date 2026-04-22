"""Domain 56 — Resource planning & utilization analytics.

Operational summaries, anomaly commentary, and prioritisation hints
for capacity health. Deterministic so NestJS can degrade gracefully.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/resource-planning-utilization", tags=["resource-planning-utilization"])


class InsightsIn(BaseModel):
    org_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    over = int(s.get("overbooked") or 0)
    under = int(s.get("underbooked") or 0)
    avg = float(s.get("avgUtilization") or 0)
    active_res = int(s.get("activeResources") or 0)
    active_proj = int(s.get("activeProjects") or 0)
    asn = int(s.get("assignmentsInWindow") or 0)

    if over > 0:
        out.append({"id": "overbooked", "severity": "error",
                    "title": f"{over} resource(s) overbooked",
                    "body": "Reassign work or extend timelines to relieve pressure."})
    if under > 0:
        out.append({"id": "underbooked", "severity": "warn",
                    "title": f"{under} resource(s) underutilized (<60%)",
                    "body": "Shift them onto active projects or proposed assignments."})
    if avg and avg < 0.5:
        out.append({"id": "avg-low", "severity": "warn",
                    "title": f"Average utilization is low ({round(avg*100)}%)",
                    "body": "Pipeline may be too thin — push proposed assignments into confirmed."})
    if avg and avg > 0.95:
        out.append({"id": "avg-high", "severity": "error",
                    "title": f"Average utilization is critically high ({round(avg*100)}%)",
                    "body": "Burnout risk — consider hiring or deferring scope."})
    if active_res == 0:
        out.append({"id": "no-resources", "severity": "info",
                    "title": "No active resources",
                    "body": "Add resources to begin capacity planning."})
    if active_proj == 0:
        out.append({"id": "no-projects", "severity": "info",
                    "title": "No active projects",
                    "body": "Create a project to assign resources to."})
    if active_res > 0 and asn == 0:
        out.append({"id": "no-assignments", "severity": "info",
                    "title": "No assignments in the next 4 weeks",
                    "body": "Create assignments to populate the utilization view."})

    if not out:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Capacity healthy",
                    "body": "Utilization is balanced and no overbooking detected."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
