"""Domain 17 — Inbox analytics.

Operational summaries for the messaging surface: prioritisation cards,
anomaly commentary, mention backlog hints. No predictive ML — the inbox
domain prefers deterministic, explainable signals so the NestJS bridge
can short-circuit on a clean fallback if the service is cold.
"""
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ._obs import track

router = APIRouter(prefix="/inbox", tags=["inbox-analytics"])


class InsightsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    unreadTotal: int = Field(ge=0, default=0)
    mentionTotal: int = Field(ge=0, default=0)
    urgentThreads: int = Field(ge=0, default=0)
    avgResponseHours: float = Field(ge=0.0, default=0.0)
    oldestUnreadHours: float = Field(ge=0.0, default=0.0)


@router.post("/insights")
def insights(req: InsightsRequest):
    with track("inbox.insights"):
        cards: list[dict[str, Any]] = []
        if req.urgentThreads > 0:
            cards.append({"key": "urgent", "priority": "high",
                          "title": f"{req.urgentThreads} urgent thread{'s' if req.urgentThreads>1 else ''} waiting on a reply",
                          "action": "Open queue"})
        if req.mentionTotal > 0:
            cards.append({"key": "mentions", "priority": "high",
                          "title": f"{req.mentionTotal} unread mention{'s' if req.mentionTotal>1 else ''}",
                          "action": "Open mentions"})
        if req.oldestUnreadHours >= 24:
            cards.append({"key": "stale", "priority": "medium",
                          "title": f"Oldest unread thread is {int(req.oldestUnreadHours)}h old",
                          "action": "Sweep inbox"})
        if req.avgResponseHours and req.avgResponseHours > 8:
            cards.append({"key": "response", "priority": "medium",
                          "title": f"Avg response time {req.avgResponseHours:.1f}h — buyers expect <2h",
                          "action": "Set status"})
        if req.unreadTotal == 0 and req.mentionTotal == 0:
            cards.append({"key": "clear", "priority": "low",
                          "title": "Inbox zero — nothing waiting on you",
                          "action": "Open archive"})
        return {"data": {"cards": cards, "count": len(cards)},
                "meta": {"source": "inbox-analytics-v1", "latency_ms": 0}}
