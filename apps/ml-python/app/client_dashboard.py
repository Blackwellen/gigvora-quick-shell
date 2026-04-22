"""Domain 50 — Client / Buyer dashboard ML.

Ranks incoming proposals by amount fit, vendor signals and recency. Pure-python
heuristic so the NestJS layer always has a stable answer; swap with embedding
similarity when AGENCY_EMBEDDINGS_BACKEND=open is configured.
"""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/client-dashboard", tags=["client-dashboard"])


class RankProposalsIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)
    budget_cents: int | None = None


@router.post("/rank-proposals")
def rank_proposals(req: RankProposalsIn):
    items = req.items or []
    if not items:
        return {"ranked": [], "model": "client-proposals-v1"}

    max_amt = max((i.get("amountCents", 0) for i in items), default=1) or 1
    out: List[Dict[str, Any]] = []
    for it in items:
        amt = float(it.get("amountCents") or 0)
        amt_score = 1.0 - (amt / max_amt)
        if req.budget_cents:
            # Prefer proposals within 70-110% of stated budget.
            ratio = amt / max(1, req.budget_cents)
            budget_fit = max(0.0, 1.0 - abs(ratio - 0.9))
        else:
            budget_fit = 0.5
        dur = int(it.get("durationDays") or 14)
        dur_score = max(0.0, 1.0 - max(0, dur - 14) / 90.0)
        status = it.get("status") or "received"
        status_boost = 0.15 if status == "shortlisted" else 0.0
        score = (
            0.30 * amt_score
            + 0.35 * budget_fit
            + 0.20 * dur_score
            + status_boost
        )
        out.append({"id": it.get("id"), "score": round(max(0.0, min(1.0, score)), 3)})

    out.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": out, "model": "client-proposals-v1"}
