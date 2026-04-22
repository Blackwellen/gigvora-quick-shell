"""Domain 51 — Recruiter dashboard analytics.

Operational insights for recruiter pipelines, response rates and hiring velocity.
Deterministic so NestJS can degrade gracefully when the warehouse is offline.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/recruiter-dashboard", tags=["recruiter-dashboard"])


class InsightsIn(BaseModel):
    recruiter_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build_insights(signals: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    response_rate = float(signals.get("responseRate") or 0)
    open_tasks = int(signals.get("openTasks") or 0)
    avg_days = float(signals.get("avgDaysToFill") or 0)
    active_pipelines = int(signals.get("activePipelines") or 0)
    total_active = int(signals.get("totalActiveCandidates") or 0)

    if 0 < response_rate < 15:
        out.append({
            "id": "low-response",
            "severity": "warn",
            "title": f"Response rate is {response_rate:.1f}%",
            "body": "Refresh templates, vary subject lines, and re-segment your sourcing list.",
            "action": {"label": "Open outreach", "href": "/app/recruiter-dashboard/outreach"},
        })
    if open_tasks >= 10:
        out.append({
            "id": "task-backlog",
            "severity": "warn",
            "title": f"{open_tasks} open tasks",
            "body": "Triage immediately to protect candidate experience SLAs.",
        })
    if avg_days > 35:
        out.append({
            "id": "slow-fill",
            "severity": "info",
            "title": f"Average days-to-fill {avg_days:.1f}",
            "body": "Inspect stage bottlenecks in the velocity panel.",
        })
    if active_pipelines >= 5 and total_active / max(1, active_pipelines) < 5:
        out.append({
            "id": "thin-pipelines",
            "severity": "info",
            "title": "Pipelines are thin",
            "body": "Boost sourcing volume — multiple pipelines have <5 active candidates.",
        })
    if not out:
        out.append({
            "id": "all-clear",
            "severity": "success",
            "title": "Recruiter cockpit is healthy",
            "body": "No outstanding risk signals across pipelines, outreach, or tasks.",
        })
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {
        "insights": _build_insights(req.signals),
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


class VelocityForecastIn(BaseModel):
    series: List[float] = Field(default_factory=list)
    horizon: int = Field(default=4, ge=1, le=24)


@router.post("/velocity-forecast")
def velocity_forecast(req: VelocityForecastIn):
    if not req.series:
        return {"forecast": [0.0] * req.horizon}
    last = req.series[-1]
    drift = (req.series[-1] - req.series[0]) / max(1, len(req.series) - 1)
    return {"forecast": [round(last + drift * (i + 1), 2) for i in range(req.horizon)]}
