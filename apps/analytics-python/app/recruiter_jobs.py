"""Analytics for Domain 26 — Recruiter dashboard insights."""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class DashboardBody(BaseModel):
    tenantId: str | None = None
    counts: dict[str, int] = {}
    openCount: int = 0


@router.post("/recruiter-jobs/dashboard")
def dashboard(body: DashboardBody):
    note = None
    pending = body.counts.get("pending_approval", 0)
    if pending >= 3:
        note = "Approval backlog growing — check approver workload."
    elif body.openCount >= 8:
        note = "High open-role count — consider sourcing reinforcement."
    return {
        "anomalyNote": note,
        "recommendedActions": [
            "Review pending approvals" if pending else "Source candidates for top-priority roles",
            "Re-balance recruiter assignments",
        ],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
