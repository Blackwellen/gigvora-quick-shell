"""Domain 54 — Org members & seats analytics.

Operational summaries + prioritisation hints for member governance,
seat utilisation, invitation hygiene, and least-privilege drift.
Deterministic so NestJS can degrade gracefully when warehouse is offline.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/org-members-seats", tags=["org-members-seats"])


class InsightsIn(BaseModel):
    org_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    pending = int(s.get("pendingInvites") or 0)
    suspended = int(s.get("suspended") or 0)
    available = int(s.get("seatsAvailable") or 0)
    assigned = int(s.get("seatsAssigned") or 0)
    util = float(s.get("seatUtilization") or 0)
    owners = int(s.get("ownerCount") or 0)
    active = int(s.get("activeMembers") or 0)

    if pending > 0:
        out.append({"id": "pending-invites", "severity": "info",
                    "title": f"{pending} pending invitation(s)",
                    "body": "Follow up with invitees or revoke stale invites.",
                    "action": {"label": "Review invitations",
                               "href": "/app/org-members-seats/invitations"}})
    if suspended > 0:
        out.append({"id": "suspended", "severity": "info",
                    "title": f"{suspended} suspended member(s)",
                    "body": "Reinstate or remove to keep seat capacity accurate."})
    if available == 0 and assigned > 0:
        out.append({"id": "no-seats", "severity": "warn",
                    "title": "No seats available",
                    "body": "Purchase seats before sending more invitations.",
                    "action": {"label": "Purchase seats",
                               "href": "/app/org-members-seats/billing"}})
    if util >= 0.9:
        out.append({"id": "near-cap", "severity": "warn",
                    "title": f"Seat utilisation {int(util * 100)}%",
                    "body": "Consider purchasing additional seats to avoid blocking growth."})
    if owners < 2 and active > 5:
        out.append({"id": "owner-bus-factor", "severity": "warn",
                    "title": "Single owner — bus-factor risk",
                    "body": "Promote a second trusted member to owner for redundancy."})
    if owners > 4:
        out.append({"id": "too-many-owners", "severity": "info",
                    "title": f"{owners} owners",
                    "body": "Review least-privilege — most teams need 1-2 owners."})

    if not out:
        out.append({"id": "all-clear", "severity": "success",
                    "title": "Org membership healthy",
                    "body": "No outstanding signals across members, seats, or invites."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
