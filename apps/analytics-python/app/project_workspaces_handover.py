"""D37 analytics router — Project Workspaces & Handover.

Pure in-process aggregation. Mirrors the D36 pattern: deterministic seed,
no external store, friendly Pydantic surface for the dashboard layer.
"""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/v1/project-workspaces-handover", tags=["project-workspaces-handover"])


class WorkspaceInsights(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kickoff: int = 0
    active: int = 0
    in_review: int = Field(0, alias="inReview")
    handover: int = 0
    closed: int = 0
    on_hold: int = Field(0, alias="onHold")
    cancelled: int = 0
    total: int = 0
    milestone_acceptance_rate_pct: float = Field(0.0, alias="milestoneAcceptanceRatePct")
    deliverable_acceptance_rate_pct: float = Field(0.0, alias="deliverableAcceptanceRatePct")
    handover_readiness_pct: float = Field(0.0, alias="handoverReadinessPct")
    avg_cycle_days: float = Field(0.0, alias="avgCycleDays")
    mode: str = "fallback"


_SEED = [
    {"status": "active",    "milestones_total": 4, "milestones_accepted": 1, "checklist_total": 6, "checklist_done": 0, "cycle_days": None},
    {"status": "in-review", "milestones_total": 3, "milestones_accepted": 3, "checklist_total": 6, "checklist_done": 2, "cycle_days": None},
    {"status": "handover",  "milestones_total": 5, "milestones_accepted": 5, "checklist_total": 6, "checklist_done": 4, "cycle_days": None},
    {"status": "closed",    "milestones_total": 4, "milestones_accepted": 4, "checklist_total": 6, "checklist_done": 6, "cycle_days": 18.5},
]


@router.get("/insights", response_model=WorkspaceInsights, response_model_by_alias=True)
async def insights(project_id: str | None = None):
    rows = _SEED
    bucket = {"kickoff": 0, "active": 0, "in-review": 0, "handover": 0, "closed": 0, "on-hold": 0, "cancelled": 0}
    for r in rows:
        s = r.get("status", "kickoff")
        if s in bucket:
            bucket[s] += 1
    ms_total = sum(r["milestones_total"] for r in rows)
    ms_acc = sum(r["milestones_accepted"] for r in rows)
    ck_total = sum(r["checklist_total"] for r in rows)
    ck_done = sum(r["checklist_done"] for r in rows)
    cycle = [r["cycle_days"] for r in rows if r["cycle_days"] is not None]
    return WorkspaceInsights(
        kickoff=bucket["kickoff"],
        active=bucket["active"],
        inReview=bucket["in-review"],
        handover=bucket["handover"],
        closed=bucket["closed"],
        onHold=bucket["on-hold"],
        cancelled=bucket["cancelled"],
        total=len(rows),
        milestoneAcceptanceRatePct=round((ms_acc / ms_total) * 100, 1) if ms_total else 0.0,
        deliverableAcceptanceRatePct=0.0,
        handoverReadinessPct=round((ck_done / ck_total) * 100, 1) if ck_total else 0.0,
        avgCycleDays=round(sum(cycle) / len(cycle), 2) if cycle else 0.0,
        mode="seeded",
    )
