"""Domain 56 — Resource planning ML.

POST /resource-planning-utilization/recommend
  Ranks candidate resources for a project assignment by combining role match,
  current utilization headroom, and skill overlap. Deterministic — no model.
"""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/resource-planning-utilization", tags=["resource-planning-utilization"])


class ProjectIn(BaseModel):
    id: str
    name: str | None = None
    role: str | None = None
    required_skills: List[str] = Field(default_factory=list)


class RecommendIn(BaseModel):
    project: ProjectIn
    resources: List[Dict[str, Any]] = Field(default_factory=list)
    utilization: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/recommend")
def recommend(req: RecommendIn):
    util_map: Dict[str, float] = {
        u.get("resource_id") or u.get("resourceId"): float(u.get("utilization_ratio") or 0)
        for u in req.utilization
    }

    role = (req.project.role or "").lower()
    required = {s.lower() for s in req.project.required_skills}

    candidates: List[Dict[str, Any]] = []
    for r in req.resources:
        rid = r.get("id")
        if not rid:
            continue
        r_role = (r.get("role") or "").lower()
        r_skills = {str(s).lower() for s in (r.get("skills") or [])}
        utilization = util_map.get(rid, 0.0)
        headroom = max(0.0, 1.0 - utilization)
        role_match = 1.0 if role and r_role == role else 0.0
        skill_overlap = (len(required & r_skills) / len(required)) if required else 0.0

        score = (
            0.45 * headroom
            + 0.35 * role_match
            + 0.20 * skill_overlap
        )
        candidates.append({
            "resourceId": rid,
            "fullName": r.get("full_name") or r.get("fullName"),
            "role": r.get("role"),
            "team": r.get("team"),
            "utilization": round(utilization, 3),
            "headroom": round(headroom, 3),
            "roleMatch": role_match,
            "skillOverlap": round(skill_overlap, 3),
            "score": round(score, 4),
        })

    candidates.sort(key=lambda c: c["score"], reverse=True)
    return {
        "source": "ml",
        "projectId": req.project.id,
        "candidates": candidates[:10],
    }
