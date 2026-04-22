"""Domain 16 — Trust ML.

Two endpoints:
  • POST /trust/moderate — score a single review for toxicity/spam/auth.
  • POST /trust/badges/eligibility — return which badges a subject qualifies for.

Deterministic, explainable, runnable with no GPU. The NestJS bridge wraps
both in a fallback so the trust journey never blanks if ML is offline.
"""
from __future__ import annotations

import re
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ._obs import payload_guard, track

router = APIRouter(prefix="/trust", tags=["trust-ml"])
MODEL = "trust-moderation-v1"
VERSION = "1.0.0"

_TOXIC = {"scam", "fraud", "thief", "liar", "garbage", "trash", "useless", "worst", "incompetent"}
_PROMO = {"buy now", "click here", "limited offer", "dm me", "telegram", "whatsapp +", "promo code"}
_URL = re.compile(r"https?://\S+")
_WORD = re.compile(r"[A-Za-z]+")


class ModerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=120)
    body: str = Field(default="", max_length=8000)
    rating: int = Field(ge=1, le=5, default=3)
    author_trust: float = Field(ge=0.0, le=1.0, default=0.5)


class ModerateResponse(BaseModel):
    data: dict[str, Any]
    meta: dict[str, Any]


@router.post("/moderate", response_model=ModerateResponse)
def moderate(req: ModerateRequest):
    with track("trust.moderate"):
        text = req.body or ""
        lower = text.lower()
        toks = _WORD.findall(text) or [""]
        caps = sum(1 for w in toks if len(w) > 2 and w.isupper())
        caps_ratio = caps / max(1, len(toks))
        urls = len(_URL.findall(text))
        url_density = urls / max(1, len(toks))
        toxic_hits = sum(1 for w in _TOXIC if w in lower)
        promo_hits = sum(1 for p in _PROMO if p in lower)
        repeat = 1.0 if re.search(r"(.)\1{4,}", lower) else 0.0
        trust_penalty = 1.0 - max(0.0, min(1.0, req.author_trust))
        low_star_rant = 1.0 if (req.rating <= 1 and len(text) < 80) else 0.0
        raw = (
            0.30 * min(1.0, toxic_hits / 2.0)
            + 0.25 * min(1.0, promo_hits / 2.0)
            + 0.10 * caps_ratio
            + 0.10 * min(1.0, url_density * 4)
            + 0.05 * repeat
            + 0.10 * trust_penalty
            + 0.10 * low_star_rant
        )
        score = round(min(1.0, raw), 3)
        reasons: list[str] = []
        if toxic_hits:    reasons.append(f"toxic_terms:{toxic_hits}")
        if promo_hits:    reasons.append(f"promo_terms:{promo_hits}")
        if caps_ratio > 0.4: reasons.append("excessive_caps")
        if url_density > 0.2: reasons.append("link_density")
        if repeat:         reasons.append("char_repetition")
        if low_star_rant:  reasons.append("low_star_short_rant")
        if not reasons:    reasons.append("clean")

        if score >= 0.65:    action = "reject"
        elif score >= 0.30:  action = "hold"
        else:                action = "approve"

        confidence = round(0.5 + abs(score - 0.5), 3)
        return {
            "data": {"action": action, "score": score, "reasons": reasons, "confidence": confidence},
            "meta": {"source": MODEL, "version": VERSION, "latency_ms": 0},
        }


class EligibilityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    subject_kind: str = Field(min_length=1, max_length=40)
    subject_id: str = Field(min_length=1, max_length=120)
    review_count: int = Field(ge=0, default=0)
    avg_rating: float = Field(ge=0.0, le=5.0, default=0.0)
    response_rate: float = Field(ge=0.0, le=1.0, default=0.0)
    avg_response_hours: float = Field(ge=0.0, default=24.0)
    completed_orders: int = Field(ge=0, default=0)
    helpful_votes: int = Field(ge=0, default=0)
    verifications: int = Field(ge=0, default=0)
    tenure_days: int = Field(ge=0, default=0)


@router.post("/badges/eligibility")
def eligibility(req: EligibilityRequest):
    with track("trust.badges.eligibility"):
        eligible: list[dict[str, Any]] = []
        if req.avg_rating >= 4.5 and req.review_count >= 10:
            eligible.append({"badge": "top_rated", "reason": f"{req.avg_rating:.1f}★ across {req.review_count} reviews"})
        if req.verifications >= 3:
            eligible.append({"badge": "verified_pro", "reason": f"{req.verifications} verifications complete"})
        if req.avg_response_hours <= 2.0 and req.response_rate >= 0.9:
            eligible.append({"badge": "fast_responder", "reason": f"avg {req.avg_response_hours:.1f}h response, {int(req.response_rate*100)}% response rate"})
        if req.completed_orders >= 25:
            eligible.append({"badge": "trusted_seller", "reason": f"{req.completed_orders} completed orders"})
        if req.helpful_votes >= 50:
            eligible.append({"badge": "community_leader", "reason": f"{req.helpful_votes} helpful votes"})
        if req.tenure_days >= 365 and req.review_count >= 5:
            eligible.append({"badge": "long_tenured", "reason": f"{req.tenure_days // 365}y on platform"})
        return {"data": {"eligible": eligible, "count": len(eligible)}, "meta": {"source": MODEL, "version": VERSION}}
