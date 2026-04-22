"""Analytics for Enterprise Connect.

Operational summaries + insight cards. Deterministic, time-bucketed,
locked response envelope: { data, meta: { window, computed_at } }.
"""
from __future__ import annotations
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/enterprise-connect", tags=["enterprise-connect"])


class OverviewIn(BaseModel):
    orgs: List[Dict[str, Any]] = Field(default_factory=list)
    intros: List[Dict[str, Any]] = Field(default_factory=list)
    briefs: List[Dict[str, Any]] = Field(default_factory=list)
    rooms: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/overview")
def overview(body: OverviewIn):
    by_kind = Counter([(o.get("kind") or "enterprise") for o in body.orgs])
    by_status = Counter([(o.get("status") or "draft") for o in body.orgs])
    intros_by_status = Counter([(i.get("status") or "pending") for i in body.intros])
    briefs_by_status = Counter([(b.get("status") or "draft") for b in body.briefs])

    accepted = intros_by_status.get("accepted", 0) + intros_by_status.get("completed", 0)
    declined = intros_by_status.get("declined", 0)
    accept_rate = round(accepted / max(1, accepted + declined), 3)

    insights: List[Dict[str, str]] = []
    if accept_rate < 0.5 and (accepted + declined) >= 5:
        insights.append({"code": "low_intro_accept_rate",
                         "message": f"Intro acceptance is {int(accept_rate * 100)}%. Improve broker fit and reason quality."})
    if briefs_by_status.get("open", 0) == 0 and len(body.briefs) > 0:
        insights.append({"code": "no_open_briefs", "message": "No open procurement briefs — your supplier funnel is dry."})
    if by_status.get("draft", 0) > by_status.get("active", 0):
        insights.append({"code": "many_draft_orgs", "message": "Most org profiles are still drafts — publish to appear in the directory."})

    return {
        "data": {
            "totals": {
                "orgs": len(body.orgs), "intros": len(body.intros),
                "briefs": len(body.briefs), "rooms": len(body.rooms), "events": len(body.events),
            },
            "byKind": dict(by_kind),
            "byStatus": dict(by_status),
            "intros": {"byStatus": dict(intros_by_status), "acceptRate": accept_rate},
            "briefs": {"byStatus": dict(briefs_by_status)},
            "insights": insights,
        },
        "meta": {"window": "all", "computed_at": datetime.now(timezone.utc).isoformat()},
    }
