"""Domain 03 — login risk scoring (deterministic stub).

Pure-function endpoint that returns a risk band + reasons. Designed so the
NestJS RiskService can call it with a short timeout and fall back to its own
local scorer if this is offline.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/identity", tags=["identity"])


class RiskInput(BaseModel):
    email: str
    ip: Optional[str] = None
    userAgent: Optional[str] = None
    knownIdentity: bool = False
    recent_failed: int = Field(0, ge=0)
    recent_locked: int = Field(0, ge=0)
    recent_success: int = Field(0, ge=0)
    recent_blocked: int = Field(0, ge=0)


class RiskOutput(BaseModel):
    score: int
    band: str  # 'low' | 'medium' | 'high'
    reasons: List[str]
    mfaRequired: bool


@router.post("/risk/score", response_model=RiskOutput)
def score(inp: RiskInput) -> RiskOutput:
    s = 0
    reasons: List[str] = []
    if inp.recent_failed >= 3:
        s += 35
        reasons.append(f"{inp.recent_failed} failed attempts in last hour")
    if inp.recent_failed >= 5:
        s += 25
        reasons.append("repeated failures from this email/ip")
    if inp.recent_blocked >= 1:
        s += 25
        reasons.append("previous block within window")
    if not inp.knownIdentity:
        s += 10
        reasons.append("email not previously seen")
    if not inp.ip:
        s += 5
        reasons.append("missing ip")
    if not inp.userAgent:
        s += 5
        reasons.append("missing user agent")
    s = min(100, s)
    band = "high" if s >= 70 else "medium" if s >= 35 else "low"
    return RiskOutput(score=s, band=band, reasons=reasons, mfaRequired=band == "high")
