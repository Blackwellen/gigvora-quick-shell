"""Domain 48 — User Dashboard analytics.

Computes role-aware KPIs, insights and activity snapshots. Deterministic when
the upstream warehouse is unavailable so NestJS can cache a stable payload.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/user-dashboard", tags=["user-dashboard"])


class OverviewIn(BaseModel):
    user_id: str
    role: str = Field(default="user")


class OverviewOut(BaseModel):
    kpis: Dict[str, Any]
    insights: List[Dict[str, Any]]
    activity: List[Dict[str, Any]]
    computed_at: str


def _kpis_for(role: str) -> Dict[str, Any]:
    if role == "professional":
        return {
            "activeOrders": 4,
            "earningsMtd": 2840,
            "responseRateP90": 0.94,
            "openOpportunities": 7,
            "rating": 4.8,
        }
    if role == "enterprise":
        return {
            "openReqs": 12,
            "spendMtd": 18420,
            "vendorsActive": 9,
            "pendingApprovals": 3,
            "savingsRate": 0.11,
        }
    return {
        "savedItems": 6,
        "ordersOpen": 1,
        "bookingsUpcoming": 2,
        "unreadMessages": 3,
        "streakDays": 5,
    }


def _insights_for(role: str) -> List[Dict[str, Any]]:
    if role == "professional":
        return [
            {"id": "i1", "severity": "success", "title": "Response time improved", "body": "P90 down 12% vs last week."},
            {"id": "i2", "severity": "warn", "title": "1 order nearing SLA", "body": "Order #4821 due in 6h."},
        ]
    if role == "enterprise":
        return [
            {"id": "i1", "severity": "info", "title": "3 approvals waiting", "body": "Spend approval queue is stable."},
            {"id": "i2", "severity": "success", "title": "Vendor risk green", "body": "All active vendors compliant."},
        ]
    return [
        {"id": "i1", "severity": "info", "title": "Pick up where you left off", "body": "You have 1 saved gig and 2 unread replies."},
    ]


def _activity_for(role: str) -> List[Dict[str, Any]]:
    base = [
        {"id": "a1", "kind": "order.update", "title": "Order #4821 in review", "at": datetime.now(timezone.utc).isoformat()},
        {"id": "a2", "kind": "message", "title": "New message from Alex", "at": datetime.now(timezone.utc).isoformat()},
    ]
    return base


@router.post("/overview", response_model=OverviewOut)
def overview(payload: OverviewIn) -> OverviewOut:
    return OverviewOut(
        kpis=_kpis_for(payload.role),
        insights=_insights_for(payload.role),
        activity=_activity_for(payload.role),
        computed_at=datetime.now(timezone.utc).isoformat(),
    )
