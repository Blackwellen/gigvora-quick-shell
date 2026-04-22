"""Domain 58 — Billing/invoices/tax/subscriptions analytics & insights."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/billing-invoices-tax", tags=["billing-invoices-tax"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    overdue = int(s.get("overdueMinor") or 0)
    outstanding = int(s.get("outstandingMinor") or 0)
    past_due_subs = int(s.get("pastDueSubs") or 0)
    active_subs = int(s.get("activeSubs") or 0)
    mrr = int(s.get("mrrMinor") or 0)

    if overdue > 0:
        out.append({"id": "overdue", "severity": "error",
                    "title": f"£{overdue/100:.2f} overdue",
                    "body": "Schedule dunning reminders or escalate to collection."})
    if past_due_subs > 0:
        out.append({"id": "past-due-subs", "severity": "warn",
                    "title": f"{past_due_subs} past-due subscription(s)",
                    "body": "Recover payment or pause access."})
    if active_subs > 0 and mrr > 0:
        out.append({"id": "mrr", "severity": "info",
                    "title": f"MRR £{mrr/100:.2f}",
                    "body": f"{active_subs} active subscriptions."})
    if outstanding == 0 and overdue == 0 and past_due_subs == 0:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Billing healthy",
                    "body": "No overdue invoices or past-due subscriptions."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
