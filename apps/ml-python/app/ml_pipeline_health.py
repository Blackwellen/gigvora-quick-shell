"""ML Pipeline Health — uniform `/ml/pipeline-health` endpoint that powers the
Trust & Safety + Moderator dashboards' "ML Pipeline Health" cards.

Computes per-model uptime / precision / recall / latency_p95 from the most
recent N model_performance rows the NestJS bridge POSTs in (it pulls them
from the `ml_model_performance` Lovable Cloud table). Deterministic — no
external scoring, just aggregation + banding.
"""
from __future__ import annotations
from time import perf_counter
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ml", tags=["ml-pipeline-health"])


class ModelObservation(BaseModel):
    model: str
    version: str
    precision: float
    recall: float
    latency_p95_ms: int
    uptime_pct: float
    sampled_at: str


class HealthIn(BaseModel):
    observations: List[ModelObservation] = Field(default_factory=list)


def _avg(xs: List[float]) -> float:
    return round(sum(xs) / len(xs), 4) if xs else 0.0


def _band(p: float, r: float, up: float) -> str:
    if up < 0.95 or p < 0.7 or r < 0.6: return "red"
    if up < 0.99 or p < 0.85 or r < 0.8: return "amber"
    return "green"


@router.post("/pipeline-health")
def pipeline_health(body: HealthIn) -> Dict[str, Any]:
    t0 = perf_counter()
    by_model: Dict[str, List[ModelObservation]] = {}
    for o in body.observations:
        by_model.setdefault(o.model, []).append(o)

    rows = []
    for model, obs in sorted(by_model.items()):
        p = _avg([o.precision for o in obs])
        r = _avg([o.recall for o in obs])
        up = _avg([o.uptime_pct for o in obs])
        lat = int(_avg([float(o.latency_p95_ms) for o in obs]))
        rows.append({
            "model": model,
            "version": obs[-1].version,
            "precision": p,
            "recall": r,
            "uptime_pct": up,
            "latency_p95_ms": lat,
            "samples": len(obs),
            "band": _band(p, r, up),
        })
    overall = {
        "uptime_pct": _avg([row["uptime_pct"] for row in rows]),
        "precision": _avg([row["precision"] for row in rows]),
        "recall": _avg([row["recall"] for row in rows]),
        "models": len(rows),
    }
    return {
        "data": {"models": rows, "overall": overall},
        "meta": {"model": "pipeline-health-deterministic", "version": "1.0.0",
                 "latency_ms": round((perf_counter() - t0) * 1000, 2)},
    }
