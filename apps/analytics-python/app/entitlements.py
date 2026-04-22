"""Domain 04 — entitlement & upgrade insight cards (deterministic).

Given a list of access denials grouped by feature, surface upgrade hints,
prioritisation, and friction commentary. No predictive ML — this is pure
operational analytics with a stable contract so the frontend can render
"You hit Recruiter Pro 12 times this month — upgrade to Pro" cards.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/entitlements", tags=["entitlements"])

FEATURE_TO_PLAN = {
    "creation-studio-pro": "starter",
    "document-studio": "starter",
    "recruiter-pro": "pro",
    "ads-manager": "pro",
    "advanced-analytics": "pro",
    "priority-support": "pro",
    "sales-navigator": "business",
    "custom-branding": "business",
    "api-access": "business",
    "team-management": "business",
    "bulk-messaging": "business",
    "enterprise-connect": "enterprise",
    "sso": "enterprise",
}


class DenialRow(BaseModel):
    feature: str
    c: int = Field(ge=0)


class InsightInput(BaseModel):
    denials: List[DenialRow] = []
    currentPlan: Optional[str] = None


class InsightCard(BaseModel):
    feature: str
    hits: int
    suggestedPlan: str
    priority: str   # 'high' | 'medium' | 'low'
    headline: str
    cta: str


class InsightOutput(BaseModel):
    cards: List[InsightCard]
    summary: str


@router.post("/insights", response_model=InsightOutput)
def insights(inp: InsightInput) -> InsightOutput:
    cards: List[InsightCard] = []
    total = 0
    for d in inp.denials:
        total += d.c
        plan = FEATURE_TO_PLAN.get(d.feature, "pro")
        if inp.currentPlan and plan == inp.currentPlan:
            continue  # already entitled
        priority = "high" if d.c >= 10 else "medium" if d.c >= 3 else "low"
        cards.append(InsightCard(
            feature=d.feature, hits=d.c, suggestedPlan=plan, priority=priority,
            headline=f"You hit {d.feature} {d.c}× recently",
            cta=f"Upgrade to {plan.title()} to unlock",
        ))
    cards.sort(key=lambda c: (-c.hits, c.feature))
    summary = (f"{total} blocked attempts across {len(cards)} feature(s)"
               if cards else "No upgrade friction in the last 30 days.")
    return InsightOutput(cards=cards, summary=summary)
