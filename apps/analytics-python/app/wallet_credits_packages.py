"""Domain 57 — Wallet/credits/purchase analytics & insights."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/wallet-credits-packages", tags=["wallet-credits-packages"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    cash = int(s.get("cashBalanceMinor") or 0)
    credit = int(s.get("creditBalance") or 0)
    held = int(s.get("heldBalanceMinor") or 0)
    failed = int(s.get("failedPurchases") or 0)
    pending = int(s.get("pendingPurchases") or 0)
    spend = int(s.get("lifetimeSpendMinor") or 0)

    if credit == 0:
        out.append({"id": "no-credits", "severity": "warn",
                    "title": "No credits remaining",
                    "body": "Top up to keep using metered features."})
    if failed > 0:
        out.append({"id": "failed-purchases", "severity": "error",
                    "title": f"{failed} failed purchase(s)",
                    "body": "Retry the purchase or update the payment method."})
    if pending >= 3:
        out.append({"id": "many-pending", "severity": "warn",
                    "title": f"{pending} purchases pending",
                    "body": "Confirm or cancel stale checkout sessions."})
    if held > 0:
        out.append({"id": "funds-held", "severity": "info",
                    "title": f"£{held/100:.2f} held for payouts",
                    "body": "These funds are reserved against scheduled payouts."})
    if spend == 0 and cash == 0 and credit == 0:
        out.append({"id": "empty-wallet", "severity": "info",
                    "title": "Wallet empty",
                    "body": "Buy a package to get started."})
    if not out:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Wallet healthy",
                    "body": "Balances and recent activity look normal."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
