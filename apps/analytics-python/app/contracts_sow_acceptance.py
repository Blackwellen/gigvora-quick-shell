"""D36 analytics router — Contracts, SoW, Terms Acceptance, signing funnel.

Pure in-process aggregation. Mirrors the D35 pattern: deterministic seed,
no external store, friendly Pydantic surface for the dashboard layer.
"""
from __future__ import annotations
import statistics
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/v1/contracts-sow-acceptance", tags=["contracts-sow-acceptance"])


class ContractInsights(BaseModel):
    model_config = ConfigDict(extra="forbid")
    draft: int = 0
    sent: int = 0
    partially_signed: int = Field(0, alias="partiallySigned")
    signed: int = 0
    active: int = 0
    rejected: int = 0
    cancelled: int = 0
    expired: int = 0
    superseded: int = 0
    total: int = 0
    avg_time_to_sign_hours: float = Field(0.0, alias="avgTimeToSignHours")
    median_time_to_sign_hours: float = Field(0.0, alias="medianTimeToSignHours")
    sign_through_rate_pct: float = Field(0.0, alias="signThroughRatePct")
    integrity_ok_pct: float = Field(100.0, alias="integrityOkPct")
    mode: str = "fallback"


_SEED = [
    {"status": "active",          "ttsh": 4.5},
    {"status": "active",          "ttsh": 6.1},
    {"status": "signed",          "ttsh": 3.0},
    {"status": "partially-signed","ttsh": None},
    {"status": "sent",            "ttsh": None},
    {"status": "rejected",        "ttsh": None},
]


def _bucket(rows):
    out = {"draft": 0, "sent": 0, "partially-signed": 0, "signed": 0, "active": 0, "rejected": 0, "cancelled": 0, "expired": 0, "superseded": 0}
    for r in rows:
        s = r.get("status", "draft")
        if s in out:
            out[s] += 1
    return out


@router.get("/insights", response_model=ContractInsights, response_model_by_alias=True)
async def insights(project_id: str | None = None):
    rows = _SEED
    b = _bucket(rows)
    total = len(rows)
    closed = sum(1 for r in rows if r["status"] in {"active", "signed"})
    durations = [r["ttsh"] for r in rows if r["ttsh"] is not None]
    return ContractInsights(
        draft=b["draft"],
        sent=b["sent"],
        partiallySigned=b["partially-signed"],
        signed=b["signed"],
        active=b["active"],
        rejected=b["rejected"],
        cancelled=b["cancelled"],
        expired=b["expired"],
        superseded=b["superseded"],
        total=total,
        avgTimeToSignHours=round(sum(durations) / len(durations), 2) if durations else 0.0,
        medianTimeToSignHours=round(statistics.median(durations), 2) if durations else 0.0,
        signThroughRatePct=round((closed / total) * 100, 1) if total else 0.0,
        integrityOkPct=100.0,
        mode="seeded",
    )
