"""Domain 14 — Groups ML (Turn 4).

Deterministic moderation scorer for posts/comments awaiting review. Mixes
keyword toxicity buckets, link/promo density, ALL-CAPS ratio, repetition,
and author-trust prior. Returns a queue ordering with action recommendation.
"""
from __future__ import annotations

import math
import re
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/groups", tags=["groups-ml"])
MODEL = "groups-moderation-v1"
VERSION = "1.0.0"

_TOXIC = {"spam", "scam", "phishing", "hate", "slur", "abuse", "kill", "doxx"}
_PROMO = {"buy now", "click here", "limited offer", "dm me", "telegram", "whatsapp +"}
_URL = re.compile(r"https?://\S+")
_WORD = re.compile(r"[A-Za-z]+")


class GroupPost(BaseModel):
    id: str
    body: str = ""
    author_id: str | None = None
    author_trust: float = 0.5  # 0..1 prior; new accounts ~0.2, verified mods ~0.95
    reports: int = 0
    age_minutes: float = 0


class ModerateRequest(BaseModel):
    posts: list[GroupPost] = Field(default_factory=list)
    limit: int = 100


def _score(p: GroupPost) -> dict[str, Any]:
    text = p.body or ""
    lower = text.lower()
    toks = _WORD.findall(text) or [""]
    caps = sum(1 for w in toks if len(w) > 2 and w.isupper())
    caps_ratio = caps / max(1, len(toks))
    urls = len(_URL.findall(text))
    url_density = urls / max(1, len(toks))
    toxic_hits = sum(1 for w in _TOXIC if w in lower)
    promo_hits = sum(1 for p_ in _PROMO if p_ in lower)
    repeat = 1.0 if re.search(r"(.)\1{4,}", lower) else 0.0
    report_signal = min(1.0, p.reports / 5.0)
    trust_penalty = 1.0 - max(0.0, min(1.0, p.author_trust))
    raw = (
        0.30 * min(1.0, toxic_hits / 2.0)
        + 0.20 * min(1.0, promo_hits / 2.0)
        + 0.10 * caps_ratio
        + 0.10 * min(1.0, url_density * 4)
        + 0.05 * repeat
        + 0.15 * report_signal
        + 0.10 * trust_penalty
    )
    score = round(min(1.0, raw), 5)
    if score >= 0.70 or toxic_hits >= 2:
        action = "remove"
    elif score >= 0.45 or p.reports >= 3:
        action = "review"
    elif score >= 0.20:
        action = "watch"
    else:
        action = "allow"
    return {
        "id": p.id,
        "score": score,
        "action": action,
        "signals": {
            "toxic_hits": toxic_hits,
            "promo_hits": promo_hits,
            "caps_ratio": round(caps_ratio, 3),
            "url_density": round(url_density, 3),
            "reports": p.reports,
            "trust_penalty": round(trust_penalty, 3),
        },
    }


@router.post("/moderate")
def moderate(req: ModerateRequest) -> dict[str, Any]:
    started = time.perf_counter()
    out = [_score(p) for p in req.posts]
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"data": out[: req.limit], "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)}}
