"""ML for Enterprise Connect & Startup Showcase.

Two endpoints — both deterministic, CPU-only, runnable on a 16 GB-RAM VPS:

  POST /enterprise-connect/partner-match
    Score partner candidates by capability Jaccard + industry/geo match.
    Locked envelope: { items: [...], meta: { model, version, latency_ms } }

  POST /enterprise-connect/startup-rank
    Rank startup showcase entries by traction + growth + recency.
    Locked envelope: { ranked: [...], meta: { model, version, latency_ms } }
"""
from __future__ import annotations
import math
import time
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/enterprise-connect", tags=["enterprise-connect"])


class PartnerMatchIn(BaseModel):
    org: Dict[str, Any] = Field(default_factory=dict)
    candidates: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/partner-match")
def partner_match(body: PartnerMatchIn):
    t0 = time.time()
    me_caps = {str(c).lower() for c in (body.org.get("capabilities") or [])}
    me_ind = (body.org.get("industry") or "").lower()
    me_geo = (body.org.get("hq_country") or body.org.get("hqCountry") or "").lower()

    out: List[Dict[str, Any]] = []
    for c in body.candidates:
        caps = {str(x).lower() for x in (c.get("capabilities") or [])}
        union = me_caps | caps
        jaccard = (len(me_caps & caps) / len(union)) if union else 0.0
        ind = 1.0 if me_ind and (c.get("industry") or "").lower() == me_ind else 0.0
        geo = 1.0 if me_geo and (c.get("hq_country") or c.get("hqCountry") or "").lower() == me_geo else 0.0
        score = round(100 * (0.45 * jaccard + 0.25 * ind + 0.20 * geo + 0.10 * 0.0))
        out.append({
            "id": c.get("id"),
            "score": score,
            "reason": {
                "jaccard": round(jaccard, 3),
                "industryMatch": ind,
                "geoMatch": geo,
                "sharedCapabilities": sorted(me_caps & caps),
            },
        })
    out.sort(key=lambda r: r["score"], reverse=True)
    return {
        "items": out,
        "meta": {"model": "ec-partner-match-v1-deterministic", "version": "1.0.0",
                 "latency_ms": round((time.time() - t0) * 1000, 2)},
    }


class StartupRankIn(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/startup-rank")
def startup_rank(body: StartupRankIn):
    t0 = time.time()
    out: List[Dict[str, Any]] = []
    for s in body.items:
        tr = s.get("traction") or {}
        mrr = float(tr.get("mrrMinor") or tr.get("mrr_minor") or 0)
        growth = float(tr.get("growthMoM") or tr.get("growth_mom") or 0)
        customers = float(tr.get("customers") or 0)
        # bounded contributions with tanh so single huge values don't dominate
        score = round(100 * (
            0.45 * math.tanh(mrr / 500_000_00) +     # 500k MRR saturates
            0.30 * math.tanh(growth) +                # MoM ratio (0..~1)
            0.15 * math.tanh(customers / 1000) +
            0.10 * (1.0 if s.get("featured") else 0.0)
        ))
        out.append({"id": s.get("id"), "org_id": s.get("org_id") or s.get("orgId"), "score": score,
                    "reason": {"mrrMinor": mrr, "growthMoM": growth, "customers": customers,
                               "featured": bool(s.get("featured"))}})
    out.sort(key=lambda r: r["score"], reverse=True)
    return {
        "ranked": out,
        "meta": {"model": "ec-startup-rank-v1-deterministic", "version": "1.0.0",
                 "latency_ms": round((time.time() - t0) * 1000, 2)},
    }
