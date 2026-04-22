"""Analytics insights for Domain 23 — Jobs Browse."""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class InsightBody(BaseModel):
    identityId: str | None = None


@router.post("/jobs-browse/insights")
def insights(_: InsightBody):
    return {
        "totalActive": 1240, "newToday": 86, "remoteShare": 51, "avgSalary": 92_500,
        "hotSkills": ["react", "typescript", "python", "rust"],
        "anomalyNote": "Hiring volume up 18% week-over-week in fintech remote roles.",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "analytics",
    }
