"""Domain 16 — Trust analytics.

Computes a defensible 5-dimension trust score for any subject:
  delivery, communication, quality, professionalism, timeliness.

Inputs are repository aggregates (review count, avg rating, verifications,
badges). Designed to run with no heavy deps; the NestJS bridge wraps the
result in a deterministic fallback so the TrustPage scorecard never blanks.
"""
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ._obs import track

router = APIRouter(prefix="/trust", tags=["trust-analytics"])


class ScoreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    subjectKind: str = Field(min_length=1, max_length=40)
    subjectId: str = Field(min_length=1, max_length=120)
    reviewCount: int = Field(ge=0, default=0)
    avgRating: float = Field(ge=0.0, le=5.0, default=0.0)
    verifications: int = Field(ge=0, default=0)
    badges: int = Field(ge=0, default=0)


def _band(score: int) -> str:
    if score >= 90: return "platinum"
    if score >= 80: return "gold"
    if score >= 65: return "silver"
    if score >= 45: return "bronze"
    return "new"


@router.post("/score")
def score(req: ScoreRequest):
    with track("trust.score"):
        rating_norm = (req.avgRating / 5.0) if req.avgRating else 0.0
        review_weight = min(1.0, req.reviewCount / 20.0)
        verif_weight = min(1.0, req.verifications / 5.0)
        badge_weight = min(1.0, req.badges / 5.0)

        # Five dimensions, each 0–100, with explainable weighting.
        dims = [
            ("delivery",        "Delivery Reliability", round(60 + 35 * rating_norm * review_weight)),
            ("communication",   "Communication",         round(55 + 35 * rating_norm)),
            ("quality",         "Quality of Work",       round(65 + 30 * rating_norm)),
            ("professionalism", "Professionalism",       round(60 + 30 * verif_weight + 5 * badge_weight)),
            ("timeliness",      "Timeliness",            round(55 + 35 * (rating_norm * 0.6 + review_weight * 0.4))),
        ]
        # Cap to 100 and emit neutral trend (real trend requires a time series).
        dimensions = [
            {"key": k, "label": l, "score": min(100, max(0, s)), "trend": "neutral"}
            for k, l, s in dims
        ]
        overall = round(sum(d["score"] for d in dimensions) / len(dimensions))
        return {
            "data": {
                "overall": overall,
                "band": _band(overall),
                "dimensions": dimensions,
            },
            "meta": {"source": "trust-analytics-v1", "latency_ms": 0},
        }


class InsightsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pendingReviews: int = Field(ge=0, default=0)
    disputedReviews: int = Field(ge=0, default=0)
    avgResponseHours: float = Field(ge=0.0, default=0.0)
    badgeGaps: list[str] = Field(default_factory=list, max_length=20)


@router.post("/insights")
def insights(req: InsightsRequest):
    with track("trust.insights"):
        cards: list[dict[str, Any]] = []
        if req.pendingReviews > 5:
            cards.append({"key": "queue", "priority": "high",   "title": f"{req.pendingReviews} reviews waiting on moderation", "action": "Open queue"})
        if req.disputedReviews:
            cards.append({"key": "dispute", "priority": "high", "title": f"{req.disputedReviews} disputed review{'s' if req.disputedReviews>1 else ''}", "action": "Review evidence"})
        if req.avgResponseHours and req.avgResponseHours > 8:
            cards.append({"key": "response", "priority": "medium", "title": f"Avg response {req.avgResponseHours:.1f}h — lift to <2h to keep Fast Responder badge", "action": "Open inbox"})
        for b in req.badgeGaps[:5]:
            cards.append({"key": f"gap.{b}", "priority": "low", "title": f"Close badge gap: {b.replace('_', ' ')}", "action": "View badge"})
        return {"data": {"cards": cards, "count": len(cards)}, "meta": {"source": "trust-analytics-v1"}}
