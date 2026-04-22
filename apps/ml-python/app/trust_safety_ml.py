"""Domain 71 — Trust & Safety / ML / Fraud scorers (deterministic, explainable)."""
from __future__ import annotations
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/trust-safety-ml", tags=["trust-safety-ml"])


def _band(score: int) -> str:
    if score >= 80: return "critical"
    if score >= 60: return "high"
    if score >= 35: return "elevated"
    return "normal"


class SignalIn(BaseModel):
    source: str = "manual"
    subjectKind: str = "user"
    subjectId: str | None = None
    signalCode: str = "other"
    severity: str = "normal"
    features: Dict[str, Any] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)


CODE_BOOST = {
    "impossible_travel": 25, "known_fraud_finger": 30, "velocity_spike": 15,
    "kyc_mismatch": 18, "phishing_pattern": 18, "disposable_email": 8,
}


@router.post("/signal-score")
def signal_score(body: SignalIn):
    sev_map = {"low": 20, "normal": 40, "high": 70, "critical": 90}
    s = min(100, sev_map.get(body.severity, 40) + CODE_BOOST.get(body.signalCode, 0))
    return {"score": s, "band": _band(s),
            "reasons": [f"code:{body.signalCode}", f"severity:{body.severity}"]}


class CaseIn(BaseModel):
    caseKind: str = "fraud"
    subjectKind: str = "user"
    subjectId: str | None = None
    severity: str = "normal"
    features: Dict[str, Any] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)
    signals: List[Dict[str, Any]] = Field(default_factory=list)


KIND_BASE = {
    "fraud": 60, "payment_risk": 55, "identity": 50,
    "abuse": 45, "content": 35, "compliance": 40, "other": 30,
}


@router.post("/case-score")
def case_score(body: CaseIn):
    sig_max = max((int(s.get("ml_score") or 0) for s in body.signals), default=0)
    sig_count = len(body.signals)
    s = (KIND_BASE.get(body.caseKind, 35)
         + min(20, sig_max // 5) + min(15, sig_count * 3))
    s = min(100, int(s))
    return {
        "score": s, "band": _band(s), "model": "fraud-risk-v1",
        "reasons": [f"kind:{body.caseKind}", f"signals:{sig_count}", f"max_signal_score:{sig_max}"],
    }


class DeskIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


@router.post("/desk-risk")
def desk_risk(body: DeskIn):
    s = body.signals or {}
    by_status = s.get("casesByStatus") or {}
    by_band = s.get("signalsByBand") or {}
    open_count = sum(int(by_status.get(k, 0)) for k in ("open", "reviewing", "holding"))
    escalated = int(by_status.get("escalated") or 0)
    breached = int(s.get("slaBreached") or 0)
    crit_sig = int(by_band.get("critical") or 0)
    high_sig = int(by_band.get("high") or 0)
    score_v = (10 + min(35, open_count * 2) + min(25, escalated * 8)
               + min(15, breached * 5) + min(10, crit_sig * 4) + min(5, high_sig))
    score_v = min(100, score_v)
    return {
        "score": score_v, "band": _band(score_v), "model": "desk-risk-v1",
        "factors": {
            "open": open_count, "escalated": escalated, "slaBreached": breached,
            "criticalSignals": crit_sig, "highSignals": high_sig,
        },
    }
