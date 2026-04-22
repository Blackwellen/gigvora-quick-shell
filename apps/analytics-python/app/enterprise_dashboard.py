"""Domain 53 — Enterprise dashboard analytics.

Operational insights for hiring, procurement, team ops, and spend signals.
Deterministic so NestJS can degrade gracefully when warehouse offline.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/enterprise-dashboard", tags=["enterprise-dashboard"])


class InsightsIn(BaseModel):
    enterprise_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build_insights(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    open_reqs = int(s.get("openReqs") or 0)
    on_hold = int(s.get("onHoldReqs") or 0)
    pending = int(s.get("pendingApprovals") or 0)
    blocked = int(s.get("blockedTasks") or 0)
    overdue = int(s.get("overdueTasks") or 0)
    spend = int(s.get("totalSpendCents") or 0)
    headcount = int(s.get("headcount") or 0)
    onboarding = int(s.get("onboarding") or 0)

    if pending > 0:
        out.append({"id": "po-pending", "severity": "warn",
                    "title": f"{pending} PO(s) awaiting approval",
                    "body": "Clear the procurement queue to keep delivery on track.",
                    "action": {"label": "Open Procurement", "href": "/app/enterprise-dashboard/procurement"}})
    if blocked > 0:
        out.append({"id": "blocked", "severity": "warn",
                    "title": f"{blocked} blocked task(s)",
                    "body": "Unblock or reassign — blockers compound operations debt."})
    if overdue > 0:
        out.append({"id": "overdue", "severity": "warn",
                    "title": f"{overdue} overdue task(s)",
                    "body": "Reschedule with owners or escalate."})
    if open_reqs >= 8:
        out.append({"id": "reqs-volume", "severity": "info",
                    "title": f"{open_reqs} open requisitions",
                    "body": "High hiring load — review recruiter capacity and agency support."})
    if on_hold > 0:
        out.append({"id": "reqs-hold", "severity": "info",
                    "title": f"{on_hold} requisition(s) on hold",
                    "body": "Confirm whether to resume or cancel to free up budget."})
    if onboarding > 0:
        out.append({"id": "onboarding", "severity": "info",
                    "title": f"{onboarding} new hire(s) onboarding",
                    "body": "Check IT, access, and 30-day check-in tasks."})
    if headcount > 0 and spend / max(1, headcount) > 5_000_000:
        out.append({"id": "spend-per-head", "severity": "info",
                    "title": "Spend-per-head trending high",
                    "body": "Validate vendor concentration and renewal cadence."})
    if not out:
        out.append({"id": "all-clear", "severity": "success",
                    "title": "Enterprise cockpit healthy",
                    "body": "No outstanding signals across hiring, procurement, or operations."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build_insights(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}


class SpendForecastIn(BaseModel):
    series: List[float] = Field(default_factory=list)
    horizon: int = Field(default=4, ge=1, le=24)


@router.post("/spend-forecast")
def spend_forecast(req: SpendForecastIn):
    if not req.series:
        return {"forecast": [0.0] * req.horizon}
    last = req.series[-1]
    drift = (req.series[-1] - req.series[0]) / max(1, len(req.series) - 1)
    return {"forecast": [round(max(0.0, last + drift * (i + 1)), 2) for i in range(req.horizon)]}
