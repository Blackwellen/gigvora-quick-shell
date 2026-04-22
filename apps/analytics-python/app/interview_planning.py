"""Analytics for Domain 29 — Interview workbench dashboard."""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class DashboardBody(BaseModel):
    tenantId: str | None = None
    counts: dict[str, int] = {}
    overdue: int = 0
    conflicts: int = 0


@router.post("/interview-planning/dashboard")
def dashboard(body: DashboardBody):
    note = None
    if body.overdue >= 3:
        note = "Multiple scorecards overdue — chase interviewers."
    elif body.conflicts >= 2:
        note = "Scheduling conflicts detected — review interviewer availability."
    elif body.counts.get("scheduled", 0) >= 10:
        note = "Heavy upcoming load — verify interviewer capacity."
    return {
        "anomalyNote": note,
        "recommendedActions": [
            "Send scorecard reminders" if body.overdue else "Confirm next-day interviews",
            "Resolve scheduling conflicts" if body.conflicts else "Open calibration sessions for completed loops",
            "Review reminder cadence" if body.counts.get("cancelled", 0) >= 2 else "Publish weekly hiring digest",
        ],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
