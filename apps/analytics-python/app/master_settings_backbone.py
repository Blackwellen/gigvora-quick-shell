"""FD-17 master settings — deterministic insights endpoint.

Surfaces:
  POST /master-settings/insights
    Input  : { entries: [...], pendingCount, kpis: [...], killSwitches: [...] }
    Output : { insights: [{ id, severity, title }], computedAt }

Deterministic, no external models. The NestJS service mirrors this logic so
the surface never blanks if analytics is unreachable.
"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal

router = APIRouter(prefix="/master-settings", tags=["master-settings"])


class InsightsRequest(BaseModel):
    entries: List[Dict[str, Any]] = Field(default_factory=list)
    pending_count: int = 0
    kpis: List[Dict[str, Any]] = Field(default_factory=list)
    kill_switches: List[Dict[str, Any]] = Field(default_factory=list)
    accounts: List[Dict[str, Any]] = Field(default_factory=list)


class Insight(BaseModel):
    id: str
    severity: Literal["success", "info", "warn", "critical"]
    title: str


class InsightsResponse(BaseModel):
    insights: List[Insight]
    computed_at: str


@router.post("/insights", response_model=InsightsResponse)
def insights(req: InsightsRequest) -> InsightsResponse:
    out: List[Insight] = []

    # Two-person backlog
    if req.pending_count >= 5:
        out.append(Insight(id="pending_backlog", severity="warn",
                           title=f"{req.pending_count} settings changes awaiting second approver"))
    elif req.pending_count == 0:
        out.append(Insight(id="pending_clear", severity="success",
                           title="No settings changes awaiting approval"))

    # Active kill switches
    active_kills = [k for k in req.kill_switches if k.get("active")]
    if active_kills:
        names = ", ".join(sorted({k.get("domain", "?") for k in active_kills}))
        out.append(Insight(id="kill_active", severity="critical",
                           title=f"Kill-switches active: {names}"))

    # Frozen accounts
    frozen = [a for a in req.accounts if a.get("status") == "frozen"]
    if frozen:
        out.append(Insight(id="accounts_frozen", severity="warn",
                           title=f"{len(frozen)} internal admin account(s) frozen"))

    # KPI red bands
    red_kpis = [k for k in req.kpis if k.get("status") == "red"]
    if red_kpis:
        out.append(Insight(id="kpi_red", severity="warn",
                           title=f"{len(red_kpis)} KPI(s) breaching red threshold"))

    # Secret hygiene — duplicate fingerprints
    fps: Dict[str, int] = {}
    for e in req.entries:
        fp = e.get("secretFingerprint")
        if fp:
            fps[fp] = fps.get(fp, 0) + 1
    duplicates = sum(1 for v in fps.values() if v > 1)
    if duplicates:
        out.append(Insight(id="secret_dupes", severity="warn",
                           title=f"{duplicates} duplicate secret fingerprint(s) detected"))

    return InsightsResponse(insights=out, computed_at=datetime.now(timezone.utc).isoformat())
