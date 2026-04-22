"""Domain 61 — Ads Analytics: deterministic creative performance scoring."""
from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ads-analytics-performance", tags=["ads-analytics-performance"])


class ScoreIn(BaseModel):
    counters: Dict[str, Any] = Field(default_factory=dict)
    derived: Dict[str, Any] = Field(default_factory=dict)


def _band(score: float) -> str:
    if score >= 0.85: return "top"
    if score >= 0.7:  return "strong"
    if score >= 0.5:  return "average"
    if score >= 0.3:  return "weak"
    return "poor"


@router.post("/score-creative")
def score_creative(req: ScoreIn):
    """Deterministic 0..1 performance + 0..1 fatigue scoring.

    Heuristics:
      • +CTR ≥ 0.02 boosts score; CTR < 0.005 penalises.
      • +CVR ≥ 0.04 and ROAS ≥ 1.5 each contribute.
      • Fatigue rises when impressions are large but CTR is collapsing.
    """
    c = req.counters or {}
    d = req.derived or {}
    ctr = float(d.get("ctr") or 0)
    cvr = float(d.get("cvr") or 0)
    roas = float(d.get("roas") or 0)
    impressions = int(c.get("impressions") or 0)

    score = 0.5
    if ctr >= 0.02: score += 0.2
    if cvr >= 0.04: score += 0.15
    if roas >= 1.5: score += 0.15
    if ctr < 0.005: score -= 0.2
    if roas > 0 and roas < 1: score -= 0.1
    score = max(0.0, min(1.0, round(score, 3)))

    fatigue = 0.2
    if impressions > 100_000 and ctr < 0.005: fatigue = 0.7
    if impressions > 500_000 and ctr < 0.003: fatigue = 0.9
    return {
        "score": score, "band": _band(score), "fatigue": round(fatigue, 3),
        "explanation": {"ctr": ctr, "cvr": cvr, "roas": roas, "impressions": impressions, "source": "ml"},
    }
