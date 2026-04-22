"""Domain 74 — Super Admin Command Center insights (deterministic)."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/super-admin-command-center", tags=["super-admin-command-center"])


class InsightsIn(BaseModel):
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    open_sev = s.get("openIncidentsBySev") or {}
    sev1 = int(open_sev.get("sev1") or 0)
    sev2 = int(open_sev.get("sev2") or 0)
    kills = int(s.get("killSwitchesActive") or 0)
    audit = int(s.get("auditEvents24h") or 0)
    draft = int((s.get("flagsByStatus") or {}).get("draft") or 0)
    expired_overrides = int((s.get("overridesByStatus") or {}).get("expired") or 0)
    if sev1:    out.append({"id": "sev1_open",      "severity": "critical",
                            "title": f"{sev1} sev1 incident(s) open — page on-call."})
    if sev2:    out.append({"id": "sev2_open",      "severity": "warn",
                            "title": f"{sev2} sev2 incident(s) open."})
    if kills:   out.append({"id": "kill_switches",  "severity": "critical",
                            "title": f"{kills} kill-switch override(s) active."})
    if audit > 200:
        out.append({"id": "audit_volume", "severity": "info",
                    "title": f"{audit} admin events in 24h — review for anomalies."})
    if draft > 5:
        out.append({"id": "draft_flags",  "severity": "info",
                    "title": f"{draft} feature flag(s) in draft."})
    if expired_overrides:
        out.append({"id": "expired_overrides", "severity": "warn",
                    "title": f"{expired_overrides} override(s) expired — clean up."})
    if not out:
        out.append({"id": "platform_healthy", "severity": "success",
                    "title": "Platform posture healthy."})
    return out


@router.post("/insights")
def insights(body: InsightsIn):
    return {"insights": _build(body.signals),
            "meta": {"computed_at": datetime.now(timezone.utc).isoformat()}}
