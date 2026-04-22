"""Domain 58 — Invoice risk scoring (deterministic heuristic).

POST /billing-invoices-tax/risk-score
  Inputs: total_minor, days_outstanding, customer_history { invoices }.
  Output: { source: "ml", riskScore: 0..1, action: "allow" | "manual_review" }.
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/billing-invoices-tax", tags=["billing-invoices-tax"])


class RiskIn(BaseModel):
    total_minor: int
    days_outstanding: int = 0
    customer_history: Dict[str, Any] = Field(default_factory=dict)


@router.post("/risk-score")
def risk_score(req: RiskIn):
    score = 0.05
    score += min(0.40, max(0, req.days_outstanding) * 0.02)
    if req.total_minor > 100_000:  # > £1,000
        score += 0.15
    if req.total_minor > 1_000_000:  # > £10,000
        score += 0.20
    invoices = int(req.customer_history.get("invoices") or 1)
    if invoices < 2:
        score += 0.10
    score = max(0.0, min(1.0, score))
    return {
        "source": "ml",
        "riskScore": round(score, 4),
        "action": "manual_review" if score > 0.6 else "allow",
        "reasons": [
            *(["overdue"] if req.days_outstanding > 0 else []),
            *(["large_amount"] if req.total_minor > 100_000 else []),
            *(["new_customer"] if invoices < 2 else []),
        ],
    }
