"""Analytics for Domain 24 — Job Posting Studio."""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class InsightBody(BaseModel):
    tenantId: str | None = None


@router.post("/jobs-studio/insights")
def insights(_: InsightBody):
    return {
        "anomalyNote": "Engineering postings are filling 30% faster than the 90-day baseline.",
        "avgTimeToFillDays": 16,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
