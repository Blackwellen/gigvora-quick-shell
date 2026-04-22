"""Domain 12 — Companies ML (Turn 3).

Deterministic similarity & competitor graph. Cosine over hashed industry/
keyword vectors plus structural signals (size band, region, public/private).
"""
from __future__ import annotations

import hashlib
import math
import re
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/companies", tags=["companies-ml"])
MODEL = "companies-hashed-cosine"
VERSION = "1.0.0"
DIM = 32
_TOK = re.compile(r"[a-z0-9]+")


class Company(BaseModel):
    id: str
    name: str = ""
    description: str = ""
    industries: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    size_band: str = "unknown"  # micro|sme|mid|large|enterprise
    region: str | None = None
    public: bool = False


_SIZE = {"micro": 0, "sme": 1, "mid": 2, "large": 3, "enterprise": 4, "unknown": 2}


def _vec(c: Company) -> list[float]:
    text = " ".join([c.name, c.description, " ".join(c.industries), " ".join(c.keywords)]).lower()
    toks = _TOK.findall(text)
    v = [0.0] * DIM
    for t in toks + [f"{a}_{b}" for a, b in zip(toks, toks[1:])]:
        h = int(hashlib.md5(t.encode()).hexdigest(), 16) % DIM
        v[h] += 1.0
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


class SimilarRequest(BaseModel):
    target: Company
    candidates: list[Company]
    limit: int = 20


@router.post("/similar")
def similar(req: SimilarRequest) -> dict[str, Any]:
    started = time.perf_counter()
    tv = _vec(req.target)
    out: list[dict[str, Any]] = []
    for c in req.candidates:
        if c.id == req.target.id:
            continue
        cv = _vec(c)
        cos = round(sum(x * y for x, y in zip(tv, cv)), 5)
        ind_overlap = len(set(req.target.industries) & set(c.industries))
        size_fit = 1.0 - abs(_SIZE.get(req.target.size_band, 2) - _SIZE.get(c.size_band, 2)) / 4.0
        region_match = 1.0 if req.target.region and c.region and req.target.region == c.region else 0.0
        score = round(0.55 * cos + 0.20 * (1 if ind_overlap else 0) + 0.15 * size_fit + 0.10 * region_match, 5)
        out.append({"id": c.id, "score": score, "industry_overlap": ind_overlap, "cosine": cos})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"data": out[: req.limit], "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)}}


class CompetitorRequest(BaseModel):
    target: Company
    universe: list[Company]
    limit: int = 10


@router.post("/competitors")
def competitors(req: CompetitorRequest) -> dict[str, Any]:
    """Competitors = high cosine + same size band + industry overlap."""
    started = time.perf_counter()
    tv = _vec(req.target)
    out: list[dict[str, Any]] = []
    for c in req.universe:
        if c.id == req.target.id:
            continue
        ind = set(req.target.industries) & set(c.industries)
        if not ind:
            continue
        cv = _vec(c)
        cos = round(sum(x * y for x, y in zip(tv, cv)), 5)
        same_size = 1.0 if c.size_band == req.target.size_band else 0.0
        out.append({"id": c.id, "score": round(0.7 * cos + 0.3 * same_size, 5), "shared_industries": sorted(ind)})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"data": out[: req.limit], "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)}}
