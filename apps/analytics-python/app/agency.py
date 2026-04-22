"""Domain 13 — Agency Pages analytics: presence health, anomaly hints, prioritisation.

Enterprise-grade by contract: deterministic outputs that an operator can defend
in a Trust & Safety review, runnable on a 16 GB-RAM VPS with no GPU/heavy deps.
The shape is locked so the NestJS adapter can substitute a heavier predictive
model later without changing callers.
"""
from datetime import datetime
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/agency", tags=["agency-analytics"])


class PresenceRequest(BaseModel):
    agency: dict[str, Any]
    services: list[dict[str, Any]] = []
    team: list[dict[str, Any]] = []
    case_studies: list[dict[str, Any]] = []
    proofs: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []


def _band(score: float) -> str:
    if score >= 0.8: return "excellent"
    if score >= 0.6: return "strong"
    if score >= 0.4: return "developing"
    return "starter"


@router.post("/presence")
def presence(req: PresenceRequest):
    """Score agency presence across 6 components and emit prioritised next steps."""
    a = req.agency or {}
    suggestions: list[dict[str, str]] = []
    if not a.get("tagline"):                                      suggestions.append({"key": "tagline", "label": "Add a tagline"})
    if not a.get("about") or len(str(a.get("about"))) < 200:      suggestions.append({"key": "about", "label": "Expand the About section (200+ chars)"})
    if not a.get("logoUrl"):                                      suggestions.append({"key": "logo", "label": "Upload a logo"})
    if not a.get("coverUrl"):                                     suggestions.append({"key": "cover", "label": "Upload a cover image"})
    if len(req.services) < 3:                                     suggestions.append({"key": "services", "label": "Publish 3+ services"})
    if len(req.team) < 3:                                         suggestions.append({"key": "team", "label": "Add 3+ team members"})
    if len([c for c in req.case_studies if c.get("status") == "published"]) < 2:
        suggestions.append({"key": "case_studies", "label": "Publish 2+ case studies"})
    if len(req.proofs) < 1:                                       suggestions.append({"key": "proofs", "label": "Add at least one verified proof (cert / award / partnership)"})
    if len(req.reviews) < 5:                                      suggestions.append({"key": "reviews", "label": "Collect 5+ reviews from past clients"})

    components = {
        "identity":    0.25 * (bool(a.get("logoUrl")) + bool(a.get("coverUrl")) + bool(a.get("tagline")) + bool(a.get("about"))),
        "services":    min(1.0, len([s for s in req.services if s.get("status") == "active"]) / 5),
        "team":        min(1.0, len(req.team) / 8),
        "case_studies":min(1.0, len([c for c in req.case_studies if c.get("status") == "published"]) / 4),
        "proofs":      min(1.0, sum(1 for p in req.proofs if p.get("verified")) / 4 + sum(1 for p in req.proofs if not p.get("verified")) / 12),
        "reviews":     min(1.0, len(req.reviews) / 12),
    }
    score = round(sum(components.values()) / len(components), 3)
    return {
        "score": score,
        "band": _band(score),
        "components": {k: round(v, 3) for k, v in components.items()},
        "suggestions": suggestions,
        "verifiedBoost": 0.1 if a.get("verified") else 0,
    }


class InsightRequest(BaseModel):
    summary: dict[str, Any]              # output of NestJS svc.summary(id)
    trend: list[float] = []              # last-30d daily views, oldest first
    inquiry_trend: list[float] = []      # last-30d daily inquiries, oldest first


@router.post("/insights")
def insights(req: InsightRequest):
    s = req.summary or {}
    cards: list[dict[str, Any]] = []

    # views anomaly
    if len(req.trend) >= 14:
        baseline = sum(req.trend[:-7]) / max(1, len(req.trend) - 7)
        recent   = sum(req.trend[-7:]) / 7
        if baseline > 0 and recent > baseline * 1.5:
            cards.append({"id": "views.surge", "severity": "info",
                          "title": "Page views surged",
                          "body": f"Last 7-day views ({recent:.0f}/d) are {round(recent/baseline*100)}% of the prior baseline."})
        elif baseline > 0 and recent < baseline * 0.5:
            cards.append({"id": "views.drop", "severity": "warning",
                          "title": "Page views dropped",
                          "body": "Recent views are running well under your prior baseline. Check service titles and hero copy."})

    # conversion
    conv = float(s.get("conversion") or 0)
    if conv < 1.5 and float(s.get("views30d") or 0) > 200:
        cards.append({"id": "conv.low", "severity": "warning",
                      "title": "Low inquiry conversion",
                      "body": "Strong traffic but few inquiries. Add a primary CTA and tighten service descriptions."})

    # trust/proof gap
    if int(s.get("proofTotal") or 0) < 2:
        cards.append({"id": "proof.gap", "severity": "info",
                      "title": "Strengthen public proof",
                      "body": "Add at least two verified proofs (security cert, award, or partnership) to lift trust signals."})

    if not cards:
        cards.append({"id": "ok", "severity": "info", "title": "Healthy presence",
                      "body": "No anomalies in the last window — keep publishing case studies and collecting reviews."})

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "cards": cards,
        "prioritised_routes": ["/agency/dashboard", "/agency/dashboard?tab=case-studies", "/agency/dashboard?tab=reviews"],
    }
