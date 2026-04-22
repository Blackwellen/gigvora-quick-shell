"""Domain 10 — Network recommendations (Turn 2).

People-You-May-Know via deterministic graph signals:
  • mutual connections (Adamic–Adar style weighting)
  • shared employers / schools / groups
  • geographic proximity
  • interest overlap

CPU-only, no GPU, no embeddings model required.
"""
from __future__ import annotations

import math
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/network", tags=["network-ml"])
MODEL = "network-pymk-graph"
VERSION = "1.0.0"


class Person(BaseModel):
    id: str
    connections: list[str] = Field(default_factory=list)
    employers: list[str] = Field(default_factory=list)
    schools: list[str] = Field(default_factory=list)
    groups: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    city: str | None = None


class PymkRequest(BaseModel):
    viewer: Person
    candidates: list[Person]
    exclude_existing: bool = True
    limit: int = 20


def _adamic_adar(viewer_conns: set[str], cand_conns: set[str], degree_lookup: dict[str, int]) -> float:
    mutual = viewer_conns & cand_conns
    score = 0.0
    for m in mutual:
        deg = degree_lookup.get(m, 1)
        score += 1.0 / math.log(2 + deg)
    return score


@router.post("/pymk")
def pymk(req: PymkRequest) -> dict[str, Any]:
    started = time.perf_counter()
    viewer_conns = set(req.viewer.connections)
    viewer_emp = set(req.viewer.employers)
    viewer_sch = set(req.viewer.schools)
    viewer_grp = set(req.viewer.groups)
    viewer_int = set(t.lower() for t in req.viewer.interests)
    viewer_city = (req.viewer.city or "").lower()

    # Approximate degree lookup from candidates' connection lists.
    degree: dict[str, int] = {}
    for c in req.candidates:
        for cn in c.connections:
            degree[cn] = degree.get(cn, 0) + 1

    out: list[dict[str, Any]] = []
    for c in req.candidates:
        if c.id == req.viewer.id:
            continue
        if req.exclude_existing and c.id in viewer_conns:
            continue
        cand_conns = set(c.connections)
        aa = _adamic_adar(viewer_conns, cand_conns, degree)
        emp = len(viewer_emp & set(c.employers))
        sch = len(viewer_sch & set(c.schools))
        grp = len(viewer_grp & set(c.groups))
        ints = len(viewer_int & set(t.lower() for t in c.interests))
        geo = 1.0 if viewer_city and c.city and c.city.lower() == viewer_city else 0.0
        score = round(0.45 * aa + 0.15 * emp + 0.10 * sch + 0.10 * grp + 0.10 * ints + 0.10 * geo, 5)
        out.append({
            "id": c.id,
            "score": score,
            "reasons": {"mutual": len(viewer_conns & cand_conns), "employers": emp, "schools": sch, "groups": grp, "interests": ints, "geo": int(geo)},
        })

    out.sort(key=lambda r: r["score"], reverse=True)
    return {
        "data": out[: req.limit],
        "meta": {"model": MODEL, "version": VERSION, "latency_ms": int((time.perf_counter() - started) * 1000)},
    }
