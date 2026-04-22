"""ML for Domain 26 — Recruiter Job Management.

POST /recruiter-jobs/priority   — priority score
POST /recruiter-jobs/forecast   — days-to-fill + risk flags
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class PriorityBody(BaseModel):
    seniority: str = "mid"
    headcount: int = 1
    targetStartDate: str | None = None
    budget: int | None = None
    mustHaves: list[str] = []


@router.post("/recruiter-jobs/priority")
def priority(body: PriorityBody):
    s = 40
    if body.seniority in ("senior", "lead"): s += 12
    if body.seniority in ("principal", "executive"): s += 20
    if body.headcount > 1: s += min(15, body.headcount * 4)
    if body.targetStartDate:
        from datetime import datetime, timezone
        try:
            dt = datetime.fromisoformat(body.targetStartDate.replace("Z", "+00:00"))
            days = max(0, (dt - datetime.now(timezone.utc)).days)
            if days < 30: s += 12
            elif days < 60: s += 6
        except Exception:
            pass
    if (body.budget or 0) > 120_000: s += 5
    return {"priorityScore": min(100, s)}


class ForecastBody(BaseModel):
    seniority: str = "mid"
    location: str = ""
    mustHaves: list[str] = []
    budget: int | None = None


@router.post("/recruiter-jobs/forecast")
def forecast(body: ForecastBody):
    days = 25
    if body.seniority in ("senior", "lead"): days += 14
    if body.seniority in ("principal", "executive"): days += 30
    if "remote" in body.location.lower(): days -= 4
    flags: list[str] = []
    if len(body.mustHaves) > 6: flags.append("must_haves_too_strict")
    if (body.budget or 0) < 50_000 and body.seniority in ("senior", "lead"):
        flags.append("budget_below_market")
    return {"forecastDaysToFill": max(7, days), "riskFlags": flags}
