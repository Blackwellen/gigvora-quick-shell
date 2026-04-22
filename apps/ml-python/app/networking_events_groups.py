"""ML for Networking + Speed Networking + Events + Groups.

Deterministic, defensible, runnable on a 16 GB-RAM CPU-only VPS.

Endpoints:
  POST /networking-events-groups/speed-match
       body: { attendees: [{id, interests:[str], industry?:str}], strategy }
       returns deterministic round 1 pairings with jaccard overlap as score.

  POST /networking-events-groups/event-recommend
       body: { events:[{id,tags:[str],format,startsAt}], me:{interests:[str],timezone?:str} }
       returns events ranked by tag overlap + decay over days-from-now.

  POST /networking-events-groups/group-recommend
       body: { groups:[{id,tags:[str],memberCount}], me:{interests:[str]} }
       returns groups ranked by tag overlap (popularity tiebreak).

Locked envelope: { data, meta: { model, version, latency_ms } }.
"""
from __future__ import annotations
import math, time
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/networking-events-groups", tags=["networking-events-groups"])
VERSION = "neg-ml-v1-deterministic"


def _norm(xs: List[str]) -> set:
    return {str(x).strip().lower() for x in (xs or []) if str(x).strip()}


def _jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 0.0
    inter = a & b
    union = a | b
    return len(inter) / len(union) if union else 0.0


class SpeedAttendee(BaseModel):
    id: str
    interests: List[str] = Field(default_factory=list)
    industry: str | None = None


class SpeedMatchIn(BaseModel):
    attendees: List[SpeedAttendee]
    strategy: str = "interest_overlap"


@router.post("/speed-match")
def speed_match(body: SpeedMatchIn):
    t0 = time.time()
    used: set = set()
    pairs: List[Dict[str, Any]] = []
    ats = sorted(body.attendees, key=lambda a: a.id)  # deterministic ordering
    for i, a in enumerate(ats):
        if a.id in used:
            continue
        ai = _norm(a.interests)
        best = None
        best_score = -1.0
        best_reason: Dict[str, Any] = {}
        for j in range(i + 1, len(ats)):
            b = ats[j]
            if b.id in used:
                continue
            if body.strategy == "industry":
                score = 1.0 if (a.industry and b.industry and a.industry == b.industry) else 0.0
                reason = {"strategy": "industry", "industry": a.industry}
            elif body.strategy == "random":
                score = 0.5
                reason = {"strategy": "random"}
            else:
                bi = _norm(b.interests)
                score = _jaccard(ai, bi)
                reason = {"strategy": "interest_overlap", "jaccard": round(score, 3),
                          "shared": sorted(list(ai & bi))[:8]}
            if score > best_score:
                best, best_score, best_reason = b, score, reason
        if best:
            used.add(a.id); used.add(best.id)
            pairs.append({"a": a.id, "b": best.id, "score": int(round(100 * max(0.0, best_score))),
                          "reason": best_reason})
    return {
        "data": {"pairs": pairs, "leftover": [a.id for a in ats if a.id not in used]},
        "meta": {"model": VERSION, "version": VERSION, "strategy": body.strategy,
                 "latency_ms": int((time.time() - t0) * 1000)},
    }


class RecMe(BaseModel):
    interests: List[str] = Field(default_factory=list)


class EventItem(BaseModel):
    id: str
    tags: List[str] = Field(default_factory=list)
    format: str | None = None
    startsAt: str | None = None


class EventRecIn(BaseModel):
    events: List[EventItem]
    me: RecMe = Field(default_factory=RecMe)


@router.post("/event-recommend")
def event_recommend(body: EventRecIn):
    t0 = time.time()
    mine = _norm(body.me.interests)
    now = datetime.now(timezone.utc)
    out: List[Dict[str, Any]] = []
    for ev in body.events:
        overlap = _jaccard(mine, _norm(ev.tags))
        days = 0.0
        if ev.startsAt:
            try:
                t = datetime.fromisoformat(ev.startsAt.replace("Z", "+00:00"))
                days = max(0.0, (t - now).total_seconds() / 86400.0)
            except Exception:
                days = 30.0
        # HN-style decay: give a boost to soon-but-not-passed events.
        decay = 1.0 / math.pow(1.0 + days, 0.6)
        score = round(100 * (0.7 * overlap + 0.3 * decay), 2)
        out.append({"id": ev.id, "score": score,
                    "reason": {"tag_overlap": round(overlap, 3), "days_until": round(days, 2)}})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"data": out, "meta": {"model": VERSION, "version": VERSION,
                                  "latency_ms": int((time.time() - t0) * 1000)}}


class GroupItem(BaseModel):
    id: str
    tags: List[str] = Field(default_factory=list)
    memberCount: int = 0


class GroupRecIn(BaseModel):
    groups: List[GroupItem]
    me: RecMe = Field(default_factory=RecMe)


@router.post("/group-recommend")
def group_recommend(body: GroupRecIn):
    t0 = time.time()
    mine = _norm(body.me.interests)
    out: List[Dict[str, Any]] = []
    for g in body.groups:
        overlap = _jaccard(mine, _norm(g.tags))
        pop = math.log1p(max(0, g.memberCount)) / 10.0
        score = round(100 * (0.75 * overlap + 0.25 * min(pop, 1.0)), 2)
        out.append({"id": g.id, "score": score,
                    "reason": {"tag_overlap": round(overlap, 3), "members": g.memberCount}})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"data": out, "meta": {"model": VERSION, "version": VERSION,
                                  "latency_ms": int((time.time() - t0) * 1000)}}
