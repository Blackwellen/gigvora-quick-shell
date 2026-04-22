"""Domain 11 — Profiles & Reputation analytics.
Provides operational summaries, prioritisation hints, and a deterministic
reputation score that mirrors the NestJS service for cross-validation.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Optional

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ReputationComponents(BaseModel):
    reviews: float = 0           # 0..5 average rating
    completion: float = 0        # 0..1 portfolio/profile completeness
    verifications: int = 0       # active verification count
    activity: float = 0          # 0..1 activity recency
    endorsements: int = 0        # total endorsement count


class ScoreRequest(BaseModel):
    components: ReputationComponents


def _band(score: float) -> str:
    if score >= 80: return "top"
    if score >= 60: return "trusted"
    if score >= 30: return "rising"
    return "new"


@router.post("/score")
def score(req: ScoreRequest):
    c = req.components
    raw = (
        30 * c.reviews / 5
        + 20 * c.completion
        + min(c.verifications, 5) * 4
        + 15 * c.activity
        + min(c.endorsements, 100) * 0.15
    )
    s = max(0.0, min(100.0, round(raw * 10) / 10))
    return {"score": s, "band": _band(s), "components": c.model_dump()}


class InsightsRequest(BaseModel):
    profile: dict[str, Any]
    skills: list[dict[str, Any]] = []
    portfolio: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []
    verifications: list[dict[str, Any]] = []


@router.post("/insights")
def insights(req: InsightsRequest):
    suggestions: list[dict[str, str]] = []
    p = req.profile or {}
    if not p.get("headline"): suggestions.append({"key": "headline", "label": "Add a professional headline"})
    if not p.get("summary") or len(str(p.get("summary"))) < 80:
        suggestions.append({"key": "summary", "label": "Expand your summary (80+ chars)"})
    if len(req.skills) < 5:
        suggestions.append({"key": "skills", "label": "Add at least 5 skills"})
    if len(req.portfolio) < 3:
        suggestions.append({"key": "portfolio", "label": "Add 3+ portfolio items"})
    active_verif = [v for v in req.verifications if v.get("status") == "active"]
    if not any(v.get("kind") == "id_document" for v in active_verif):
        suggestions.append({"key": "id_verification", "label": "Verify your ID for the trust badge"})
    avg = sum(r.get("rating", 0) for r in req.reviews) / len(req.reviews) if req.reviews else 0
    return {
        "completeness": round(min(1.0, 0.2 * bool(p.get("headline"))
            + 0.2 * bool(p.get("summary"))
            + 0.2 * (len(req.skills) >= 5)
            + 0.2 * (len(req.portfolio) >= 3)
            + 0.2 * bool(active_verif)), 3),
        "avgRating": round(avg, 2),
        "suggestions": suggestions,
    }
