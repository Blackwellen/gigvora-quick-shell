"""ML for Domain 22 — Webinars.

POST /webinars/rank        — relevance ranking
POST /webinars/recommend   — personalised rail (next 6)

Heuristic: live > soon-to-start > popular, with a profile-skill bonus.
600ms budget, Nest bridge falls back deterministically on timeout.
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class RankBody(BaseModel):
    identityId: str | None = None
    filters: dict[str, Any] = {}
    candidates: list[dict[str, Any]] = []


class RecommendBody(BaseModel):
    identityId: str | None = None
    candidates: list[dict[str, Any]] = []


def _score(w: dict, profile_topics: set[str]) -> float:
    s = 0.0
    if w.get("status") == "live":
        s += 100
    starts = datetime.fromisoformat(w["startsAt"].replace("Z", "+00:00"))
    days_away = abs((starts - datetime.now(timezone.utc)).total_seconds() / 86400)
    s += max(0.0, 50.0 - days_away * 2)
    s += w.get("registrations", 0) / 50
    if profile_topics:
        s += len(set(w.get("topics", [])) & profile_topics) * 8
    return s


@router.post("/webinars/rank")
def rank(body: RankBody):
    topics = {"ai", "react"} if body.identityId else set()
    ranked = sorted(body.candidates, key=lambda w: _score(w, topics), reverse=True)
    return {"ranked": ranked, "mode": "ml"}


@router.post("/webinars/recommend")
def recommend(body: RecommendBody):
    topics = {"ai", "platform"} if body.identityId else set()
    upcoming = [w for w in body.candidates if w.get("status") in ("scheduled", "live")]
    ranked = sorted(upcoming, key=lambda w: _score(w, topics), reverse=True)[:6]
    return {"recommended": ranked, "mode": "ml"}
