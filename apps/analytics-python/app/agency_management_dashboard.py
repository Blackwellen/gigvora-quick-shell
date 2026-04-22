"""Domain 52 — Agency management dashboard analytics.

Operational insights for delivery health, utilization, and AR.
Deterministic so NestJS can degrade gracefully when warehouse offline.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agency-management-dashboard", tags=["agency-management-dashboard"])


class InsightsIn(BaseModel):
    agency_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build_insights(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    at_risk = int(s.get("atRisk") or 0)
    blocked = int(s.get("blockedDeliverables") or 0)
    overdue = int(s.get("overdueDeliverables") or 0)
    ar_cents = int(s.get("arOutstandingCents") or 0)
    util = float(s.get("avgUtilization") or 0)
    spent = int(s.get("totalSpent") or 0)
    budget = int(s.get("totalBudget") or 0)

    if at_risk > 0:
        out.append({
            "id": "at-risk", "severity": "warn",
            "title": f"{at_risk} at-risk engagement(s)",
            "body": "Open the portfolio rail to triage scope, budget, and team load.",
            "action": {"label": "Open portfolio", "href": "/app/agency-management-dashboard/portfolio"},
        })
    if blocked > 0:
        out.append({
            "id": "blocked", "severity": "warn",
            "title": f"{blocked} blocked deliverable(s)",
            "body": "Unblock or reassign — blockers compound delivery debt.",
        })
    if overdue > 0:
        out.append({
            "id": "overdue", "severity": "warn",
            "title": f"{overdue} overdue deliverable(s)",
            "body": "Reschedule with the client or escalate.",
        })
    if ar_cents >= 1_000_000:
        out.append({
            "id": "ar-high", "severity": "info",
            "title": f"AR outstanding ${ar_cents/100:,.0f}",
            "body": "Run a collections sweep on overdue invoices.",
        })
    if util > 90:
        out.append({"id": "overutil", "severity": "warn", "title": f"Team utilization {util:.1f}%",
                    "body": "Sustained over-utilization risks burn-out and quality dips."})
    elif 0 < util < 55:
        out.append({"id": "underutil", "severity": "info", "title": f"Team utilization {util:.1f}%",
                    "body": "Capacity available — prioritise pitches or training."})
    if budget > 0 and spent / budget > 0.85:
        out.append({"id": "burn-rate", "severity": "warn", "title": "Portfolio burn rate >85%",
                    "body": "Renegotiate scope or surface a change order with affected clients."})
    if not out:
        out.append({"id": "all-clear", "severity": "success", "title": "Agency cockpit healthy",
                    "body": "No outstanding risk signals across delivery, utilization, or AR."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build_insights(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}


class CapacityForecastIn(BaseModel):
    series: List[float] = Field(default_factory=list)
    horizon: int = Field(default=4, ge=1, le=24)


@router.post("/capacity-forecast")
def capacity_forecast(req: CapacityForecastIn):
    if not req.series:
        return {"forecast": [0.0] * req.horizon}
    last = req.series[-1]
    drift = (req.series[-1] - req.series[0]) / max(1, len(req.series) - 1)
    return {"forecast": [round(max(0.0, min(1.0, last + drift * (i + 1))), 4) for i in range(req.horizon)]}
