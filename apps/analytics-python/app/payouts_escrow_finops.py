"""Domain 59 — Payouts/escrow/holds analytics & insights (deterministic)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/payouts-escrow-finops", tags=["payouts-escrow-finops"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    open_holds = int(s.get("openHolds") or 0)
    pending = int(s.get("pendingPayouts") or 0)
    held_escrow = int(s.get("heldEscrowMinor") or 0)
    available = int(s.get("availableMinor") or 0)

    if open_holds > 0:
        out.append({"id": "holds", "severity": "warn",
                    "title": f"{open_holds} open hold(s)",
                    "body": "Resolve holds to unblock payouts. Escalate KYC and risk_review with priority."})
    if pending > 5:
        out.append({"id": "queue", "severity": "info",
                    "title": "Payout queue is large",
                    "body": "Switch to weekly/daily cadence or batch high-value payouts."})
    if held_escrow > 100_000:  # > £1k
        out.append({"id": "escrow", "severity": "info",
                    "title": f"£{held_escrow/100:.2f} held in escrow",
                    "body": "Confirm milestones to release funds promptly."})
    if available <= 0 and pending == 0 and open_holds == 0:
        out.append({"id": "empty", "severity": "info",
                    "title": "No funds available",
                    "body": "Earnings will appear here once invoices/escrows settle."})
    if not out:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Finance healthy",
                    "body": "No open holds, queue is small, escrow flowing."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
