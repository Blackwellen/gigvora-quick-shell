"""Domain 7 — Notifications ML (Turn 3).

Priority scorer that ranks pending notifications for a user. Deterministic
mix of: sender affinity, recency, type weight, mention boost, and unread age.
"""
from __future__ import annotations

import math
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/notifications", tags=["notifications-ml"])
MODEL = "notifications-priority-v1"
VERSION = "1.0.0"

_TYPE_WEIGHT = {
    "mention": 1.00, "dm": 0.95, "reply": 0.85, "invite": 0.80,
    "approval_request": 0.90, "rsvp": 0.70, "comment": 0.60,
    "like": 0.30, "follow": 0.40, "system": 0.50, "marketing": 0.10,
}


class Recipient(BaseModel):
    id: str
    follows: list[str] = Field(default_factory=list)
    important_authors: list[str] = Field(default_factory=list)


class Notification(BaseModel):
    id: str
    type: str = "system"
    sender_id: str | None = None
    created_hours_ago: float = 0.0
    is_mention: bool = False
    is_unread: bool = True
    thread_size: int = 0


class PriorityRequest(BaseModel):
    recipient: Recipient
    notifications: list[Notification]
    limit: int = 100


@router.post("/priority")
def priority(req: PriorityRequest) -> dict[str, Any]:
    started = time.perf_counter()
    follows = set(req.recipient.follows)
    important = set(req.recipient.important_authors)
    out: list[dict[str, Any]] = []
    for n in req.notifications:
        type_w = _TYPE_WEIGHT.get(n.type, 0.4)
        affinity = 1.0 if (n.sender_id and n.sender_id in important) else (0.7 if (n.sender_id and n.sender_id in follows) else 0.3)
        recency = math.exp(-n.created_hours_ago / 24.0)
        unread_boost = 1.0 if n.is_unread else 0.4
        mention_boost = 1.15 if n.is_mention else 1.0
        thread_boost = min(1.2, 1.0 + math.log1p(n.thread_size) / 10.0)
        score = round((0.40 * type_w + 0.30 * affinity + 0.20 * recency + 0.10 * unread_boost) * mention_boost * thread_boost, 5)
        out.append({"id": n.id, "score": score, "bucket": "high" if score >= 0.75 else "normal" if score >= 0.45 else "low"})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"data": out[: req.limit], "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)}}
