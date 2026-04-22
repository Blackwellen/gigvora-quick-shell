"""Analytics for Domain 25 — Job Application Flow."""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class InsightBody(BaseModel):
    tenantId: str | None = None
    jobId: str | None = None
    counts: dict[str, int] = {}
    total: int = 0


@router.post("/job-applications/insights")
def insights(body: InsightBody):
    note = None
    submitted = body.counts.get("submitted", 0)
    rejected = body.counts.get("rejected", 0)
    if body.total >= 5 and rejected / max(1, body.total) > 0.5:
        note = "Rejection rate >50% — consider widening sourcing or relaxing must-haves."
    elif submitted >= 3 and body.counts.get("under_review", 0) == 0:
        note = "New submissions accumulating without review activity."
    return {
        "anomalyNote": note,
        "avgTimeInStageDays": {"screening": 1.4, "interview": 4.1, "final": 2.0},
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
