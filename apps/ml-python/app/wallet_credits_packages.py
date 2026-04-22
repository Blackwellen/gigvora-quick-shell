"""Domain 57 — Purchase risk scoring (deterministic heuristic).

POST /wallet-credits-packages/risk-score
  Inputs: amount_minor, wallet { cash, credit }, recent_count, recent_failures.
  Output: { source: "ml", riskScore: 0..1, action: "allow" | "manual_review" }.
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/wallet-credits-packages", tags=["wallet-credits-packages"])


class RiskIn(BaseModel):
    amount_minor: int
    wallet: Dict[str, Any] = Field(default_factory=dict)
    recent_count: int = 0
    recent_failures: int = 0


@router.post("/risk-score")
def risk_score(req: RiskIn):
    score = 0.05
    score += min(0.30, req.recent_failures * 0.10)
    if req.amount_minor > 100_00:
        score += 0.15
    if req.amount_minor > 500_00:
        score += 0.20
    if req.recent_count == 0 and req.amount_minor > 50_00:
        score += 0.10
    cash = int(req.wallet.get("cash") or 0)
    if cash < 0:
        score += 0.20
    score = max(0.0, min(1.0, score))
    return {
        "source": "ml",
        "riskScore": round(score, 4),
        "action": "manual_review" if score > 0.7 else "allow",
        "reasons": [
            *(["recent_failures"] if req.recent_failures > 0 else []),
            *(["large_amount"] if req.amount_minor > 100_00 else []),
            *(["first_time_large"] if req.recent_count == 0 and req.amount_minor > 50_00 else []),
        ],
    }
