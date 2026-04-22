"""Domain 9 — Feed ranker (Turn 2).

Deterministic primary path: recency × affinity × diversity × engagement velocity.
Owns the ranker so the NestJS bridge can fall back to chronological order if
this service is unavailable.
"""
from __future__ import annotations

import math
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/feed", tags=["feed-ml"])
MODEL = "feed-affinity-recency"
VERSION = "1.0.0"


class FeedItem(BaseModel):
    id: str
    author_id: str
    created_hours_ago: float = 0.0
    kind: str = "post"  # post|article|reel|event|gig|share
    likes: int = 0
    comments: int = 0
    shares: int = 0
    tags: list[str] = Field(default_factory=list)


class Viewer(BaseModel):
    id: str
    follows: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    muted_authors: list[str] = Field(default_factory=list)


class RankRequest(BaseModel):
    viewer: Viewer
    items: list[FeedItem]
    diversify_by: str = "author_id"
    limit: int = 30


@router.post("/rank")
def rank(req: RankRequest) -> dict[str, Any]:
    started = time.perf_counter()
    follows = set(req.viewer.follows)
    interests = set(t.lower() for t in req.viewer.interests)
    muted = set(req.viewer.muted_authors)

    scored: list[dict[str, Any]] = []
    for it in req.items:
        if it.author_id in muted:
            continue
        recency = math.exp(-it.created_hours_ago / 24.0)  # 24h half-ish life
        affinity = 1.0 if it.author_id in follows else 0.35
        tag_overlap = len(interests & set(t.lower() for t in it.tags)) / max(1, len(interests or {""}))
        velocity = math.log1p(it.likes + 2 * it.comments + 3 * it.shares) / 5.0
        kind_weight = {"post": 1.0, "article": 1.05, "reel": 1.15, "event": 1.10, "gig": 1.05, "share": 0.85}.get(it.kind, 1.0)
        score = round((0.45 * recency + 0.30 * affinity + 0.15 * tag_overlap + 0.10 * velocity) * kind_weight, 5)
        scored.append({"id": it.id, "author_id": it.author_id, "score": score})

    scored.sort(key=lambda r: r["score"], reverse=True)

    # MMR-lite diversification: cap consecutive items from the same key.
    diversified: list[dict[str, Any]] = []
    last_key = None
    streak = 0
    pending: list[dict[str, Any]] = []
    for r in scored:
        key = r.get(req.diversify_by)
        if key == last_key and streak >= 2:
            pending.append(r)
            continue
        diversified.append(r)
        streak = streak + 1 if key == last_key else 1
        last_key = key
        if len(diversified) >= req.limit:
            break
    if len(diversified) < req.limit:
        diversified.extend(pending[: req.limit - len(diversified)])

    return {
        "data": diversified,
        "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)},
    }
