"""Domain 52 — Agency management dashboard ML.

Risk-scores deliverables on a 0-1 scale from status, priority, due-date pressure.
Pure-python heuristic ensures NestJS always has a stable answer.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agency-management-dashboard", tags=["agency-management-dashboard"])

PRIORITY_WEIGHT = {"low": 0.0, "normal": 0.05, "high": 0.15, "urgent": 0.3}
STATUS_WEIGHT = {"todo": 0.05, "in_progress": 0.0, "review": 0.0, "blocked": 0.5, "done": 0.0}


class ScoreDeliverablesIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/score-deliverables")
def score_deliverables(req: ScoreDeliverablesIn):
    now = datetime.now(timezone.utc)
    out: List[Dict[str, Any]] = []
    for it in req.items or []:
        score = 0.0
        score += PRIORITY_WEIGHT.get((it.get("priority") or "normal").lower(), 0.05)
        score += STATUS_WEIGHT.get((it.get("status") or "todo").lower(), 0.05)

        due = it.get("dueAt")
        if due and (it.get("status") or "") != "done":
            try:
                ts = datetime.fromisoformat(str(due).replace("Z", "+00:00"))
                hours = (ts - now).total_seconds() / 3600.0
                if hours < 0:
                    score += min(0.4, abs(hours) / 240.0 + 0.2)
                elif hours < 48:
                    score += 0.15
            except Exception:
                pass

        out.append({"id": it.get("id"), "riskScore": round(min(1.0, max(0.0, score)), 3)})
    return {"scores": out, "model": "amd-deliverable-risk-v1"}


class RankClientsIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/rank-clients")
def rank_clients(req: RankClientsIn):
    out = []
    for it in req.items or []:
        budget = float(it.get("budgetCents") or 0)
        spent = float(it.get("spentCents") or 0)
        health = float(it.get("healthScore") or 50)
        spend_score = min(1.0, budget / 5_000_000)
        burn_penalty = max(0.0, (spent / budget) - 0.85) if budget > 0 else 0.0
        score = round(0.5 * (health / 100.0) + 0.4 * spend_score - 0.3 * burn_penalty, 3)
        out.append({"id": it.get("id"), "score": max(0.0, score)})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": out, "model": "amd-client-priority-v1"}
