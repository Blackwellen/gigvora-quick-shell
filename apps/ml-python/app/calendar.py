"""Domain 17 — Calendar ML helpers.

Endpoints:
  POST /calendar/best-meeting-time    -> propose top 3 windows from free/busy
  POST /calendar/conflict-risk        -> probability a proposed slot will conflict

Deterministic explainable fallback so the API never blanks.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any

router = APIRouter(prefix="/calendar", tags=["calendar"])


class BusyInterval(BaseModel):
    starts_at: datetime
    ends_at: datetime


class BestTimeRequest(BaseModel):
    duration_minutes: int = Field(ge=10, le=480)
    earliest:  datetime
    latest:    datetime
    timezone:  str = "UTC"
    work_hour_start: int = 9
    work_hour_end:   int = 18
    busy: List[BusyInterval] = Field(default_factory=list)


class BestTimeResponse(BaseModel):
    suggestions: List[Dict[str, Any]]


@router.post("/best-meeting-time", response_model=BestTimeResponse)
def best_meeting_time(req: BestTimeRequest) -> BestTimeResponse:
    duration = timedelta(minutes=req.duration_minutes)
    cursor = req.earliest
    suggestions: List[Dict[str, Any]] = []
    busy = sorted(
        [(b.starts_at, b.ends_at) for b in req.busy], key=lambda x: x[0]
    )
    while cursor + duration <= req.latest and len(suggestions) < 3:
        # snap cursor to the next 15-minute boundary
        minute = (cursor.minute // 15 + (0 if cursor.minute % 15 == 0 else 1)) * 15
        if minute >= 60:
            cursor = cursor.replace(minute=0) + timedelta(hours=1)
        else:
            cursor = cursor.replace(minute=minute, second=0, microsecond=0)
        end = cursor + duration
        if end > req.latest:
            break
        # respect work hours (server local — caller sends already in tz-correct UTC)
        if not (req.work_hour_start <= cursor.hour < req.work_hour_end):
            cursor = cursor.replace(hour=req.work_hour_start, minute=0, second=0, microsecond=0)
            if cursor.hour >= req.work_hour_end:
                cursor += timedelta(days=1)
                cursor = cursor.replace(hour=req.work_hour_start, minute=0)
            continue
        clash = next(((bs, be) for bs, be in busy if bs < end and be > cursor), None)
        if clash is None:
            score = 0.9 if 10 <= cursor.hour <= 15 else 0.7
            suggestions.append({
                "starts_at": cursor.isoformat(),
                "ends_at":   end.isoformat(),
                "score":     score,
                "reason":    "Inside core hours" if score >= 0.9 else "Inside work hours",
            })
            cursor = end
        else:
            cursor = clash[1]
    return BestTimeResponse(suggestions=suggestions)


class ConflictRiskRequest(BaseModel):
    starts_at: datetime
    ends_at:   datetime
    busy: List[BusyInterval] = Field(default_factory=list)
    historical_decline_rate: float = 0.1


class ConflictRiskResponse(BaseModel):
    risk: float
    band: str
    reason: str


@router.post("/conflict-risk", response_model=ConflictRiskResponse)
def conflict_risk(req: ConflictRiskRequest) -> ConflictRiskResponse:
    overlap = any(b.starts_at < req.ends_at and b.ends_at > req.starts_at for b in req.busy)
    base = 0.95 if overlap else max(0.0, min(1.0, req.historical_decline_rate))
    band = "high" if base >= 0.6 else ("medium" if base >= 0.3 else "low")
    reason = "Direct overlap with existing busy block" if overlap else "Based on historical decline rate"
    return ConflictRiskResponse(risk=round(base, 4), band=band, reason=reason)
