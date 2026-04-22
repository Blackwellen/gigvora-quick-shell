"""Domain 21 — Podcasts ML endpoints (deterministic, explainable)."""
from __future__ import annotations
from datetime import datetime
from math import log10
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/podcasts", tags=["podcasts"])


class ShowIn(BaseModel):
    id: str
    subscribers: int = 0
    rating: float = 0.0
    updatedAt: str | None = None
    tags: list[str] = []


class RankIn(BaseModel):
    shows: list[ShowIn]
    userTags: list[str] | None = None


@router.post("/rank-discovery")
def rank_discovery(payload: RankIn) -> dict[str, Any]:
    user_tags = {t.lower() for t in (payload.userTags or [])}
    now = datetime.utcnow()
    ranked: list[dict[str, Any]] = []
    for s in payload.shows:
        try:
            updated = datetime.fromisoformat(s.updatedAt.replace("Z", "")) if s.updatedAt else now
        except Exception:
            updated = now
        recency_days = max(1, (now - updated).days + 1)
        recency_bonus = max(0.0, 30 - log10(recency_days) * 8)
        tag_overlap = sum(1 for t in s.tags if t.lower() in user_tags)
        score = log10(1 + s.subscribers) * 30 + s.rating * 8 + tag_overlap * 10 + recency_bonus
        ranked.append({"id": s.id, "score": round(score, 2)})
    ranked.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": ranked, "reason": "subscribers+rating+tagOverlap+recency"}


class EpisodeIn(BaseModel):
    id: str
    showId: str
    plays: int = 0
    publishedAt: str | None = None
    access: str = "free"


class RecommendIn(BaseModel):
    episodes: list[EpisodeIn]
    recentShowIds: list[str] | None = None


@router.post("/recommend-next")
def recommend_next(payload: RecommendIn) -> dict[str, Any]:
    recent = set(payload.recentShowIds or [])
    ranked: list[dict[str, Any]] = []
    for e in payload.episodes:
        score = log10(1 + e.plays) * 25
        if e.showId in recent:
            score += 15  # continuity boost
        if e.access == "free":
            score += 5
        ranked.append({"id": e.id, "score": round(score, 2), "showId": e.showId})
    ranked.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": ranked, "reason": "plays+continuity+access"}


class RecordingScoreIn(BaseModel):
    durationSec: int
    sizeBytes: int | None = None
    tags: list[str] | None = None


@router.post("/score-recording")
def score_recording(payload: RecordingScoreIn) -> dict[str, Any]:
    duration_factor = min(1.0, payload.durationSec / 1800)
    bitrate_factor = 0.5
    if payload.sizeBytes and payload.durationSec:
        kbps = (payload.sizeBytes * 8) / max(1, payload.durationSec) / 1000
        bitrate_factor = min(1.0, kbps / 128)
    tag_factor = min(0.2, len(payload.tags or []) * 0.04)
    raw = 40 + duration_factor * 40 + bitrate_factor * 15 + tag_factor * 100
    score = round(min(100, max(0, raw)))
    band = "high" if score >= 75 else "medium" if score >= 55 else "low"
    return {"score": score, "band": band, "reason": "duration+bitrate+tags"}
