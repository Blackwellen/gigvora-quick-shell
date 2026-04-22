"""Domain 68 — Finance Admin risk scoring (deterministic, explainable)."""
from __future__ import annotations
from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/finance-admin", tags=["finance-admin"])


class ScoreIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


@router.post("/score")
def score(body: ScoreIn):
    s = body.signals or {}
    refunds = s.get("refunds") or {}
    holds = s.get("holds") or {}
    pending = int((refunds.get("pending") or {}).get("count") or 0)
    processing = int((refunds.get("processing") or {}).get("count") or 0)
    failed = int((refunds.get("failed") or {}).get("count") or 0)
    active_holds = int((holds.get("active") or {}).get("count") or 0)

    score_v = 10 + min(40, (pending + processing) * 4) + min(30, failed * 6) + min(20, active_holds * 3)
    score_v = min(100, score_v)
    if score_v >= 80: band = "critical"
    elif score_v >= 60: band = "high"
    elif score_v >= 35: band = "elevated"
    else: band = "normal"
    return {
        "score": score_v, "band": band, "model": "deterministic-v1",
        "factors": {"pendingRefunds": pending + processing, "failedRefunds": failed, "activeHolds": active_holds},
    }
