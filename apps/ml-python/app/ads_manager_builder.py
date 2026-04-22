"""Domain 60 — Ads Manager ML: deterministic quality + moderation."""
from __future__ import annotations
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ads-manager-builder", tags=["ads-manager-builder"])


class QualityIn(BaseModel):
    name: str = ""
    objective: str = ""
    budget_minor: int = 0
    routing_rules: Dict[str, Any] = Field(default_factory=dict)


@router.post("/quality-score")
def quality_score(req: QualityIn):
    """Deterministic ad campaign quality score 0..1.

    Rewards specific name, healthy budget, defined geos/audiences, and proven objective.
    """
    score = 0.4
    if len(req.name.strip()) >= 12:
        score += 0.1
    if req.objective in ("leads", "conversions", "app_installs"):
        score += 0.15
    elif req.objective in ("traffic", "engagement"):
        score += 0.05
    if req.budget_minor >= 100_00:  # ≥ £100
        score += 0.1
    if req.budget_minor >= 1000_00:  # ≥ £1000
        score += 0.05
    geos = req.routing_rules.get("geos") or []
    audiences = req.routing_rules.get("audiences") or []
    if geos:
        score += 0.1
    if audiences:
        score += 0.05
    if req.routing_rules.get("frequencyCap"):
        score += 0.05
    return {"score": round(min(1.0, score), 3),
            "explanation": {
                "objective_weight": req.objective,
                "budget_band": "high" if req.budget_minor >= 1000_00 else ("medium" if req.budget_minor >= 100_00 else "low"),
                "has_geos": bool(geos),
                "has_audiences": bool(audiences),
            }}


class ModerationIn(BaseModel):
    format: str = "image"
    headline: str = ""
    body: str = ""
    cta: str = ""


BANNED = ["guaranteed", "miracle", "click here now", "free money", "hate", "weapon",
          "weight loss secret", "make money fast", "100% safe"]
SUSPICIOUS = ["limited time", "act now", "instant", "best ever", "shocking"]


@router.post("/moderate-creative")
def moderate_creative(req: ModerationIn):
    text = " ".join([req.headline, req.body, req.cta]).lower()
    flags: List[str] = [w for w in BANNED if w in text]
    soft: List[str] = [w for w in SUSPICIOUS if w in text]
    score = 0.9
    if flags:
        score = 0.15
    elif len(soft) >= 2:
        score = 0.45
    elif soft:
        score = 0.65
    return {"score": round(score, 3), "flags": flags, "soft_flags": soft,
            "needs_human_review": score < 0.6}
