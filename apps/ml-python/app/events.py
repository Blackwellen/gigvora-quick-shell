"""Domain 15 — Events ML signals.

Enterprise-grade by contract: deterministic primary path, locked envelope,
runnable on a 16 GB-RAM VPS with no GPU/heavy deps. A learned ranker can be
swapped behind the same envelope (`model: events-ranker-v2-learned`) without
touching callers.
"""
from datetime import datetime
from math import exp
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/events", tags=["events"])


class RankRequest(BaseModel):
    events: list[dict[str, Any]]
    viewer: dict[str, Any] = {}      # tags[], skills[], location?, timezone?
    limit: int = 50


def _overlap(a: list[str] | None, b: list[str] | None) -> float:
    if not a or not b: return 0.0
    sa, sb = {x.lower() for x in a}, {x.lower() for x in b}
    return len(sa & sb) / max(1, len(sa | sb))


@router.post("/rank")
def rank(req: RankRequest):
    """Personalized ranking signal: tag overlap + capacity headroom + recency-of-start.

    Returns a deterministic, defensible score per event with full component
    breakdown so an operator can explain the order in a Trust & Safety review.
    """
    now = datetime.utcnow().timestamp()
    viewer_tags = (req.viewer.get("tags") or []) + (req.viewer.get("skills") or [])
    out: list[dict[str, Any]] = []
    for e in req.events:
        try:
            starts = datetime.fromisoformat(str(e.get("startsAt", "")).replace("Z", "")).timestamp()
        except Exception:
            starts = now + 86400
        days_out = max(0.1, (starts - now) / 86400)

        relevance = _overlap(viewer_tags, e.get("tags"))
        # capacity headroom: rewards events that still have room
        cap = e.get("capacity") or 0
        rsvps = e.get("rsvpCount") or 0
        headroom = 1.0 if cap == 0 else max(0.0, 1.0 - (rsvps / cap))
        # imminence bell: events 1-14 days out score highest
        imminence = exp(-((days_out - 7) ** 2) / (2 * 9 * 9))
        popularity = min(1.0, rsvps / 200)
        host_match = 1.0 if e.get("hostId") and e.get("hostId") == req.viewer.get("identityId") else 0.0

        score = round(
            0.40 * relevance +
            0.20 * imminence +
            0.20 * popularity +
            0.15 * headroom +
            0.05 * host_match, 4
        )
        out.append({
            "id": e.get("id"),
            "score": score,
            "components": {
                "relevance": round(relevance, 3),
                "imminence": round(imminence, 3),
                "popularity": round(popularity, 3),
                "headroom":   round(headroom, 3),
                "host_match": host_match,
            },
        })
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"items": out[: req.limit], "model": "events-ranker-v1-deterministic"}


class MatchRequest(BaseModel):
    attendees: list[dict[str, Any]]   # [{ identityId, tags[], skills[], industry?, seniority? }]
    rounds: int = 4


@router.post("/networking/match")
def speed_networking_match(req: MatchRequest):
    """Round-robin matchmaker for speed networking.

    Greedy, complementarity-weighted pairing per round. Deterministic for the
    same input ordering — callers can salt the `identityId` strings to vary
    rounds without losing reproducibility.
    """
    people = list(req.attendees)
    rounds_out: list[dict[str, Any]] = []
    seen_pairs: set[tuple[str, str]] = set()

    for r in range(req.rounds):
        pool = list(people)
        # rotate to vary first pick across rounds
        if pool: pool = pool[r % len(pool):] + pool[: r % len(pool)]
        pairs: list[dict[str, Any]] = []
        used: set[str] = set()
        for i, a in enumerate(pool):
            if a["identityId"] in used: continue
            best = None
            best_score = -1.0
            for b in pool[i + 1:]:
                if b["identityId"] in used: continue
                key = tuple(sorted([a["identityId"], b["identityId"]]))
                if key in seen_pairs: continue
                tag_overlap = _overlap(a.get("tags"), b.get("tags"))
                skill_complement = 1.0 - _overlap(a.get("skills"), b.get("skills"))
                industry_bonus = 0.2 if a.get("industry") and a.get("industry") == b.get("industry") else 0.0
                s = round(0.5 * tag_overlap + 0.4 * skill_complement + industry_bonus, 4)
                if s > best_score: best, best_score = b, s
            if best:
                used.add(a["identityId"]); used.add(best["identityId"])
                seen_pairs.add(tuple(sorted([a["identityId"], best["identityId"]])))
                pairs.append({"a": a["identityId"], "b": best["identityId"], "score": best_score})
        rounds_out.append({"round": r + 1, "pairs": pairs, "byes": [p["identityId"] for p in pool if p["identityId"] not in used]})

    return {"rounds": rounds_out, "model": "events-speed-matcher-v1-deterministic"}
