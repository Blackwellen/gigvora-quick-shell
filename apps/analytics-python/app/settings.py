"""Domain 08 — Settings analytics.

Endpoints:
  POST /settings/insights — recommend missing or risky settings (e.g. user
                            has disabled 2FA-related notifications, has not
                            picked a timezone, has high-contrast off but
                            reduce-motion on, etc.). Deterministic, no model.
"""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingRow(BaseModel):
    namespace: str
    key: str
    value: object


class InsightsRequest(BaseModel):
    items: list[SettingRow]


REQUIRED_KEYS = {
    ("locale", "timezone"),
    ("locale", "language"),
    ("general", "theme"),
}


@router.post("/insights")
def insights(req: InsightsRequest):
    """Return prioritised recommendations and anomaly commentary."""
    have = {(s.namespace, s.key): s.value for s in req.items}
    cards: list[dict] = []

    # Missing essentials
    for ns, key in REQUIRED_KEYS:
        if (ns, key) not in have:
            cards.append({
                "severity": "warning",
                "namespace": ns, "key": key,
                "summary": f"You haven't set {ns}.{key} yet — defaults will be used.",
                "action": "set_value",
            })

    # Accessibility consistency
    rm = have.get(("accessibility", "reduce_motion"))
    hc = have.get(("accessibility", "high_contrast"))
    if rm is True and hc is False:
        cards.append({
            "severity": "info",
            "namespace": "accessibility", "key": "high_contrast",
            "summary": "You enabled reduce-motion. Consider also enabling high-contrast.",
            "action": "enable",
        })

    # Privacy posture
    if have.get(("privacy", "data_sharing_marketing")) is True \
       and have.get(("privacy", "profile_visibility")) == "private":
        cards.append({
            "severity": "warning",
            "namespace": "privacy", "key": "data_sharing_marketing",
            "summary": "Marketing data sharing is on while your profile is private — likely inconsistent.",
            "action": "review",
        })

    cards.sort(key=lambda c: {"warning": 0, "info": 1}.get(c["severity"], 2))
    return {"cards": cards, "fallback": True}
