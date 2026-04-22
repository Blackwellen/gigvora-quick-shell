"""Domain 19 — Calendar Booking analytics router.

Operational summaries with deterministic outputs.
Mounted from app/main.py via ``app.include_router(booking_router)``.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class ApptIn(BaseModel):
    id: str
    status: str
    rescheduleCount: Optional[int] = 0


class InsightsRequest(BaseModel):
    appointments: List[ApptIn]


@router.post("/booking/insights")
def booking_insights(req: InsightsRequest):
    total = len(req.appointments)
    confirmed = sum(1 for a in req.appointments if a.status in ("confirmed", "completed"))
    cancelled = sum(1 for a in req.appointments if a.status == "cancelled")
    no_show = sum(1 for a in req.appointments if a.status == "no_show")
    pending = sum(1 for a in req.appointments if a.status == "pending")
    reschedules = sum((a.rescheduleCount or 0) for a in req.appointments)

    cards = [
        {"id": "confirmation", "title": "Confirmation rate",
         "value": round(confirmed / max(1, total) * 100), "unit": "%",
         "trend": "up" if confirmed >= cancelled else "down"},
        {"id": "pending", "title": "Pending approval", "value": pending, "unit": "",
         "trend": "neutral"},
        {"id": "cancel", "title": "Cancellations", "value": cancelled, "unit": "",
         "trend": "down" if cancelled else "up"},
        {"id": "noshow", "title": "No-shows", "value": no_show, "unit": "",
         "trend": "down" if no_show else "neutral"},
        {"id": "reschedules", "title": "Reschedules", "value": reschedules,
         "unit": "", "trend": "neutral"},
    ]
    anomalies = []
    if no_show:
        anomalies.append(f"{no_show} no-shows detected — consider stricter reminders.")
    if cancelled > confirmed and total > 3:
        anomalies.append("Cancellations exceed confirmations — review availability.")
    if reschedules > total:
        anomalies.append("High reschedule volume — invitees may be struggling with offered slots.")

    return {"source": "python", "cards": cards, "anomalies": anomalies}
