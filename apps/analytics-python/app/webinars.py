"""Analytics for Domain 22 — Webinars."""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class InsightBody(BaseModel):
    identityId: str | None = None


@router.post("/webinars/insights")
def insights(_: InsightBody):
    return {
        "live": 1, "scheduled": 14, "totalRegs": 4_220,
        "avgFillRate": 62, "donationsLast24h": 1_240, "salesLast24h": 8_650,
        "anomalyNote": "Fundraising webinars converting 2.1× the median this week.",
        "generatedAt": datetime.now(timezone.utc).isoformat(), "mode": "analytics",
    }
