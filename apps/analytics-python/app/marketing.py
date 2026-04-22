"""Domain 02 — public marketing analytics.

Provides deterministic conversion-funnel summaries and CTA experiment commentary
that the NestJS marketing module can consume as optional enhancements. All
endpoints are pure functions over inputs (no DB access here) so they remain
easy to test and replace with real model-backed scoring later.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/marketing", tags=["marketing"])


class FunnelInput(BaseModel):
    impressions: int = Field(0, ge=0)
    clicks: int = Field(0, ge=0)
    leads: int = Field(0, ge=0)
    conversions: int = Field(0, ge=0)


class FunnelSummary(BaseModel):
    ctr: float
    lead_rate: float
    conversion_rate: float
    health: str  # 'healthy' | 'warning' | 'critical'
    insight: str


@router.post("/funnel/summary", response_model=FunnelSummary)
def funnel_summary(inp: FunnelInput) -> FunnelSummary:
    ctr = (inp.clicks / inp.impressions) if inp.impressions else 0.0
    lead_rate = (inp.leads / inp.clicks) if inp.clicks else 0.0
    conv = (inp.conversions / inp.leads) if inp.leads else 0.0
    if ctr >= 0.04 and conv >= 0.10:
        health, insight = "healthy", "Funnel is converting above target — consider scaling spend."
    elif ctr < 0.01:
        health, insight = "critical", "CTR below 1%. Test new CTA copy or hero imagery."
    elif lead_rate < 0.05:
        health, insight = "warning", "Click-to-lead drop is steep. Audit the lead capture form length."
    else:
        health, insight = "warning", "Funnel within tolerance but no clear winning variant yet."
    return FunnelSummary(
        ctr=round(ctr, 4), lead_rate=round(lead_rate, 4),
        conversion_rate=round(conv, 4), health=health, insight=insight,
    )


class VariantStat(BaseModel):
    label: str
    impressions: int = Field(0, ge=0)
    clicks: int = Field(0, ge=0)
    conversions: int = Field(0, ge=0)


class ExperimentInput(BaseModel):
    key: str
    variants: List[VariantStat]


class ExperimentVerdict(BaseModel):
    leader: Optional[str]
    confidence: str  # 'low' | 'medium' | 'high'
    note: str


@router.post("/experiments/verdict", response_model=ExperimentVerdict)
def experiment_verdict(inp: ExperimentInput) -> ExperimentVerdict:
    if not inp.variants:
        return ExperimentVerdict(leader=None, confidence="low", note="No variants supplied.")
    # Wilson-ish lower bound stub — deterministic, no external deps.
    scored = []
    for v in inp.variants:
        n = max(1, v.impressions)
        rate = v.conversions / n
        scored.append((v.label, rate, v.impressions))
    scored.sort(key=lambda x: x[1], reverse=True)
    leader, top_rate, top_n = scored[0]
    if len(scored) == 1:
        return ExperimentVerdict(leader=leader, confidence="low", note="Only one variant; declare manually.")
    _, second_rate, _ = scored[1]
    gap = top_rate - second_rate
    if top_n >= 1000 and gap >= 0.02:
        conf, note = "high", f"{leader} leads by {gap*100:.1f}pp with sufficient sample."
    elif top_n >= 200 and gap >= 0.01:
        conf, note = "medium", f"{leader} is ahead but keep collecting data."
    else:
        conf, note = "low", "Insufficient sample for a confident call."
    return ExperimentVerdict(leader=leader, confidence=conf, note=note)
