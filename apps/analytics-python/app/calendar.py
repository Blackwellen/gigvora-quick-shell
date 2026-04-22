"""Domain 17 — Calendar analytics: meeting load, focus-time ratio, no-show rate."""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any

router = APIRouter(prefix="/calendar", tags=["calendar-analytics"])


class EventStat(BaseModel):
    starts_at: datetime
    ends_at:   datetime
    attended:  bool = True
    organizer_id: str | None = None


class LoadRequest(BaseModel):
    events: List[EventStat]
    work_minutes_per_day: int = 480


class LoadResponse(BaseModel):
    total_events: int
    meeting_minutes: int
    focus_minutes: int
    meeting_ratio: float
    no_show_rate: float
    by_day: Dict[str, int]
    band: str
    note: str


@router.post("/load", response_model=LoadResponse)
def calendar_load(req: LoadRequest) -> LoadResponse:
    total = len(req.events)
    meeting_minutes = sum(int((e.ends_at - e.starts_at).total_seconds() // 60) for e in req.events)
    by_day: Dict[str, int] = {}
    for e in req.events:
        day = e.starts_at.date().isoformat()
        by_day[day] = by_day.get(day, 0) + int((e.ends_at - e.starts_at).total_seconds() // 60)
    days = max(1, len(by_day))
    capacity = days * req.work_minutes_per_day
    ratio = round(meeting_minutes / capacity, 4) if capacity else 0.0
    focus = max(0, capacity - meeting_minutes)
    no_show = round(sum(1 for e in req.events if not e.attended) / total, 4) if total else 0.0
    band = "overloaded" if ratio >= 0.6 else ("balanced" if ratio >= 0.3 else "light")
    note = {
        "overloaded": "Meeting load above 60% of work hours — protect focus blocks.",
        "balanced":   "Meeting load within healthy range.",
        "light":      "Plenty of focus time available.",
    }[band]
    return LoadResponse(
        total_events=total, meeting_minutes=meeting_minutes, focus_minutes=focus,
        meeting_ratio=ratio, no_show_rate=no_show, by_day=by_day, band=band, note=note,
    )
