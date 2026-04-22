"""D35 — Proposal Review, Compare, Shortlist & Award analytics router.

Operational summaries used by the workbench KPI band and operator queue:
  * Cohort funnel (#submitted / shortlisted / awarded / rejected / declined)
  * Median bid in cohort
  * Decision velocity (hours)
  * Anomaly commentary (narrow shortlist, slow decisions, etc.)
  * Approval-chain throughput
  * Compare-axis weighting drift over time
"""
from __future__ import annotations
import statistics
from datetime import datetime
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field
from ._obs import payload_guard, track

router = APIRouter(prefix="/proposal-review-award", tags=["proposal-review-award"])

ReviewStatus = Literal["submitted", "shortlisted", "revised", "accepted", "rejected", "awarded", "declined"]
AwardStatus = Literal["draft", "awaiting-approval", "approved", "escrow-handoff", "closed", "rejected", "cancelled"]


class ReviewRow(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    status: ReviewStatus
    bidAmountCents: int = Field(ge=0)
    timelineWeeks: int = Field(ge=0, le=520)
    scoreFit: int = Field(ge=0, le=100)
    scoreRisk: int = Field(ge=0, le=100)
    createdAt: str
    updatedAt: str


class CohortInsightsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenantId: str = Field(min_length=1, max_length=120)
    projectId: str | None = Field(default=None, max_length=120)
    rows: list[ReviewRow] = Field(default_factory=list, max_length=500)


class AwardThroughputRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenantId: str = Field(min_length=1, max_length=120)
    decisions: list[dict] = Field(default_factory=list, max_length=500)


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "domain": "proposal-review-award"}


def _hours_between(a: str, b: str) -> float:
    try:
        return max(0.0, (datetime.fromisoformat(b.replace("Z", "+00:00")) - datetime.fromisoformat(a.replace("Z", "+00:00"))).total_seconds() / 3600)
    except Exception:
        return 0.0


@router.post("/insights/cohort")
def cohort_insights(req: CohortInsightsRequest) -> dict:
    """Compute the workbench KPI band + anomaly note."""
    with track("praa.cohort"):
        payload_guard(items=req.rows)
        rows = req.rows
        n = len(rows)
        funnel = {
            "submitted":   sum(1 for r in rows if r.status == "submitted"),
            "shortlisted": sum(1 for r in rows if r.status == "shortlisted"),
            "rejected":    sum(1 for r in rows if r.status == "rejected"),
            "awarded":     sum(1 for r in rows if r.status == "awarded"),
            "declined":    sum(1 for r in rows if r.status == "declined"),
        }
        bids = sorted(r.bidAmountCents for r in rows)
        median_bid = bids[len(bids) // 2] if bids else 0

        decided = [r for r in rows if r.status != "submitted"]
        velocity_h = round(statistics.mean(_hours_between(r.createdAt, r.updatedAt) for r in decided), 1) if decided else 0.0

        anomaly: str | None = None
        if n >= 4 and funnel["shortlisted"] == 0:
            anomaly = "No shortlist yet — review at least the top three to keep the project moving."
        elif n and funnel["shortlisted"] / n > 0.6:
            anomaly = "Shortlist is wider than 60% of the cohort — narrow it before awarding."
        elif funnel["awarded"] == 0 and funnel["shortlisted"] >= 1 and velocity_h > 72:
            anomaly = f"Decisions taking {velocity_h:.0f}h on average — auto-reject expired proposals."

        avg_fit = round(statistics.mean(r.scoreFit for r in rows), 1) if rows else 0.0
        avg_risk = round(statistics.mean(r.scoreRisk for r in rows), 1) if rows else 0.0

        return {
            "tenantId": req.tenantId,
            "projectId": req.projectId,
            "total": n,
            "funnel": funnel,
            "medianBidCents": median_bid,
            "decisionVelocityHours": velocity_h,
            "averageFit": avg_fit,
            "averageRisk": avg_risk,
            "anomalyNote": anomaly,
            "mode": "analytics",
            "generatedAt": datetime.utcnow().isoformat() + "Z",
        }


@router.post("/insights/throughput")
def award_throughput(req: AwardThroughputRequest) -> dict:
    """Operator dashboard: how many awards moved through each award status today."""
    with track("praa.throughput"):
        payload_guard(items=req.decisions)
        buckets: dict[str, int] = {}
        for d in req.decisions:
            buckets[d.get("status", "unknown")] = buckets.get(d.get("status", "unknown"), 0) + 1
        return {
            "tenantId": req.tenantId,
            "buckets": buckets,
            "total": len(req.decisions),
            "generatedAt": datetime.utcnow().isoformat() + "Z",
        }
