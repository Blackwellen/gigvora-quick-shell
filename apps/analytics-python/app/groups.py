"""Domain 14 — Groups community-health analytics.

Enterprise-grade by contract: deterministic, defensible outputs runnable on a
16 GB-RAM VPS with no GPU/heavy deps. Lock the response shape so the NestJS
adapter can substitute heavier ML later without changing callers.
"""
from datetime import datetime
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/groups", tags=["groups-analytics"])


class HealthRequest(BaseModel):
    group: dict[str, Any]
    members: list[dict[str, Any]] = []
    posts: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    reports_open: int = 0
    requests_pending: int = 0


def _band(score: float) -> str:
    if score >= 0.8: return "thriving"
    if score >= 0.6: return "healthy"
    if score >= 0.4: return "developing"
    return "at_risk"


@router.post("/health")
def health(req: HealthRequest):
    """Score group health across 5 components and emit prioritised next steps."""
    g = req.group or {}
    now = datetime.utcnow().timestamp()
    posts_recent = [p for p in req.posts if (now - datetime.fromisoformat(str(p.get("createdAt", "")).replace("Z", "")).timestamp()) < 7 * 86400] if req.posts else []
    unique_authors_7d = len({p.get("authorId") for p in posts_recent if p.get("authorId")})
    member_count = max(1, len(req.members) or int(g.get("memberCount") or 1))

    components = {
        "membership": min(1.0, len(req.members) / max(50, int(g.get("memberCount") or 50))),
        "activity":   min(1.0, len(posts_recent) / 30),
        "diversity":  min(1.0, unique_authors_7d / max(5, member_count * 0.1)),
        "events":     min(1.0, len([e for e in req.events if e.get("status") in ("scheduled", "live")]) / 4),
        "safety":     max(0.0, 1.0 - (req.reports_open / 20)),
    }
    score = round(sum(components.values()) / len(components), 3)

    suggestions: list[dict[str, str]] = []
    if components["activity"] < 0.4:    suggestions.append({"key": "activity",    "label": "Spark a weekly thread to lift posting cadence"})
    if components["diversity"] < 0.4:   suggestions.append({"key": "diversity",   "label": "Invite 5 quiet members to share their work"})
    if components["events"] < 0.4:      suggestions.append({"key": "events",      "label": "Schedule a community AMA or live session"})
    if components["safety"] < 0.6:      suggestions.append({"key": "safety",      "label": f"Triage {req.reports_open} open reports"})
    if req.requests_pending > 5:        suggestions.append({"key": "requests",    "label": f"{req.requests_pending} join requests waiting for review"})
    if not suggestions:                 suggestions.append({"key": "ok",          "label": "Healthy community — maintain cadence"})

    return {
        "score": score,
        "band":  _band(score),
        "components": {k: round(v, 3) for k, v in components.items()},
        "suggestions": suggestions,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


class FeedRankRequest(BaseModel):
    posts: list[dict[str, Any]]
    viewer: dict[str, Any] = {}
    limit: int = 50


@router.post("/feed/rank")
def feed_rank(req: FeedRankRequest):
    """Deterministic feed re-ranker: pinned > recency-decayed engagement.

    Falls back gracefully when shared ML signals are not available, per the
    Domain 14 spec ("declare whether shared ML signals are consumed, ignored,
    or safely deferred"). Returns identical envelope so callers can swap in a
    learned ranker later.
    """
    now = datetime.utcnow().timestamp()
    out: list[dict[str, Any]] = []
    for p in req.posts:
        try:
            age_h = max(0.5, (now - datetime.fromisoformat(str(p.get("createdAt", "")).replace("Z", "")).timestamp()) / 3600)
        except Exception:
            age_h = 24.0
        engagement = (int(p.get("reactionCount") or 0) * 1.0) + (int(p.get("commentCount") or 0) * 1.5)
        # gravity 1.6 — Hacker-News-style time decay
        score = engagement / (age_h ** 1.6)
        if p.get("pinned"): score += 1000
        out.append({"id": p.get("id"), "score": round(score, 4), "pinned": bool(p.get("pinned"))})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"items": out[: req.limit], "model": "groups-feed-ranker-v1-deterministic"}
