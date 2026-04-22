"""Domain 07 — Notifications analytics.

Endpoints:
  POST /notifications/rank   — score notifications by importance + freshness
                               so the frontend can sort the bell-icon dropdown.
  POST /notifications/digest — group notifications into a daily digest with
                               summary commentary.

Both fall back to deterministic Python — no model required.
"""
from __future__ import annotations
from collections import defaultdict
from fastapi import APIRouter
from pydantic import BaseModel
import math
import time

router = APIRouter(prefix="/notifications", tags=["notifications"])


PRIORITY_WEIGHT = {"low": 0.4, "normal": 1.0, "high": 1.8, "urgent": 3.2}
CATEGORY_WEIGHT = {"billing": 1.6, "social": 1.0, "system": 0.7, "mention": 1.4}


class NotifRow(BaseModel):
    id: str
    topic: str
    priority: str = "normal"
    category: str | None = None
    created_at: float          # epoch seconds
    read: bool = False
    interactions: int = 0      # past clicks on similar topic


class RankRequest(BaseModel):
    now_ts: float | None = None
    items: list[NotifRow]


@router.post("/rank")
def rank(req: RankRequest):
    """Importance = priority × category × freshness × affinity."""
    now = req.now_ts or time.time()
    scored = []
    for n in req.items:
        if n.read:
            base = 0.2
        else:
            base = PRIORITY_WEIGHT.get(n.priority, 1.0)
        cat = CATEGORY_WEIGHT.get(n.category or "", 1.0)
        # Half-life: 24h. score halves every day old.
        age_hours = max(0.0, (now - n.created_at) / 3600.0)
        freshness = 0.5 ** (age_hours / 24.0)
        affinity = 1.0 + min(0.5, n.interactions * 0.05)
        score = base * cat * freshness * affinity
        scored.append({"id": n.id, "score": round(score, 4)})
    scored.sort(key=lambda x: -x["score"])
    return {"ranked": scored, "fallback": True}


class DigestRequest(BaseModel):
    items: list[NotifRow]


@router.post("/digest")
def digest(req: DigestRequest):
    """Group by topic and produce a one-line summary per group."""
    groups: dict[str, list[NotifRow]] = defaultdict(list)
    for n in req.items:
        groups[n.topic].append(n)

    cards = []
    for topic, rows in groups.items():
        unread = sum(1 for r in rows if not r.read)
        urgents = sum(1 for r in rows if r.priority == "urgent")
        commentary = _commentary(topic, len(rows), unread, urgents)
        cards.append({
            "topic": topic,
            "count": len(rows),
            "unread": unread,
            "urgent": urgents,
            "summary": commentary,
        })
    cards.sort(key=lambda c: (-c["urgent"], -c["unread"], -c["count"]))
    return {"cards": cards, "fallback": True}


def _commentary(topic: str, total: int, unread: int, urgents: int) -> str:
    if urgents:
        return f"{urgents} urgent {topic} event{'s' if urgents != 1 else ''} need attention."
    if unread:
        return f"{unread} unread {topic} update{'s' if unread != 1 else ''} from a total of {total}."
    return f"All caught up on {topic} ({total} item{'s' if total != 1 else ''})."
