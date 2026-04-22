"""Domain 61 — Ads Analytics insights service."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ads-analytics-performance", tags=["ads-analytics-performance"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(signals: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    totals = signals.get("totals") or {}
    derived = signals.get("derived") or {}
    impressions = int(totals.get("impressions") or 0)
    spend = int(totals.get("spend_minor") or 0)
    revenue = int(totals.get("revenue_minor") or 0)
    ctr = float(derived.get("ctr") or 0)
    cvr = float(derived.get("cvr") or 0)
    roas = float(derived.get("roas") or 0)

    if impressions == 0:
        out.append({"id": "no_data", "severity": "info",
                    "title": "No impressions in the last 30 days",
                    "body": "Activate a campaign to start collecting performance data."})
        return out
    if ctr > 0 and ctr < 0.005:
        out.append({"id": "low_ctr", "severity": "warn",
                    "title": f"CTR {ctr*100:.2f}% — below 0.5% benchmark",
                    "body": "Test new creative variants or tighten audience targeting."})
    if cvr > 0 and cvr < 0.01:
        out.append({"id": "low_cvr", "severity": "warn",
                    "title": f"CVR {cvr*100:.2f}% — landing page friction likely",
                    "body": "Audit destination page load, form length, and value prop."})
    if roas > 0 and roas < 1:
        out.append({"id": "negative_roas", "severity": "critical",
                    "title": f"ROAS {roas:.2f}× — spend exceeds revenue",
                    "body": "Pause weakest ad groups or rebalance bids."})
    if revenue > 0 and roas >= 2.5:
        out.append({"id": "scale_now", "severity": "success",
                    "title": f"ROAS {roas:.2f}× — scale top performers",
                    "body": "Increase budgets on the highest-converting ad groups."})
    if spend > 100_00 and not out:
        out.append({"id": "healthy", "severity": "success", "title": "Performance steady"})
    if not out:
        out.append({"id": "warming", "severity": "info", "title": "Still warming up — gather more data"})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
