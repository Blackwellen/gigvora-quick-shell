"""Analytics for Networking + Speed Networking + Events + Groups.

Operational summaries + insight cards. Deterministic, time-bucketed,
locked response envelope: { data, meta: { window, computed_at } }.
"""
from __future__ import annotations
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/networking-events-groups", tags=["networking-events-groups"])


class OverviewIn(BaseModel):
    rooms: List[Dict[str, Any]] = Field(default_factory=list)
    attendees: List[Dict[str, Any]] = Field(default_factory=list)
    speed_matches: List[Dict[str, Any]] = Field(default_factory=list)
    cards_shared: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    rsvps: List[Dict[str, Any]] = Field(default_factory=list)
    groups: List[Dict[str, Any]] = Field(default_factory=list)
    posts: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/overview")
def overview(body: OverviewIn):
    rooms_by_kind = Counter([(r.get("kind") or "open") for r in body.rooms])
    rooms_by_status = Counter([(r.get("status") or "draft") for r in body.rooms])
    paid_rooms = sum(1 for r in body.rooms if r.get("is_paid"))
    avg_attendees = round(len(body.attendees) / max(1, len(body.rooms)), 2)
    speed_avg_score = (
        round(sum(int(m.get("score") or 0) for m in body.speed_matches) / max(1, len(body.speed_matches)), 2)
    )

    events_by_status = Counter([(e.get("status") or "draft") for e in body.events])
    rsvps_by_status = Counter([(r.get("status") or "going") for r in body.rsvps])
    rsvp_yield = round(rsvps_by_status.get("going", 0) / max(1, len(body.events)), 2)

    groups_by_visibility = Counter([(g.get("visibility") or "public") for g in body.groups])
    avg_group_size = round(sum(int(g.get("member_count") or 0) for g in body.groups) / max(1, len(body.groups)), 2)
    posts_per_group = round(len(body.posts) / max(1, len(body.groups)), 2)

    insights: List[Dict[str, str]] = []
    if rooms_by_status.get("draft", 0) > rooms_by_status.get("scheduled", 0) + rooms_by_status.get("live", 0):
        insights.append({"code": "many_draft_rooms",
                         "message": "Most rooms are still drafts — schedule or publish to get attendees."})
    if speed_avg_score < 40 and len(body.speed_matches) >= 5:
        insights.append({"code": "low_speed_quality",
                         "message": f"Average speed-match quality is {speed_avg_score}/100. Tune interest tags."})
    if paid_rooms > 0 and avg_attendees < 3:
        insights.append({"code": "paid_low_attendance",
                         "message": "Paid rooms are seeing low attendance — consider promo codes or free tier."})
    if rsvp_yield < 1 and len(body.events) > 0:
        insights.append({"code": "low_rsvp_yield",
                         "message": "Events are averaging <1 RSVP. Cross-post to relevant groups."})
    if avg_group_size < 5 and len(body.groups) >= 3:
        insights.append({"code": "small_groups",
                         "message": "Groups are small — invite members to reach activation threshold."})

    return {
        "data": {
            "rooms": {
                "total": len(body.rooms), "byKind": dict(rooms_by_kind), "byStatus": dict(rooms_by_status),
                "paid": paid_rooms, "avgAttendees": avg_attendees,
            },
            "speed": {"matches": len(body.speed_matches), "avgScore": speed_avg_score},
            "cards": {"sharesTotal": len(body.cards_shared)},
            "events": {"total": len(body.events), "byStatus": dict(events_by_status),
                       "rsvpsByStatus": dict(rsvps_by_status), "rsvpYieldPerEvent": rsvp_yield},
            "groups": {"total": len(body.groups), "byVisibility": dict(groups_by_visibility),
                       "avgSize": avg_group_size, "postsPerGroup": posts_per_group},
            "insights": insights,
        },
        "meta": {"window": "all", "computed_at": datetime.now(timezone.utc).isoformat()},
    }
