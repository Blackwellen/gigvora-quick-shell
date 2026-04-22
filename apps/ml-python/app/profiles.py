"""Domain 11 — Profiles ML (Turn 3).

Deterministic embedding-style similarity using hashed n-gram + tag/skill
Jaccard. CPU-only, no model files needed. Returns a stable vector per
profile (32-d hashed counts) and cosine similarity between profiles.
"""
from __future__ import annotations

import hashlib
import math
import re
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/profiles", tags=["profiles-ml"])
MODEL = "profiles-hashed-ngram"
VERSION = "1.0.0"
DIM = 32
_TOK = re.compile(r"[a-z0-9]+")


class ProfileDoc(BaseModel):
    id: str
    headline: str = ""
    bio: str = ""
    skills: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    seniority: int = 1


def _embed(p: ProfileDoc) -> list[float]:
    text = " ".join([p.headline, p.bio, " ".join(p.skills), " ".join(p.industries)]).lower()
    toks = _TOK.findall(text)
    vec = [0.0] * DIM
    # unigrams + bigrams
    grams = toks + [f"{a}_{b}" for a, b in zip(toks, toks[1:])]
    for g in grams:
        h = int(hashlib.md5(g.encode()).hexdigest(), 16) % DIM
        vec[h] += 1.0
    # L2-normalise
    n = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / n, 5) for x in vec]


def _cos(a: list[float], b: list[float]) -> float:
    return round(sum(x * y for x, y in zip(a, b)), 5)


class EmbedRequest(BaseModel):
    profiles: list[ProfileDoc]


@router.post("/embed")
def embed(req: EmbedRequest) -> dict[str, Any]:
    started = time.perf_counter()
    data = [{"id": p.id, "vector": _embed(p)} for p in req.profiles]
    return {"data": data, "meta": {"model": MODEL, "version": VERSION, "dim": DIM, "latency_ms": int((time.perf_counter() - started) * 1000)}}


class SimilarRequest(BaseModel):
    target: ProfileDoc
    candidates: list[ProfileDoc]
    limit: int = 20


@router.post("/similar")
def similar(req: SimilarRequest) -> dict[str, Any]:
    started = time.perf_counter()
    tv = _embed(req.target)
    target_skills = set(s.lower() for s in req.target.skills)
    target_inds = set(i.lower() for i in req.target.industries)
    out: list[dict[str, Any]] = []
    for c in req.candidates:
        if c.id == req.target.id:
            continue
        cv = _embed(c)
        cos = _cos(tv, cv)
        skill_jacc = len(target_skills & set(s.lower() for s in c.skills)) / max(1, len(target_skills | set(s.lower() for s in c.skills)))
        ind_jacc = len(target_inds & set(i.lower() for i in c.industries)) / max(1, len(target_inds | set(i.lower() for i in c.industries)))
        seniority_fit = 1.0 - min(1.0, abs(req.target.seniority - c.seniority) / 5.0)
        score = round(0.50 * cos + 0.25 * skill_jacc + 0.15 * ind_jacc + 0.10 * seniority_fit, 5)
        out.append({"id": c.id, "score": score, "reasons": {"cosine": cos, "skill_jaccard": round(skill_jacc, 4), "industry_jaccard": round(ind_jacc, 4)}})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"data": out[: req.limit], "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)}}
