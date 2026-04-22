"""Domain 19 — Booking ML.

Deterministic explainable endpoints. Bridged from NestJS `BookingService`.

  • POST /booking/slot-rank — rank candidate time slots for an invitee.
  • POST /booking/cancellation-risk — pre-meeting cancellation risk.
"""
from __future__ import annotations
from typing import Any, List
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ._obs import payload_guard, track

router = APIRouter(prefix="/booking", tags=["booking-ml"])
MODEL = "booking-rank-v1"
VERSION = "1.0.0"


class SlotIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    startAt: str            # ISO
    hourLocal: int = Field(ge=0, le=23, default=10)


class RankRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    inviteeTimezone: str = "Europe/London"
    preferMorning: bool = True
    slots: List[SlotIn] = Field(default_factory=list, max_length=200)


class CancellationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    appointmentId: str
    rescheduleCount: int = Field(ge=0, le=20, default=0)
    leadTimeHours: float = Field(ge=-24, le=720, default=24)
    inviteeHistoryCancelRate: float = Field(ge=0.0, le=1.0, default=0.1)


@router.post("/slot-rank")
@payload_guard()
@track(MODEL, VERSION)
def slot_rank(req: RankRequest) -> dict[str, Any]:
    ranked = []
    for s in req.slots:
        score = 50.0
        if req.preferMorning and 8 <= s.hourLocal <= 11: score += 25
        if 12 <= s.hourLocal <= 13: score -= 15      # lunch
        if s.hourLocal < 7 or s.hourLocal > 19: score -= 30
        if s.hourLocal in (9, 10, 14, 15): score += 5
        ranked.append({"id": s.id, "startAt": s.startAt, "score": max(0, min(100, round(score)))})
    ranked.sort(key=lambda x: -x["score"])
    return {"data": {"items": ranked}, "meta": {"model": MODEL, "version": VERSION}}


@router.post("/cancellation-risk")
@payload_guard()
@track(MODEL, VERSION)
def cancellation_risk(req: CancellationRequest) -> dict[str, Any]:
    risk = 0.10
    risk += min(0.30, req.rescheduleCount * 0.10)
    risk += min(0.40, req.inviteeHistoryCancelRate * 0.6)
    if req.leadTimeHours > 168: risk += 0.10
    if req.leadTimeHours < 2: risk += 0.15
    risk = max(0.0, min(1.0, risk))
    band = "low" if risk < 0.3 else "medium" if risk < 0.6 else "high"
    return {"data": {"appointmentId": req.appointmentId, "risk": round(risk, 2), "band": band},
            "meta": {"model": MODEL, "version": VERSION}}
