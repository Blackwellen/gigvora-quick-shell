"""Domain 60 — Ads Manager analytics & insights."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ads-manager-builder", tags=["ads-manager-builder"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    review = int(s.get("inReview") or 0)
    rejected = int(s.get("rejected") or 0)
    active = int(s.get("active") or 0)
    paused = int(s.get("paused") or 0)
    total = int(s.get("campaigns") or 0)

    if review > 0:
        out.append({"id": "review", "severity": "info",
                    "title": f"{review} campaign(s) awaiting moderation",
                    "body": "Moderators will review within ~24h. You can keep editing drafts."})
    if rejected > 0:
        out.append({"id": "rejected", "severity": "warn",
                    "title": f"{rejected} campaign(s) rejected",
                    "body": "Open each one to read the rationale, fix the issue, and resubmit."})
    if active == 0 and total > 0:
        out.append({"id": "no_active", "severity": "info",
                    "title": "No active campaigns",
                    "body": "Promote a draft to in_review to begin moderation."})
    if paused > active and active > 0:
        out.append({"id": "paused_heavy", "severity": "info",
                    "title": "More paused than active campaigns",
                    "body": "Re-evaluate paused campaigns or archive them to declutter."})
    if not out:
        out.append({"id": "healthy", "severity": "success",
                    "title": "Ads pipeline healthy",
                    "body": "Nothing to action right now."})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
