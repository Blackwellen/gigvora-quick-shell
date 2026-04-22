"""Gigvora ML service: ranking, matching, moderation, recommendations.

Enterprise-grade hardening (Group 1 of the back-fill upgrade):
  • install_observability(app) mounts /metrics and a request-id middleware
  • payload_guard(...) enforces uniform DoS caps on every list endpoint
  • track("<endpoint>") records latency + outcome counters
See `docs/architecture/slo-ml-python.md` for budgets and runbook.
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Any

from ._obs import install_observability, payload_guard, track
from .events import router as events_router
from .agency import router as agency_router
from .search import router as search_router
from .feed import router as feed_router
from .network import router as network_router
from .profiles import router as profiles_router
from .companies import router as companies_router
from .notifications import router as notifications_router
from .groups import router as groups_router
from .trust import router as trust_router
from .calls import router as calls_router
from .booking import router as booking_router
from .media import router as media_router
from .podcasts import router as podcasts_router
from .jobs_browse import router as jobs_browse_router
from .webinars import router as webinars_router
from .jobs_studio import router as jobs_studio_router
from .job_applications import router as job_applications_router
from .recruiter_jobs import router as recruiter_jobs_router
from .customer_service import router as customer_service_router
from .finance_admin import router as finance_admin_router
from .dispute_ops import router as dispute_ops_router
from .moderator_dashboard import router as moderator_dashboard_router
from .trust_safety_ml import router as trust_safety_ml_router
from .ads_ops import router as ads_ops_router
from .verification_compliance import router as verification_compliance_router
from .interview_planning import router as interview_planning_router
from .settings import router as settings_router
from .calendar import router as calendar_router
from .user_dashboard import router as user_dashboard_router
from .client_dashboard import router as client_dashboard_router
from .recruiter_dashboard import router as recruiter_dashboard_router
from .agency_management_dashboard import router as agency_management_dashboard_router
from .enterprise_dashboard import router as enterprise_dashboard_router
from .resource_planning_utilization import router as resource_planning_utilization_router
from .wallet_credits_packages import router as wallet_credits_packages_router
from .billing_invoices_tax import router as billing_invoices_tax_router
from .ads_manager_builder import router as ads_manager_builder_router
from .ads_analytics_performance import router as ads_analytics_performance_router
from .map_views_geo_intel import router as map_views_geo_intel_router
from .enterprise_connect import router as enterprise_connect_router
from .networking_events_groups import router as networking_events_groups_router
from .sales_navigator import router as sales_navigator_router
from .experience_launchpad import router as experience_launchpad_router
from .fraudnet import router as fraudnet_router
from .idverify import router as idverify_router
from .botdetect import router as botdetect_router
from .reviewguard import router as reviewguard_router
from .ml_pipeline_health import router as ml_pipeline_health_router
from .moderation import router as moderation_router
from .registry_router import router as registry_router

app = FastAPI(title="Gigvora ML", version="0.3.0")
install_observability(app)
app.include_router(events_router)
app.include_router(agency_router)
app.include_router(search_router)
app.include_router(feed_router)
app.include_router(network_router)
app.include_router(profiles_router)
app.include_router(companies_router)
app.include_router(notifications_router)
app.include_router(groups_router)
app.include_router(trust_router)
app.include_router(calls_router)
app.include_router(booking_router)
app.include_router(media_router)
app.include_router(podcasts_router)
app.include_router(jobs_browse_router)
app.include_router(webinars_router)
app.include_router(jobs_studio_router)
app.include_router(job_applications_router)
app.include_router(recruiter_jobs_router)
app.include_router(customer_service_router)
app.include_router(finance_admin_router)
app.include_router(dispute_ops_router)
app.include_router(moderator_dashboard_router)
app.include_router(trust_safety_ml_router)
app.include_router(ads_ops_router)
app.include_router(verification_compliance_router)
app.include_router(interview_planning_router)
app.include_router(settings_router)
app.include_router(calendar_router)
app.include_router(user_dashboard_router)
app.include_router(client_dashboard_router)
app.include_router(recruiter_dashboard_router)
app.include_router(agency_management_dashboard_router)
app.include_router(enterprise_dashboard_router)
app.include_router(resource_planning_utilization_router)
app.include_router(wallet_credits_packages_router)
app.include_router(billing_invoices_tax_router)
app.include_router(ads_manager_builder_router)
app.include_router(ads_analytics_performance_router)
app.include_router(map_views_geo_intel_router)
app.include_router(enterprise_connect_router)
app.include_router(networking_events_groups_router)
app.include_router(sales_navigator_router)
app.include_router(experience_launchpad_router)
app.include_router(fraudnet_router)
app.include_router(idverify_router)
app.include_router(botdetect_router)
app.include_router(reviewguard_router)
app.include_router(ml_pipeline_health_router)
app.include_router(moderation_router)
app.include_router(registry_router)


class ScoreRequest(BaseModel):
    candidate: dict[str, Any]
    target: dict[str, Any]


class RankRequest(BaseModel):
    query: dict[str, Any]
    items: list[dict[str, Any]]


class ModerationRequest(BaseModel):
    content: str
    context: dict[str, Any] = {}


@app.get("/health")
def health(): return {"status": "ok", "service": "ml"}


@app.post("/match/score")
def match_score(req: ScoreRequest):
    with track("match.score"):
        # Deterministic fallback: skill-overlap Jaccard. Replace with embedding cosine when models loaded.
        a = set((req.candidate.get("skills") or []))
        b = set((req.target.get("skills") or []))
        score = len(a & b) / max(1, len(a | b)) if (a or b) else 0.0
        return {"score": round(score * 100, 2), "model": "fallback-jaccard"}


@app.post("/rank")
def rank(req: RankRequest):
    with track("rank.legacy"):
        payload_guard(items=req.items)
        # Fallback: score by recency + tag overlap.
        query_tags = set(req.query.get("tags") or [])
        def score(it):
            tags = set(it.get("tags") or [])
            return len(tags & query_tags) + (it.get("recencyBoost", 0))
        ranked = sorted(req.items, key=score, reverse=True)
        return {"ranked": ranked, "model": "fallback-tag-overlap"}


@app.post("/moderate")
def moderate(req: ModerationRequest):
    with track("moderate.legacy"):
        bad = {"spam", "scam", "phishing"}
        flagged = any(w in req.content.lower() for w in bad)
        return {
            "safe": not flagged,
            "category": "spam" if flagged else "safe",
            "confidence": 0.6,
            "model": "fallback-keyword",
        }


# ─────────────────────────────────────────────────────────────────────────────
# Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces
#
# Enterprise-grade ranker:
#   • Vector path: when AGENCY_EMBEDDINGS_BACKEND=open is configured and a
#     sentence-transformers model is mounted into /models, embed query +
#     candidate corpus and rank by cosine similarity (CPU-friendly,
#     ~120MB RAM for the all-MiniLM-L6-v2 path on a 16GB VPS).
#   • Deterministic fallback (this implementation): TF-IDF-style weighted
#     overlap across (specialties, services, industries, languages, values)
#     plus prior signals (verified proofs, rating, recency, accepting flag).
#   • Both paths return identical envelopes so the NestJS adapter can
#     swap backends without caller changes.
# ─────────────────────────────────────────────────────────────────────────────


class AgencyRankRequest(BaseModel):
    model_config = {"extra": "forbid"}
    query: dict[str, Any] = Field(default_factory=dict)
    items: list[dict[str, Any]] = Field(default_factory=list)
    limit: int = Field(default=24, ge=1, le=200)


def _agency_features(a: dict[str, Any]) -> dict[str, set[str] | float | bool]:
    return {
        "specialties":  set((a.get("specialties") or [])),
        "languages":    set((a.get("languages") or [])),
        "engagement":   set((a.get("engagementModels") or [])),
        "industry":     {a.get("industry")} if a.get("industry") else set(),
        "rating":       float(a.get("ratingAvg") or 0),
        "ratingCount":  int(a.get("ratingCount") or 0),
        "verified":     bool(a.get("verified")),
        "accepting":    bool(a.get("acceptingProjects", True)),
        "completed":    int(a.get("completedProjects") or 0),
        "followers":    int(a.get("followerCount") or 0),
    }


def _query_features(q: dict[str, Any]) -> dict[str, set[str] | str | None]:
    return {
        "skills":   set((q.get("skills") or [])),
        "industry": q.get("industry"),
        "language": q.get("language"),
    }


@app.post("/agency/rank")
def agency_rank(req: AgencyRankRequest):
    """Rank agencies for a discovery query. Deterministic + signal-weighted."""
    with track("agency.rank"):
        payload_guard(items=req.items)
        qf = _query_features(req.query)
        out: list[dict[str, Any]] = []
        for a in req.items:
            af = _agency_features(a)
            skill_overlap = len(qf["skills"] & af["specialties"]) / max(1, len(qf["skills"] | af["specialties"])) if (qf["skills"] or af["specialties"]) else 0.0
            industry_match = 1.0 if qf["industry"] and qf["industry"] in af["industry"] else 0.0
            language_match = 1.0 if qf["language"] and qf["language"] in af["languages"] else 0.0
            rating_signal = (af["rating"] / 5.0) * min(1.0, af["ratingCount"] / 20)
            trust_signal  = (1.0 if af["verified"] else 0.0) * 0.6 + min(1.0, af["completed"] / 50) * 0.4
            availability_penalty = 0.0 if af["accepting"] else -0.2
            score = (
                0.35 * skill_overlap +
                0.20 * industry_match +
                0.10 * language_match +
                0.20 * rating_signal +
                0.15 * trust_signal +
                availability_penalty
            )
            out.append({
                "id": a.get("id"), "slug": a.get("slug"), "name": a.get("name"),
                "score": round(max(0.0, min(1.0, score)), 4),
                "matchPct": round(max(0.0, min(1.0, score)) * 100, 1),
                "reason": {
                    "skillOverlap": round(skill_overlap, 3),
                    "industryMatch": industry_match, "languageMatch": language_match,
                    "ratingSignal": round(rating_signal, 3), "trustSignal": round(trust_signal, 3),
                    "accepting": af["accepting"],
                },
            })
        out.sort(key=lambda x: x["score"], reverse=True)
        return {"items": out[: req.limit], "model": "agency-ranker-v1-deterministic"}


class ProofTrustRequest(BaseModel):
    model_config = {"extra": "forbid"}
    proofs: list[dict[str, Any]] = Field(default_factory=list)


@app.post("/agency/proof-trust")
def proof_trust(req: ProofTrustRequest):
    """Score proof bundle quality (0..1). Used by frontend trust widget."""
    with track("agency.prooftrust"):
        payload_guard(items=req.proofs)
        if not req.proofs:
            return {"score": 0.0, "band": "none", "verifiedCount": 0, "total": 0}
        weights = {"security": 0.30, "compliance": 0.25, "certification": 0.20, "partnership": 0.10, "award": 0.10, "press": 0.05}
        score = 0.0
        verified = 0
        for p in req.proofs:
            w = weights.get(p.get("kind"), 0.05)
            v = 1.0 if p.get("verified") else 0.4
            score += w * v
            verified += 1 if p.get("verified") else 0
        score = round(min(1.0, score), 3)
        band = "excellent" if score >= 0.75 else "strong" if score >= 0.5 else "developing" if score >= 0.25 else "starter"
        return {"score": score, "band": band, "verifiedCount": verified, "total": len(req.proofs)}
