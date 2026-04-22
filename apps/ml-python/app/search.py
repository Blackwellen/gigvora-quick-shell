"""Domain — Search ranker (Turn 2).

Deterministic BM25-lite ranker over (title, body, tags) with intent boosts.
CPU-only, runnable on a 16 GB-RAM VPS. The Python service owns the primary
path; the NestJS bridge falls back to recency when this service is down.
"""
from __future__ import annotations

import math
import time
import re
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/search", tags=["search-ml"])
MODEL = "search-bm25-lite"
VERSION = "1.0.0"

_TOKEN = re.compile(r"[a-z0-9]+")


def _tok(s: str) -> list[str]:
    return _TOKEN.findall((s or "").lower())


class Doc(BaseModel):
    id: str
    title: str = ""
    body: str = ""
    tags: list[str] = Field(default_factory=list)
    kind: str = "post"  # post|profile|company|gig|service|event|group
    recency_days: float = 365.0
    boost: float = 1.0


class RankRequest(BaseModel):
    query: str
    docs: list[Doc]
    intent: str | None = None  # people|companies|gigs|services|events|posts
    limit: int = 50


def _bm25_lite(q_terms: list[str], doc_terms: list[str], avgdl: float, n: int, df: dict[str, int]) -> float:
    """Tiny BM25 — k1=1.2, b=0.75."""
    if not doc_terms:
        return 0.0
    score = 0.0
    dl = len(doc_terms)
    tf: dict[str, int] = {}
    for t in doc_terms:
        tf[t] = tf.get(t, 0) + 1
    for t in q_terms:
        if t not in tf:
            continue
        idf = math.log(1 + (n - df.get(t, 0) + 0.5) / (df.get(t, 0) + 0.5))
        num = tf[t] * (1.2 + 1)
        den = tf[t] + 1.2 * (1 - 0.75 + 0.75 * dl / max(1.0, avgdl))
        score += idf * num / den
    return score


@router.post("/rank")
def rank(req: RankRequest) -> dict[str, Any]:
    started = time.perf_counter()
    q_terms = _tok(req.query)
    if not q_terms or not req.docs:
        return {"data": [], "meta": {"model": MODEL, "version": VERSION, "latency_ms": 0}}

    docs_terms = [_tok(d.title) * 3 + _tok(d.body) + [t.lower() for t in d.tags] * 2 for d in req.docs]
    avgdl = sum(len(t) for t in docs_terms) / max(1, len(docs_terms))
    df: dict[str, int] = {}
    for terms in docs_terms:
        for t in set(terms):
            df[t] = df.get(t, 0) + 1
    n = len(docs_terms)

    intent_boost = {"people": "profile", "companies": "company", "gigs": "gig", "services": "service", "events": "event", "posts": "post"}
    target_kind = intent_boost.get(req.intent or "")

    scored: list[dict[str, Any]] = []
    for d, terms in zip(req.docs, docs_terms):
        bm = _bm25_lite(q_terms, terms, avgdl, n, df)
        recency_decay = math.exp(-d.recency_days / 90.0)  # 90-day half-ish life
        kind_match = 1.15 if (target_kind and d.kind == target_kind) else 1.0
        s = round(bm * d.boost * (0.7 + 0.3 * recency_decay) * kind_match, 5)
        scored.append({"id": d.id, "kind": d.kind, "score": s})

    scored.sort(key=lambda r: r["score"], reverse=True)
    return {
        "data": scored[: req.limit],
        "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)},
    }
