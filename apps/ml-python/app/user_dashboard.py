"""Domain 48 — User Dashboard ML hooks.

Ranks next-best-actions for the personal dashboard. Deterministic scorer with
graceful fallback when no candidate features are provided.
"""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/user-dashboard", tags=["user-dashboard"])


class Action(BaseModel):
    id: str
    kind: str
    priority: int = 50
    age_minutes: int = 0
    has_due: bool = False
    overdue_minutes: int = 0


class RankIn(BaseModel):
    role: str = "user"
    actions: List[Action] = Field(default_factory=list)


class RankItem(BaseModel):
    id: str
    score: float
    reason: str


class RankOut(BaseModel):
    items: List[RankItem]


_KIND_BIAS = {
    "complete_profile": 12,
    "verify_email": 18,
    "accept_offer": 22,
    "review_order": 14,
    "renew": 10,
    "respond_message": 16,
    "approve_spend": 20,
}


@router.post("/rank-actions", response_model=RankOut)
def rank_actions(payload: RankIn) -> RankOut:
    items: List[RankItem] = []
    for a in payload.actions:
        score = float(a.priority)
        score += _KIND_BIAS.get(a.kind, 0)
        if a.has_due:
            score += min(15.0, a.overdue_minutes / 60.0)
        score -= min(10.0, a.age_minutes / 1440.0)  # decay over days
        score = max(0.0, min(100.0, score))
        reason = "due-soon" if a.has_due and a.overdue_minutes >= 0 else "kind-bias"
        items.append(RankItem(id=a.id, score=round(score, 2), reason=reason))
    items.sort(key=lambda x: x.score, reverse=True)
    return RankOut(items=items)
