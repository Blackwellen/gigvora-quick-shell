"""IDVerify v2.x — deterministic identity-document verifier.

Backend-pluggable: when admin enables the IDVerify Connector (Onfido/Veriff/
Persona/Stripe Identity), the NestJS bridge POSTs the provider's parsed
result here and we return a normalized envelope. With no provider configured
we still return a deterministic structural-check score so the surface never
blanks.

Inputs:
  - doc_type: 'passport' | 'driving_licence' | 'national_id'
  - doc_country (ISO-2)
  - extracted: { full_name, dob, doc_number, expires_at }
  - selfie_match_score (0..1, optional)
  - liveness_score (0..1, optional)
  - provider_decision (optional, when a connector is wired)
"""
from __future__ import annotations
from time import perf_counter
from typing import Any, Dict, Optional
from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/idverify", tags=["idverify"])
MODEL = "IDVerify"
VERSION = "2.3.0"


class Extracted(BaseModel):
    full_name: str = ""
    dob: Optional[str] = None  # ISO YYYY-MM-DD
    doc_number: str = ""
    expires_at: Optional[str] = None


class IDVerifyIn(BaseModel):
    subject_id: str
    doc_type: str = "passport"
    doc_country: str = "GB"
    extracted: Extracted = Field(default_factory=Extracted)
    selfie_match_score: Optional[float] = None
    liveness_score: Optional[float] = None
    provider: Optional[str] = None  # 'onfido' | 'veriff' | 'persona' | 'stripe_identity'
    provider_decision: Optional[str] = None  # 'clear'|'consider'|'rejected'
    provider_score: Optional[float] = None


def _band(score: float) -> str:
    if score >= 0.85: return "verified"
    if score >= 0.6: return "review"
    return "rejected"


@router.post("/verify")
def verify(body: IDVerifyIn) -> Dict[str, Any]:
    t0 = perf_counter()
    reasons = []
    s = 0.5

    # Provider-led path (when connector is on)
    if body.provider_decision:
        decision_score = {"clear": 0.95, "consider": 0.55, "rejected": 0.05}.get(body.provider_decision, 0.5)
        s = max(s, decision_score)
        reasons.append(f"provider:{body.provider}:{body.provider_decision}")
        if body.provider_score is not None:
            s = (s + body.provider_score) / 2

    # Structural / deterministic checks (always run)
    if body.extracted.expires_at:
        try:
            exp = date.fromisoformat(body.extracted.expires_at)
            if exp < date.today():
                s -= 0.4; reasons.append("doc_expired")
            else:
                s += 0.05; reasons.append("doc_in_date")
        except ValueError:
            s -= 0.1; reasons.append("expires_at_unparseable")
    if not body.extracted.full_name or not body.extracted.doc_number:
        s -= 0.2; reasons.append("extraction_incomplete")
    if body.selfie_match_score is not None:
        s = (s * 0.6) + (body.selfie_match_score * 0.4)
        reasons.append(f"selfie_match:{round(body.selfie_match_score,2)}")
    if body.liveness_score is not None and body.liveness_score < 0.5:
        s -= 0.25; reasons.append("low_liveness")

    s = max(0.0, min(1.0, s))
    return {
        "data": {
            "subject_id": body.subject_id,
            "score": round(s, 4),
            "band": _band(s),
            "flag": "VERIFIED" if s >= 0.85 else ("REVIEW" if s >= 0.6 else "REJECTED"),
            "reasons": reasons,
            "provider": body.provider,
        },
        "meta": {"model": f"{MODEL}-deterministic" if not body.provider else f"{MODEL}-{body.provider}",
                 "version": VERSION,
                 "latency_ms": round((perf_counter() - t0) * 1000, 2)},
    }
