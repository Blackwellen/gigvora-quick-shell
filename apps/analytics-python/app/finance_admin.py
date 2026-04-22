"""Domain 68 — Finance Admin analytics insights (deterministic, locked envelope)."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/finance-admin", tags=["finance-admin"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    refunds = s.get("refunds") or {}
    holds = s.get("holds") or {}
    pending = int((refunds.get("pending") or {}).get("count") or 0)
    failed = int((refunds.get("failed") or {}).get("count") or 0)
    active_holds = int((holds.get("active") or {}).get("count") or 0)
    succeeded_amt = int((refunds.get("succeeded") or {}).get("amountMinor") or 0)

    if pending > 25:
        out.append({"id": "refund_backlog", "severity": "critical",
                    "title": f"{pending} refunds pending — work the queue."})
    elif pending > 5:
        out.append({"id": "refund_warn", "severity": "warn",
                    "title": f"{pending} refunds pending review."})

    if failed:
        out.append({"id": "refund_failed", "severity": "warn",
                    "title": f"{failed} refunds failed at provider — retry or reject."})

    if active_holds:
        out.append({"id": "holds_active", "severity": "info",
                    "title": f"{active_holds} active holds — review ageing."})

    if succeeded_amt > 100_000_00:
        out.append({"id": "refunds_high_value", "severity": "warn",
                    "title": f"£{succeeded_amt/100:,.0f} refunded in last window — investigate."})

    if not out:
        out.append({"id": "fin_healthy", "severity": "success",
                    "title": "Finance posture healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
