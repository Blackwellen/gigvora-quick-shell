"""Domain 65 — Internal Admin Login Terminal insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/internal-admin-login-terminal",
                   tags=["internal-admin-login-terminal"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    failures = int(s.get("failures24h") or 0)
    operators = int(s.get("operators") or 0)
    mfa = int(s.get("mfaEnrolled") or 0)

    if failures > 50:
        out.append({"id": "failure_burst", "severity": "critical",
                    "title": f"{failures} failed logins in last 24h — investigate immediately."})
    elif failures > 20:
        out.append({"id": "failure_spike", "severity": "warn",
                    "title": "Login failures elevated in last 24h."})

    if operators > 0 and mfa < operators:
        gap = operators - mfa
        out.append({"id": "mfa_gap", "severity": "warn",
                    "title": f"{gap} operator(s) without MFA enrolled."})

    if not out:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Terminal posture healthy."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
