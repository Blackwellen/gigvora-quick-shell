"""ML for Domain 29 — Interview Planning, Scheduling & Scorecards.

POST /interview-planning/slot-score   — score a candidate slot (0..100)
POST /interview-planning/summarise    — summarise scorecard cluster

Domain 29 declares ML as an optional enhancement; deterministic
fallbacks are first-class.
"""
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class SlotBody(BaseModel):
    startAt: str
    conflictFlags: list[str] = []
    interviewerCount: int = 1


@router.post("/interview-planning/slot-score")
def slot_score(body: SlotBody):
    s = 80
    s -= len(body.conflictFlags) * 25
    try:
        dt = datetime.fromisoformat(body.startAt.replace("Z", "+00:00"))
        if dt.hour < 8 or dt.hour > 18:
            s -= 15
    except Exception:
        pass
    if body.interviewerCount > 3:
        s -= 5
    return {"score": max(0, min(100, s))}


class ScorecardItem(BaseModel):
    interviewer: str = ""
    recommendation: str | None = None
    averageScore: float | None = None
    strengths: str = ""
    concerns: str = ""


class SummariseBody(BaseModel):
    candidateName: str = ""
    jobTitle: str = ""
    scorecards: list[ScorecardItem] = []


@router.post("/interview-planning/summarise")
def summarise(body: SummariseBody):
    submitted = [s for s in body.scorecards if s.recommendation]
    if not submitted:
        return {"headline": "No submitted scorecards yet", "avgScore": None,
                "recommendation": None, "themes": []}
    avg = round(sum((s.averageScore or 0) for s in submitted) / len(submitted), 2)
    counts: dict[str, int] = {}
    for s in submitted:
        counts[s.recommendation or "n/a"] = counts.get(s.recommendation or "n/a", 0) + 1
    top = max(counts.items(), key=lambda x: x[1])[0] if counts else None
    themes: list[str] = []
    if avg >= 4.2: themes.append("Strong technical signal")
    if avg < 3: themes.append("Below bar overall")
    if sum(1 for s in submitted if s.concerns) >= 2: themes.append("Repeated concerns surfaced")
    headline = ({
        "strong_hire": "Strong hire signal across panel",
        "hire": "Lean hire",
        "no_hire": "Lean no-hire",
        "strong_no_hire": "Strong no-hire signal",
    }).get(top or "", "Mixed signal")
    return {"headline": headline, "avgScore": avg, "recommendation": top, "themes": themes}
