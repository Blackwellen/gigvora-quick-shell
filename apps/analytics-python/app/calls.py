"""Domain 18 — Calls/Video/Presence analytics router.

Provides operational summaries with deterministic outputs and safe fallbacks.
Mounted from app/main.py via ``app.include_router(calls_router)``.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class CallIn(BaseModel):
    id: str
    status: str
    kind: str
    durationSeconds: Optional[int] = None
    scheduledAt: Optional[str] = None


class InsightsRequest(BaseModel):
    calls: List[CallIn]


@router.post("/calls/insights")
def calls_insights(req: InsightsRequest):
    total = len(req.calls)
    completed = sum(1 for c in req.calls if c.status == "completed")
    missed = sum(1 for c in req.calls if c.status in ("missed", "declined"))
    failed = sum(1 for c in req.calls if c.status == "failed")
    durs = [c.durationSeconds or 0 for c in req.calls if c.status == "completed"]
    avg = round(sum(durs) / max(1, len(durs)) / 60, 1) if durs else 0

    cards = [
        {"id": "completion", "title": "Completion rate",
         "value": round(completed / max(1, total) * 100), "unit": "%",
         "trend": "up" if completed >= missed else "down"},
        {"id": "avg_dur", "title": "Avg call duration", "value": avg, "unit": "min", "trend": "neutral"},
        {"id": "missed", "title": "Missed / declined", "value": missed, "unit": "",
         "trend": "down" if missed else "up"},
        {"id": "video_share", "title": "Video share",
         "value": round(sum(1 for c in req.calls if c.kind == "video") / max(1, total) * 100),
         "unit": "%", "trend": "neutral"},
    ]
    anomalies = []
    if failed:
        anomalies.append(f"{failed} failed connections detected — review network/provider health.")
    if missed > completed and total > 3:
        anomalies.append("Missed-call rate exceeds completed — consider revising contact windows.")

    return {"source": "python", "cards": cards, "anomalies": anomalies}
