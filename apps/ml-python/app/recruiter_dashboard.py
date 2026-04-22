"""Domain 51 — Recruiter dashboard ML.

Predicts reply probability for outreach messages from channel, status and
recency features. Pure-python heuristic so NestJS always has a stable answer.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/recruiter-dashboard", tags=["recruiter-dashboard"])

CHANNEL_BASE = {"email": 0.18, "inmail": 0.22, "sms": 0.32, "call": 0.45}


class PredictRepliesIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/predict-replies")
def predict_replies(req: PredictRepliesIn):
    out: List[Dict[str, Any]] = []
    now = datetime.now(timezone.utc)
    for it in req.items or []:
        channel = (it.get("channel") or "email").lower()
        base = CHANNEL_BASE.get(channel, 0.2)
        status_boost = 0.15 if it.get("status") == "opened" else 0.0

        recency_decay = 0.0
        sent_at = it.get("sentAt") or it.get("createdAt")
        if sent_at:
            try:
                ts = datetime.fromisoformat(str(sent_at).replace("Z", "+00:00"))
                hours = max(0.0, (now - ts).total_seconds() / 3600.0)
                # decay after 72h
                recency_decay = min(0.15, max(0.0, (hours - 72) / 600.0))
            except Exception:
                pass

        score = max(0.0, min(1.0, base + status_boost - recency_decay))
        out.append({"id": it.get("id"), "replyProbability": round(score, 3)})

    return {"predictions": out, "model": "recruiter-replies-v1"}


class RankCandidatesIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/rank-candidates")
def rank_candidates(req: RankCandidatesIn):
    items = req.items or []
    if not items:
        return {"ranked": [], "model": "recruiter-candidates-v1"}
    out = []
    for it in items:
        rating = float(it.get("rating") or 0) / 5.0
        recency = 0.0
        seen = it.get("lastActivityAt")
        if seen:
            try:
                ts = datetime.fromisoformat(str(seen).replace("Z", "+00:00"))
                days = max(0.0, (datetime.now(timezone.utc) - ts).days)
                recency = max(0.0, 1.0 - days / 30.0)
            except Exception:
                pass
        score = round(0.6 * rating + 0.4 * recency, 3)
        out.append({"id": it.get("id"), "score": score})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": out, "model": "recruiter-candidates-v1"}
