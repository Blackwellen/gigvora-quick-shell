"""Analytics for Sales Navigator — funnel, outreach, geo, signal coverage."""
from __future__ import annotations
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/sales-navigator", tags=["sales-navigator"])


class OverviewIn(BaseModel):
    leads: List[Dict[str, Any]] = Field(default_factory=list)
    activities: List[Dict[str, Any]] = Field(default_factory=list)
    sequences: List[Dict[str, Any]] = Field(default_factory=list)
    goals: List[Dict[str, Any]] = Field(default_factory=list)
    signals: List[Dict[str, Any]] = Field(default_factory=list)
    seats: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/overview")
def overview(body: OverviewIn):
    by_status = Counter([(l.get("status") or "new") for l in body.leads])
    by_region = Counter([(l.get("region") or "Unknown") for l in body.leads])
    by_country = Counter([(l.get("hq_country") or "Unknown") for l in body.leads])
    by_industry = Counter([(l.get("industry") or "Unknown") for l in body.leads])
    by_seniority = Counter([(l.get("seniority") or "ic") for l in body.leads])

    sent = sum(1 for a in body.activities if a.get("status") in ("sent","delivered","opened","replied"))
    replied = sum(1 for a in body.activities if a.get("status") == "replied")
    opened = sum(1 for a in body.activities if a.get("status") in ("opened","replied"))
    reply_rate = round(replied / max(1, sent), 3)
    open_rate = round(opened / max(1, sent), 3)

    signals_by_kind = Counter([(s.get("kind") or "other") for s in body.signals])
    top_companies = Counter([(s.get("company_name") or s.get("company_id") or "?") for s in body.signals]).most_common(10)

    seat_used = sum(int(s.get("monthly_credit_used") or 0) for s in body.seats)
    seat_quota = sum(int(s.get("monthly_credit_quota") or 0) for s in body.seats)
    seat_util = round(seat_used / max(1, seat_quota), 3)

    insights: List[Dict[str, str]] = []
    if reply_rate < 0.05 and sent >= 20:
        insights.append({"code": "low_reply_rate", "message": f"Reply rate is {int(reply_rate*100)}%. Tighten subject lines + ICP fit."})
    if by_status.get("new", 0) > sum(by_status.values()) * 0.6:
        insights.append({"code": "stale_pipeline", "message": "Most leads are still 'new'. Move to researching/contacted."})
    if seat_util > 0.85:
        insights.append({"code": "credit_pressure", "message": f"Seat credits {int(seat_util*100)}% used — request a quota uplift."})
    if not body.signals:
        insights.append({"code": "no_signals", "message": "No fresh sales signals — enable signal ingestion to surface intent."})

    return {
        "data": {
            "totals": {
                "leads": len(body.leads), "activities": len(body.activities),
                "sequences": len(body.sequences), "goals": len(body.goals),
                "signals": len(body.signals), "seats": len(body.seats),
            },
            "leadsByStatus": dict(by_status),
            "leadsByRegion": dict(by_region),
            "leadsByCountry": dict(by_country),
            "leadsByIndustry": dict(by_industry),
            "leadsBySeniority": dict(by_seniority),
            "outreach": {"sent": sent, "opened": opened, "replied": replied,
                         "openRate": open_rate, "replyRate": reply_rate},
            "signals": {"byKind": dict(signals_by_kind), "topCompanies": top_companies},
            "seats": {"creditsUsed": seat_used, "creditsQuota": seat_quota, "utilization": seat_util},
            "insights": insights,
        },
        "meta": {"window": "all", "computed_at": datetime.now(timezone.utc).isoformat()},
    }
