"""Domain 63 — Donations, Purchases & Creator Commerce insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/donations-purchases-commerce", tags=["donations-purchases-commerce"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(signals: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    products = int(signals.get("products") or 0)
    pledges = int(signals.get("pledges") or 0)
    donations = int(signals.get("donations") or 0)
    mrr = int(signals.get("mrrMinor") or 0)

    if products == 0 and pledges == 0:
        out.append({"id": "empty", "severity": "info",
                    "title": "Add a product or patronage tier to start earning."})
    if pledges > 0 and mrr < 1000:
        out.append({"id": "low_mrr", "severity": "warn",
                    "title": "MRR below £10 — consider repositioning your tiers."})
    if donations > 10 and mrr == 0:
        out.append({"id": "convert_donors", "severity": "info",
                    "title": "Donors are engaged — invite them to a recurring tier."})
    if not out:
        out.append({"id": "healthy", "severity": "success", "title": "Commerce healthy."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
