"""Domain 67 — Customer Service ML helpers (deterministic explainable)."""
from __future__ import annotations
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/customer-service", tags=["customer-service"])

URGENCY = re.compile(r"\b(urgent|asap|now|critical|down|broken|blocked|locked|outage)\b", re.I)
FINANCE = re.compile(r"\b(refund|charge|money|withdraw|payment|invoice|payout|chargeback)\b", re.I)
SAFETY  = re.compile(r"\b(security|hack|breach|leak|abuse|fraud|harassment)\b", re.I)


class PriorityIn(BaseModel):
    subject: str = Field("", max_length=400)
    body: str = Field("", max_length=8000)


def _score(text: str) -> Dict[str, Any]:
    score = 30
    reasons: List[str] = []
    if URGENCY.search(text): score += 40; reasons.append("urgency_keywords")
    if FINANCE.search(text): score += 25; reasons.append("financial_topic")
    if SAFETY.search(text):  score += 30; reasons.append("safety_topic")
    score = min(100, score)
    if score >= 80: priority = "urgent"
    elif score >= 55: priority = "high"
    elif score >= 30: priority = "normal"
    else: priority = "low"
    return {"priority": priority, "score": score, "reasons": reasons, "model": "deterministic-v1"}


@router.post("/suggest-priority")
def suggest_priority(body: PriorityIn):
    return _score(f"{body.subject} {body.body}")
