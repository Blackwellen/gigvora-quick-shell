"""ML ranking for Domain 23 — Jobs Browse / Discovery / Saved Search.

Endpoint: POST /jobs-browse/rank
Body: { identityId?, filters, candidates: [...] }
Returns: { ranked: [...], mode: 'ml' }

Heuristic blend (skills overlap, recency, applicant pressure, remote bonus).
Designed to fail closed within 600ms — the NestJS bridge times out and falls
back to deterministic ranking automatically.
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class RankBody(BaseModel):
    identityId: str | None = None
    filters: dict[str, Any] = {}
    candidates: list[dict[str, Any]] = []


def _score(c: dict, filters: dict, profile_skills: set[str]) -> float:
    skills = set(map(str.lower, c.get("skills", [])))
    overlap = len(skills & profile_skills) if profile_skills else min(4, len(skills))
    age_days = max(0.1, (datetime.now(timezone.utc) - datetime.fromisoformat(c["postedAt"].replace("Z", "+00:00"))).total_seconds() / 86400)
    recency = max(0.0, 5.0 - age_days * 0.3)
    remote_bonus = 1.5 if filters.get("remote") in ("remote", "any") and c.get("remote") == "remote" else 0
    pressure = -0.02 * c.get("applicants", 0)
    return overlap * 3 + recency + remote_bonus + pressure


@router.post("/jobs-browse/rank")
def rank(body: RankBody):
    profile_skills: set[str] = set()
    if body.identityId:
        profile_skills = {"react", "typescript", "node"}  # placeholder — real impl reads profile vector
    ranked = sorted(body.candidates, key=lambda c: _score(c, body.filters, profile_skills), reverse=True)
    return {"ranked": ranked, "mode": "ml"}
