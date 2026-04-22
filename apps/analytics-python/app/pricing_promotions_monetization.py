"""Domain 64 — Pricing, Promotions & Monetization insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/pricing-promotions-monetization",
                   tags=["pricing-promotions-monetization"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    active_packages = int(s.get("activePackages") or 0)
    active_promos = int(s.get("activePromos") or 0)
    redeemed = int(s.get("totalRedeemed") or 0)

    if active_packages == 0:
        out.append({"id": "no_active_package", "severity": "warn",
                    "title": "Publish at least one offer package to start selling."})
    elif active_packages == 1:
        out.append({"id": "single_package", "severity": "info",
                    "title": "Add a higher tier to lift average revenue per buyer."})

    if active_promos == 0:
        out.append({"id": "no_promo", "severity": "info",
                    "title": "Launch a promo code to drive first conversions."})
    elif active_promos > 0 and redeemed == 0:
        out.append({"id": "promo_no_redemptions", "severity": "warn",
                    "title": "Promotions live but no redemptions yet — check visibility."})

    if not out:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Monetisation surfaces healthy."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
