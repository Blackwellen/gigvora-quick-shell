"""Domain 10 — Network analytics + connection suggestion ranking.

Endpoints:
  POST /network/rank-suggestions — re-rank candidate connections using degree,
                                   mutual count, and shared-tag affinity. No
                                   model required; deterministic fallback.
  POST /network/insights         — operator summary: pending/accepted ratio,
                                   stale requests, network velocity.
"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/network", tags=["network"])


class Candidate(BaseModel):
    user_id: str
    degree: int = 2
    mutual_count: int = 0
    shared_tags: int = 0
    activity_score: float = 0.0  # 0..1 recent posting/engagement


class RankRequest(BaseModel):
    items: list[Candidate]


@router.post("/rank-suggestions")
def rank_suggestions(req: RankRequest):
    out = []
    for c in req.items:
        # 2° gets priority over 3°; mutuals dominate; shared tags + activity refine
        degree_score = 1.0 if c.degree == 2 else 0.5
        mutual = min(c.mutual_count, 50) / 50.0
        tags = min(c.shared_tags, 10) / 10.0
        activity = max(0.0, min(1.0, c.activity_score))
        score = round(0.40 * mutual + 0.25 * degree_score + 0.20 * tags + 0.15 * activity, 6)
        out.append({"user_id": c.user_id, "score": score, "degree": c.degree, "mutual_count": c.mutual_count})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"items": out, "fallback": True}


class InsightsRequest(BaseModel):
    pending_in: int = 0
    pending_out: int = 0
    accepted_30d: int = 0
    declined_30d: int = 0
    last_request_at: str | None = None


@router.post("/insights")
def insights(req: InsightsRequest):
    accept_rate = (
        round(req.accepted_30d / (req.accepted_30d + req.declined_30d), 3)
        if (req.accepted_30d + req.declined_30d) > 0 else None
    )
    stale_hours = None
    if req.last_request_at:
        try:
            dt = datetime.fromisoformat(req.last_request_at.replace("Z", "+00:00"))
            stale_hours = round((datetime.now(timezone.utc) - dt).total_seconds() / 3600.0, 1)
        except Exception:
            stale_hours = None
    flags = []
    if req.pending_in >= 10: flags.append("incoming_backlog")
    if accept_rate is not None and accept_rate < 0.3: flags.append("low_accept_rate")
    if stale_hours and stale_hours > 24 * 14: flags.append("network_dormant")
    return {
        "accept_rate": accept_rate,
        "stale_hours": stale_hours,
        "flags": flags,
        "summary": (
            f"{req.pending_in} pending in / {req.pending_out} pending out · "
            f"{req.accepted_30d} accepted in last 30 days"
        ),
        "fallback": True,
    }
