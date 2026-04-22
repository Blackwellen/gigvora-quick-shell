"""ML for Domain 24 — Job Posting Studio.

POST /jobs-studio/quality   — score draft + actionable tips
POST /jobs-studio/moderate  — risk + flags

600ms budget on the Nest side; deterministic fallback there if we're slow.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class Draft(BaseModel):
    title: str = ""
    summary: str = ""
    description: str = ""
    skills: list[str] = []
    salaryMinCents: int | None = None
    salaryMaxCents: int | None = None


class QualityBody(BaseModel):
    draft: Draft


@router.post("/jobs-studio/quality")
def quality(body: QualityBody):
    d = body.draft
    tips: list[str] = []
    score = 50
    if len(d.title) >= 12: score += 8
    else: tips.append("Make the title more specific (12+ chars).")
    if len(d.summary) >= 80: score += 10
    else: tips.append("Add a 1-paragraph summary (80+ chars).")
    if len(d.description) >= 400: score += 15
    else: tips.append("Expand the description (400+ chars).")
    if len(d.skills) >= 3: score += 8
    else: tips.append("Add 3+ skills.")
    if d.salaryMinCents and d.salaryMaxCents: score += 9
    else: tips.append("Add a salary range — listings with salaries get 2× applications.")
    return {"score": min(100, score), "tips": tips}


class ModerateBody(BaseModel):
    draft: dict[str, Any]


@router.post("/jobs-studio/moderate")
def moderate(body: ModerateBody):
    text = " ".join(str(v) for v in body.draft.values()).lower()
    flags: list[str] = []
    if any(w in text for w in ("ssn", "passport number", "bank account")):
        flags.append("pii_request")
    if any(w in text for w in ("unpaid", "no salary", "commission only")):
        flags.append("compensation_concern")
    risk = 5 if not flags else min(100, 40 + len(flags) * 15)
    return {"risk": risk, "flags": flags}
