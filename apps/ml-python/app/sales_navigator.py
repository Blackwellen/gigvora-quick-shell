"""ML for Sales Navigator.

Deterministic, CPU-only, runnable on a 16 GB-RAM VPS.

Endpoints:
  POST /sales-navigator/lead-score
       Score leads by fit (profile completeness/match) + intent (recent signals).
  POST /sales-navigator/account-rank
       Rank accounts by signal density × strategic fit.
  POST /sales-navigator/smart-leads
       Surface top N leads from a candidate pool by composite score.

Locked envelope: { items, meta: { model, version, latency_ms } }
"""
from __future__ import annotations
import math, time
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/sales-navigator", tags=["sales-navigator"])
VERSION = "sn-ml-v1-deterministic"


def _norm(xs):
    return {str(x).strip().lower() for x in (xs or []) if str(x).strip()}


def _jaccard(a, b):
    if not a and not b: return 0.0
    u = a | b
    return len(a & b) / len(u) if u else 0.0


def _recency_weight(iso: str | None) -> float:
    if not iso: return 0.0
    try:
        t = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        days = max(0.0, (datetime.now(timezone.utc) - t).total_seconds() / 86400.0)
        return 1.0 / math.pow(1.0 + days, 0.5)
    except Exception:
        return 0.0


class IcpProfile(BaseModel):
    industries: List[str] = Field(default_factory=list)
    seniorities: List[str] = Field(default_factory=list)
    function_areas: List[str] = Field(default_factory=list)
    regions: List[str] = Field(default_factory=list)


class LeadIn(BaseModel):
    id: str
    industry: str | None = None
    seniority: str | None = None
    function_area: str | None = None
    region: str | None = None
    title: str | None = None
    has_email: bool = False
    has_linkedin: bool = False
    last_activity_at: str | None = None
    company_signals: List[Dict[str, Any]] = Field(default_factory=list)


class LeadScoreIn(BaseModel):
    icp: IcpProfile = Field(default_factory=IcpProfile)
    leads: List[LeadIn] = Field(default_factory=list)


@router.post("/lead-score")
def lead_score(body: LeadScoreIn):
    t0 = time.time()
    icp_ind = _norm(body.icp.industries)
    icp_sen = _norm(body.icp.seniorities)
    icp_fn = _norm(body.icp.function_areas)
    icp_reg = _norm(body.icp.regions)
    out: List[Dict[str, Any]] = []
    for l in body.leads:
        ind = 1.0 if (l.industry and l.industry.lower() in icp_ind) else 0.0
        sen = 1.0 if (l.seniority and l.seniority.lower() in icp_sen) else 0.0
        fn = 1.0 if (l.function_area and l.function_area.lower() in icp_fn) else 0.0
        reg = 1.0 if (l.region and l.region.lower() in icp_reg) else 0.0
        completeness = (
            (0.3 if l.has_email else 0.0) +
            (0.3 if l.has_linkedin else 0.0) +
            (0.2 if l.title else 0.0) +
            (0.2 if l.industry else 0.0)
        )
        fit = round(100 * (0.30 * ind + 0.25 * sen + 0.20 * fn + 0.10 * reg + 0.15 * completeness))
        # Intent from recent signals on the lead's company
        intent_raw = 0.0
        for s in (l.company_signals or [])[:20]:
            sev = float(s.get("severity") or 0) / 100.0
            intent_raw += sev * _recency_weight(s.get("detected_at") or s.get("detectedAt"))
        # tanh to bound; activity gives small boost
        activity_boost = _recency_weight(l.last_activity_at) * 0.4
        intent = round(100 * math.tanh(intent_raw + activity_boost))
        composite = round(0.6 * fit + 0.4 * intent)
        out.append({
            "id": l.id,
            "fit": fit,
            "intent": intent,
            "score": composite,
            "reason": {
                "industryMatch": ind, "seniorityMatch": sen, "functionMatch": fn,
                "regionMatch": reg, "completeness": round(completeness, 2),
                "signalCount": len(l.company_signals),
            },
        })
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"items": out, "meta": {"model": VERSION, "version": VERSION,
                                    "latency_ms": round((time.time() - t0) * 1000, 2)}}


class AccountIn(BaseModel):
    id: str
    industry: str | None = None
    employee_count: int | None = None
    signals: List[Dict[str, Any]] = Field(default_factory=list)


class AccountRankIn(BaseModel):
    icp: IcpProfile = Field(default_factory=IcpProfile)
    accounts: List[AccountIn] = Field(default_factory=list)


@router.post("/account-rank")
def account_rank(body: AccountRankIn):
    t0 = time.time()
    icp_ind = _norm(body.icp.industries)
    out: List[Dict[str, Any]] = []
    for a in body.accounts:
        ind = 1.0 if (a.industry and a.industry.lower() in icp_ind) else 0.0
        size_fit = math.tanh((a.employee_count or 0) / 1000.0)
        signal_density = 0.0
        for s in (a.signals or [])[:30]:
            sev = float(s.get("severity") or 0) / 100.0
            signal_density += sev * _recency_weight(s.get("detected_at") or s.get("detectedAt"))
        signal_score = math.tanh(signal_density)
        score = round(100 * (0.45 * signal_score + 0.35 * ind + 0.20 * size_fit))
        out.append({"id": a.id, "score": score,
                    "reason": {"industryMatch": ind, "sizeFit": round(size_fit, 2),
                               "signalDensity": round(signal_density, 2),
                               "signalCount": len(a.signals)}})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {"items": out, "meta": {"model": VERSION, "version": VERSION,
                                    "latency_ms": round((time.time() - t0) * 1000, 2)}}


class SmartLeadsIn(BaseModel):
    icp: IcpProfile = Field(default_factory=IcpProfile)
    leads: List[LeadIn] = Field(default_factory=list)
    top_k: int = 25


@router.post("/smart-leads")
def smart_leads(body: SmartLeadsIn):
    inner = lead_score(LeadScoreIn(icp=body.icp, leads=body.leads))
    items = inner["items"][: max(1, min(body.top_k, 100))]
    return {"items": items, "meta": {**inner["meta"], "top_k": body.top_k}}
