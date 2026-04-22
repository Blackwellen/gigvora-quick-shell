"""Domain 09 — Feed analytics + ranking.

Endpoints:
  POST /feed/rank    — re-rank a candidate set of posts using deterministic
                       signals (recency, reactions, comments, opportunity boost,
                       follow affinity). No model required; a future ML pass can
                       replace this body and keep the same contract.
  POST /feed/digest  — group ranked posts into a daily digest summary.
"""
from __future__ import annotations
from datetime import datetime, timezone
import math
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/feed", tags=["feed"])


class PostCandidate(BaseModel):
    id: str
    kind: str
    created_at: str
    reaction_count: int = 0
    comment_count: int = 0
    reason: str | None = None
    follow_affinity: float = 0.0   # 0..1 viewer→author tie strength


class RankRequest(BaseModel):
    items: list[PostCandidate]


def _age_hours(iso: str) -> float:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0)
    except Exception:
        return 24.0


@router.post("/rank")
def rank(req: RankRequest):
    out = []
    for p in req.items:
        recency = math.exp(-_age_hours(p.created_at) / 36.0)         # 36h half-life
        engagement = math.log1p(p.reaction_count + 2 * p.comment_count) / 6.0
        opportunity_boost = 0.15 if p.kind == "opportunity" else 0.0
        affinity = 0.20 * max(0.0, min(1.0, p.follow_affinity))
        score = round(0.45 * recency + 0.30 * engagement + opportunity_boost + affinity, 6)
        out.append({"id": p.id, "score": score, "reason": p.reason or ("opportunity" if p.kind == "opportunity" else "recommended")})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"items": out, "fallback": True}


@router.post("/digest")
def digest(req: RankRequest):
    ranked = rank(req)["items"]
    top = ranked[:5]
    return {
        "summary": f"{len(ranked)} posts in your feed; top {len(top)} surfaced.",
        "top": top,
        "fallback": True,
    }
