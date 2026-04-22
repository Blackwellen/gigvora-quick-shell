"""Domain 50 — Client / Buyer dashboard analytics.

Returns operational insights for buyer-side spend, proposal funnel and
project oversight. Deterministic so NestJS can degrade gracefully when the
warehouse is offline.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/client-dashboard", tags=["client-dashboard"])


class InsightsIn(BaseModel):
    client_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


class InsightsOut(BaseModel):
    insights: List[Dict[str, Any]]
    computed_at: str


def _build_insights(signals: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    at_risk = int(signals.get("atRisk") or 0)
    pending_approvals = int(signals.get("pendingApprovals") or 0)
    spend_pending = int(signals.get("spendPending") or 0)
    spend_cleared = int(signals.get("spendCleared") or 0)
    window_days = int(signals.get("windowDays") or 30)

    if at_risk > 0:
        out.append({
            "id": "at-risk",
            "severity": "warn",
            "title": f"{at_risk} project(s) at risk",
            "body": "Hold a status sync this week to recover scope or extend timeline.",
            "action": {"label": "Open oversight", "href": "/app/client-dashboard/oversight"},
        })
    if pending_approvals >= 3:
        out.append({
            "id": "approvals-stack",
            "severity": "warn",
            "title": f"{pending_approvals} approvals pending",
            "body": "Pipeline will stall if these are not actioned in 48h.",
        })
    elif pending_approvals > 0:
        out.append({
            "id": "approvals-some",
            "severity": "info",
            "title": f"{pending_approvals} approval(s) waiting",
            "body": "Quick decisions keep delivery moving.",
        })
    if spend_pending > spend_cleared and spend_pending > 0:
        out.append({
            "id": "pending-spend",
            "severity": "info",
            "title": "Pending spend exceeds cleared spend",
            "body": "Reconcile invoices and milestone funding to free up budget.",
        })
    if spend_cleared > 0:
        out.append({
            "id": "spend-summary",
            "severity": "success",
            "title": f"£{spend_cleared / 100:.0f} cleared in last {window_days}d",
            "body": "Procurement velocity is healthy.",
        })
    if not out:
        out.append({
            "id": "all-clear",
            "severity": "success",
            "title": "Buyer cockpit is clear",
            "body": "No outstanding risk signals.",
        })
    return out


@router.post("/insights", response_model=InsightsOut)
def insights(req: InsightsIn):
    return {
        "insights": _build_insights(req.signals),
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


class SpendForecastIn(BaseModel):
    series: List[float] = Field(default_factory=list)
    horizon: int = Field(default=4, ge=1, le=24)


@router.post("/spend-forecast")
def spend_forecast(req: SpendForecastIn):
    if not req.series:
        return {"forecast": [0.0] * req.horizon}
    last = req.series[-1]
    drift = (req.series[-1] - req.series[0]) / max(1, len(req.series) - 1)
    return {"forecast": [round(last + drift * (i + 1), 2) for i in range(req.horizon)]}
