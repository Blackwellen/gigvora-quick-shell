"""Domain 13 — Agency ML service.

Deterministic primary path: rules + scoring for agency-to-brief matching and
team load balancing. Runnable on a 16 GB-RAM VPS without a GPU.

Endpoints (mounted in main.py):
  POST /agency/match  — score agencies against a brief
  POST /agency/route  — recommend internal team member for an inquiry
"""
from __future__ import annotations

import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agency", tags=["agency"])
MODEL = "agency-rules"
VERSION = "1.0.0"


class Brief(BaseModel):
    industry: str | None = None
    services: list[str] = Field(default_factory=list)
    budget_min: float | None = None
    budget_max: float | None = None
    timeline_weeks: int | None = None


class AgencyCandidate(BaseModel):
    id: str
    industries: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    rating: float = 0.0
    capacity_pct: float = 100.0
    min_budget: float = 0.0


class MatchRequest(BaseModel):
    brief: Brief
    candidates: list[AgencyCandidate]


class TeamMember(BaseModel):
    id: str
    skills: list[str] = Field(default_factory=list)
    workload_pct: float = 0.0
    seniority: int = 1  # 1=junior, 5=principal


class RouteRequest(BaseModel):
    inquiry_skills: list[str]
    team: list[TeamMember]


def _score(brief: Brief, c: AgencyCandidate) -> float:
    """Deterministic 0..1 score. Industry, service overlap, rating, capacity, budget fit."""
    s = 0.0
    if brief.industry and brief.industry in c.industries:
        s += 0.25
    if brief.services:
        overlap = len(set(brief.services) & set(c.services)) / max(1, len(brief.services))
        s += 0.30 * overlap
    s += 0.15 * min(1.0, c.rating / 5.0)
    s += 0.15 * (c.capacity_pct / 100.0)
    if brief.budget_max is not None and c.min_budget <= brief.budget_max:
        s += 0.15
    return round(min(1.0, s), 4)


@router.post("/match")
def match(req: MatchRequest) -> dict[str, Any]:
    started = time.perf_counter()
    ranked = sorted(
        ({"id": c.id, "score": _score(req.brief, c)} for c in req.candidates),
        key=lambda r: r["score"],
        reverse=True,
    )
    return {
        "data": ranked,
        "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)},
    }


@router.post("/route")
def route(req: RouteRequest) -> dict[str, Any]:
    started = time.perf_counter()
    skills = set(req.inquiry_skills)
    scored = []
    for m in req.team:
        skill_hit = len(skills & set(m.skills)) / max(1, len(skills))
        capacity = 1.0 - (m.workload_pct / 100.0)
        seniority_fit = min(1.0, m.seniority / 5.0)
        score = round(0.5 * skill_hit + 0.3 * capacity + 0.2 * seniority_fit, 4)
        scored.append({"id": m.id, "score": score})
    scored.sort(key=lambda r: r["score"], reverse=True)
    return {
        "data": scored,
        "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)},
    }
