"""Domain 73 — Verification & Compliance scoring (deterministic, explainable)."""
from __future__ import annotations
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/verification-compliance", tags=["verification-compliance"])

HIGH_RISK_JUR = {"IR", "KP", "SY", "CU", "RU", "BY", "MM", "VE"}


class CaseIn(BaseModel):
    subjectId: str | None = None
    subjectKind: str = "user"
    program: str = "kyc"
    jurisdiction: str = "GB"
    reasons: List[str] = Field(default_factory=list)
    meta: Dict[str, Any] = Field(default_factory=dict)


class CheckIn(BaseModel):
    caseId: str | None = None
    provider: str = "manual"
    checkType: str = "document"


class DeskRiskIn(BaseModel):
    kpis: Dict[str, Any] = Field(default_factory=dict)


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _band(score: int) -> str:
    if score >= 80: return "critical"
    if score >= 60: return "high"
    if score >= 35: return "elevated"
    return "normal"


@router.post("/score-case")
def score_case(body: CaseIn) -> Dict[str, Any]:
    flags: List[Dict[str, Any]] = []
    reasons: List[str] = []
    score = 10
    if body.program in {"aml", "sanctions", "pep"}:
        score += 40
        flags.append({"code": body.program, "severity": "critical", "source": "program"})
        reasons.append(f"program:{body.program}")
    if body.program == "kyb" and body.subjectKind == "enterprise":
        score += 15
        reasons.append("program:kyb")
    if body.program == "right_to_work":
        score += 10
        reasons.append("program:right_to_work")
    jur = (body.jurisdiction or "GB").upper()
    if jur in HIGH_RISK_JUR:
        score += 35
        flags.append({"code": "high_risk_jurisdiction", "severity": "critical", "source": "rules"})
        reasons.append(f"jurisdiction:{jur}")
    score = min(100, score)
    return {"score": score, "band": _band(score), "flags": flags,
            "reasons": reasons, "model": "verification-compliance-v1"}


@router.post("/score-check")
def score_check(body: CheckIn) -> Dict[str, Any]:
    t = body.checkType
    if t in {"sanctions", "pep"}:
        return {"result": "consider", "score": 0.5,
                "payload": {"note": "deterministic stub — requires human review"}}
    if t == "document":
        return {"result": "clear", "score": 0.85,
                "payload": {"note": "deterministic clear"}}
    return {"result": "consider", "score": 0.6, "payload": {"note": "deterministic"}}


@router.post("/desk-risk")
def desk_risk(body: DeskRiskIn) -> Dict[str, Any]:
    k = body.kpis or {}
    breached = int(k.get("slaBreached") or 0)
    by_band = k.get("casesByBand") or {}
    critical = int(by_band.get("critical") or 0)
    high     = int(by_band.get("high") or 0)
    score = min(100, breached * 8 + critical * 15 + high * 5)
    return {"score": score, "band": _band(score), "model": "vc-desk-risk-v1",
            "factors": {"sla_breached": breached, "critical": critical, "high": high}}
