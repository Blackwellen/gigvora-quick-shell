"""FraudNet v4.x — deterministic payment-fraud scorer.

Enterprise-grade per the ML rule:
  • Deterministic primary path — signal-weighted scoring with explainable
    component breakdown. No GPU, no model weights, runnable on a 16 GB VPS.
  • Locked envelope `{ data, meta: { model, version, latency_ms } }`.
  • Graceful: callers can degrade to NestJS in-process mirror if this is down.

Inputs are payment / account features that the NestJS bridge already computes:
  - chargebacks_30d, refunds_30d, payout_velocity_24h
  - shared_device_fingerprint_count, shared_ip_count
  - account_age_days, prior_strikes
  - geo_risk (0..1), kyc_state ('verified'|'pending'|'failed')
"""
from __future__ import annotations
from time import perf_counter
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/fraudnet", tags=["fraudnet"])
MODEL = "FraudNet"
VERSION = "4.1.0"


class FraudFeatures(BaseModel):
    subject_id: str
    chargebacks_30d: int = 0
    refunds_30d: int = 0
    payout_velocity_24h: float = 0.0  # USD
    shared_device_fingerprint_count: int = 0
    shared_ip_count: int = 0
    account_age_days: int = 365
    prior_strikes: int = 0
    geo_risk: float = 0.0  # 0..1
    kyc_state: str = "verified"


def _band(score: float) -> str:
    if score >= 0.85: return "critical"
    if score >= 0.65: return "high"
    if score >= 0.40: return "medium"
    return "low"


@router.post("/score")
def score(body: FraudFeatures) -> Dict[str, Any]:
    t0 = perf_counter()
    components: List[Dict[str, Any]] = []
    s = 0.0

    cb = min(1.0, body.chargebacks_30d / 5.0); s += 0.25 * cb
    components.append({"k": "chargebacks_30d", "raw": body.chargebacks_30d, "weighted": round(0.25 * cb, 3)})

    pv = min(1.0, body.payout_velocity_24h / 25_000.0); s += 0.20 * pv
    components.append({"k": "payout_velocity_24h", "raw": body.payout_velocity_24h, "weighted": round(0.20 * pv, 3)})

    dev = min(1.0, body.shared_device_fingerprint_count / 4.0); s += 0.18 * dev
    components.append({"k": "shared_device_fingerprint_count", "raw": body.shared_device_fingerprint_count, "weighted": round(0.18 * dev, 3)})

    ip = min(1.0, body.shared_ip_count / 6.0); s += 0.10 * ip
    components.append({"k": "shared_ip_count", "raw": body.shared_ip_count, "weighted": round(0.10 * ip, 3)})

    age_factor = 1.0 if body.account_age_days < 30 else (0.5 if body.account_age_days < 180 else 0.0)
    s += 0.10 * age_factor
    components.append({"k": "account_age_days", "raw": body.account_age_days, "weighted": round(0.10 * age_factor, 3)})

    strikes = min(1.0, body.prior_strikes / 3.0); s += 0.07 * strikes
    components.append({"k": "prior_strikes", "raw": body.prior_strikes, "weighted": round(0.07 * strikes, 3)})

    s += 0.05 * max(0.0, min(1.0, body.geo_risk))
    components.append({"k": "geo_risk", "raw": body.geo_risk, "weighted": round(0.05 * body.geo_risk, 3)})

    kyc_pen = {"verified": 0.0, "pending": 0.5, "failed": 1.0}.get(body.kyc_state, 0.5)
    s += 0.05 * kyc_pen
    components.append({"k": "kyc_state", "raw": body.kyc_state, "weighted": round(0.05 * kyc_pen, 3)})

    score_v = round(min(1.0, s), 4)
    return {
        "data": {
            "subject_id": body.subject_id,
            "score": score_v,
            "band": _band(score_v),
            "flag": "FRAUD_LIKELY" if score_v >= 0.85 else ("REVIEW" if score_v >= 0.65 else "OK"),
            "components": components,
            "reason": [c["k"] for c in sorted(components, key=lambda c: -c["weighted"])[:3]],
        },
        "meta": {"model": f"{MODEL}-deterministic", "version": VERSION,
                 "latency_ms": round((perf_counter() - t0) * 1000, 2)},
    }
