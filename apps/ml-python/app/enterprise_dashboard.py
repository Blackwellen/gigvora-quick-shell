"""Domain 53 — Enterprise dashboard ML.

Risk-scores purchase orders for approval queue prioritisation, and ranks
requisitions by hiring urgency. Pure-python heuristics ensure stable answers.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/enterprise-dashboard", tags=["enterprise-dashboard"])


class ScorePOsIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/score-purchase-orders")
def score_purchase_orders(req: ScorePOsIn):
    out: List[Dict[str, Any]] = []
    for it in req.items or []:
        score = 0.0
        amount = float(it.get("amountCents") or 0)
        if amount > 5_000_000: score += 0.4
        elif amount > 1_000_000: score += 0.2
        elif amount > 250_000: score += 0.1
        if (it.get("status") or "") == "submitted": score += 0.15
        if not it.get("vendorIdentityId"): score += 0.1  # unknown vendor
        cat = (it.get("category") or "").lower()
        if cat in ("services", "software"): score += 0.05
        out.append({"id": it.get("id"), "riskScore": round(min(1.0, max(0.0, score)), 3)})
    return {"scores": out, "model": "ed-po-risk-v1"}


class RankRequisitionsIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/rank-requisitions")
def rank_requisitions(req: RankRequisitionsIn):
    now = datetime.now(timezone.utc)
    out: List[Dict[str, Any]] = []
    for it in req.items or []:
        score = 0.0
        seniority = (it.get("seniority") or "mid").lower()
        if seniority in ("senior", "lead"): score += 0.2
        if seniority in ("principal", "executive"): score += 0.35
        headcount = int(it.get("headcount") or 1)
        if headcount > 1: score += min(0.2, headcount * 0.05)
        target = it.get("targetFillBy")
        if target:
            try:
                ts = datetime.fromisoformat(str(target) + "T00:00:00+00:00")
                days = (ts - now).days
                if days < 14: score += 0.3
                elif days < 30: score += 0.15
            except Exception:
                pass
        if int(it.get("applicants") or 0) < 5: score += 0.1
        out.append({"id": it.get("id"), "score": round(min(1.0, max(0.0, score)), 3)})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": out, "model": "ed-req-priority-v1"}
