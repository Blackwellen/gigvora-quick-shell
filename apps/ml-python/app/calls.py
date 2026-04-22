"""Domain 18 — Calls/Video/Presence ML.

Deterministic explainable endpoints (no GPU). Bridged from NestJS
`CallsService` with a deterministic local fallback.

  • POST /calls/score-quality — connection-quality score from session metrics.
  • POST /calls/no-show-risk  — pre-call no-show risk for an upcoming meeting.
"""
from __future__ import annotations
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ._obs import payload_guard, track

router = APIRouter(prefix="/calls", tags=["calls-ml"])
MODEL = "calls-quality-v1"
VERSION = "1.0.0"


class QualitySample(BaseModel):
    model_config = ConfigDict(extra="forbid")
    callId: str = Field(min_length=1, max_length=120)
    bitrateKbps: float = Field(ge=0, le=20000, default=0)
    packetLossPct: float = Field(ge=0, le=100, default=0)
    jitterMs: float = Field(ge=0, le=2000, default=0)
    rttMs: float = Field(ge=0, le=5000, default=0)
    durationSec: int = Field(ge=0, le=86_400, default=0)


class NoShowRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    appointmentId: str = Field(min_length=1, max_length=120)
    minutesUntil: int = Field(ge=-60, le=10_080, default=60)
    rescheduleCount: int = Field(ge=0, le=20, default=0)
    inviteeConfirmed: bool = False
    pastNoShows: int = Field(ge=0, le=50, default=0)


@router.post("/score-quality")
@payload_guard()
@track(MODEL, VERSION)
def score_quality(req: QualitySample) -> dict[str, Any]:
    score = 100.0
    score -= min(40, req.packetLossPct * 4)
    score -= min(20, req.jitterMs / 10)
    score -= min(20, req.rttMs / 25)
    if req.bitrateKbps and req.bitrateKbps < 200:
        score -= 10
    score = max(0.0, min(100.0, score))
    band = "excellent" if score >= 85 else "good" if score >= 70 else "fair" if score >= 50 else "poor"
    reasons = []
    if req.packetLossPct > 2: reasons.append(f"packet loss {req.packetLossPct:.1f}%")
    if req.jitterMs > 60: reasons.append(f"jitter {req.jitterMs:.0f}ms")
    if req.rttMs > 250: reasons.append(f"latency {req.rttMs:.0f}ms")
    if not reasons: reasons.append("nominal session metrics")
    return {"data": {"callId": req.callId, "score": round(score), "band": band, "reasons": reasons},
            "meta": {"model": MODEL, "version": VERSION}}


@router.post("/no-show-risk")
@payload_guard()
@track(MODEL, VERSION)
def no_show_risk(req: NoShowRequest) -> dict[str, Any]:
    risk = 0.15
    if not req.inviteeConfirmed: risk += 0.25
    risk += min(0.35, req.pastNoShows * 0.12)
    risk += min(0.15, req.rescheduleCount * 0.05)
    if req.minutesUntil < 0: risk = 0.95
    elif req.minutesUntil < 30: risk += 0.10
    risk = max(0.0, min(1.0, risk))
    band = "low" if risk < 0.3 else "medium" if risk < 0.6 else "high"
    return {"data": {"appointmentId": req.appointmentId, "risk": round(risk, 2), "band": band},
            "meta": {"model": MODEL, "version": VERSION}}
