"""ML for Experience Launchpad: deterministic mentor/opportunity ranking + challenge scoring."""
from __future__ import annotations
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/experience-launchpad", tags=["experience-launchpad"])


def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = {x.lower() for x in a}, {x.lower() for x in b}
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / max(1, len(sa | sb))


class RankIn(BaseModel):
    interests: List[str] = Field(default_factory=list)
    candidates: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/mentor-rank")
def mentor_rank(body: RankIn):
    out = []
    for m in body.candidates:
        tags = list({*(m.get("expertise") or []), *(m.get("industries") or [])})
        j = _jaccard(body.interests, tags)
        rating = float(m.get("rating") or 0) / 5.0
        status_bias = 0.15 if m.get("status") == "available" else 0.05 if m.get("status") == "waitlist" else 0
        score = round((j * 0.55 + rating * 0.30 + status_bias) * 100)
        out.append({**m, "score": score})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"data": {"items": out}, "meta": {"algo": "lp-mentor-jaccard-v1"}}


@router.post("/opportunity-recommend")
def opportunity_recommend(body: RankIn):
    out = []
    for o in body.candidates:
        tags = o.get("tags") or []
        j = _jaccard(body.interests, tags)
        recency = 0.1 if o.get("status") == "open" else 0
        score = round((j * 0.7 + recency + 0.2) * 100)
        out.append({**o, "score": score})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"data": {"items": out}, "meta": {"algo": "lp-opp-jaccard-v1"}}


class ChallengeScoreIn(BaseModel):
    rubric: List[Dict[str, Any]] = Field(default_factory=list)  # [{key, weight}]
    submission: Dict[str, Any] = Field(default_factory=dict)    # {key: 0..10}


@router.post("/challenge-score")
def challenge_score(body: ChallengeScoreIn):
    total_w = sum(float(r.get("weight") or 1) for r in body.rubric) or 1
    raw = 0.0
    for r in body.rubric:
        v = float(body.submission.get(r.get("key"), 0))
        raw += min(10, max(0, v)) * (float(r.get("weight") or 1) / total_w)
    score = round(raw * 10)  # 0..100
    return {"data": {"score": score}, "meta": {"algo": "lp-rubric-weighted-v1"}}
