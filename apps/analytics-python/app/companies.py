"""Domain 12 — Company Pages analytics: brand health + employer presence."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/companies", tags=["companies"])


class HealthRequest(BaseModel):
    company: dict[str, Any]
    members: list[dict[str, Any]] = []
    locations: list[dict[str, Any]] = []
    links: list[dict[str, Any]] = []
    brand: dict[str, Any] | None = None
    posts: list[dict[str, Any]] = []


def _band(score: float) -> str:
    if score >= 0.8: return "excellent"
    if score >= 0.6: return "strong"
    if score >= 0.4: return "developing"
    return "starter"


@router.post("/health")
def health(req: HealthRequest):
    c = req.company or {}
    suggestions: list[dict[str, str]] = []
    if not c.get("tagline"): suggestions.append({"key": "tagline", "label": "Add a tagline"})
    if not c.get("about") or len(str(c.get("about"))) < 120:
        suggestions.append({"key": "about", "label": "Expand the about section (120+ chars)"})
    if not c.get("logoUrl"): suggestions.append({"key": "logo", "label": "Upload a logo"})
    if not c.get("coverUrl"): suggestions.append({"key": "cover", "label": "Upload a cover image"})
    if len(req.locations) < 1: suggestions.append({"key": "location", "label": "Add at least one location"})
    if len(req.links) < 1: suggestions.append({"key": "links", "label": "Add social or careers links"})
    if not req.brand or not req.brand.get("primaryColor"):
        suggestions.append({"key": "brand", "label": "Configure brand colors"})
    if len(req.posts) < 3: suggestions.append({"key": "posts", "label": "Publish 3+ employer posts"})

    components = {
        "identity": 0.25 * (bool(c.get("logoUrl")) + bool(c.get("coverUrl")) + bool(c.get("tagline")) + bool(c.get("about"))),
        "presence": min(1.0, len(req.locations) / 2 + len(req.links) / 4),
        "team": min(1.0, len([m for m in req.members if m.get("isPublic") is not False]) / 10),
        "activity": min(1.0, len(req.posts) / 8),
        "brand": 1.0 if req.brand and req.brand.get("primaryColor") else 0.3,
    }
    score = round(sum(components.values()) / len(components), 3)
    return {
        "score": score,
        "band": _band(score),
        "components": components,
        "suggestions": suggestions,
        "verifiedBoost": 0.1 if c.get("verified") else 0,
    }


class RankRequest(BaseModel):
    companies: list[dict[str, Any]]


@router.post("/rank")
def rank(req: RankRequest):
    """Deterministic employer-presence ranking for discovery rails."""
    out = []
    for c in req.companies:
        followers = c.get("followerCount", 0)
        employees = c.get("employeeCount", 0)
        roles = c.get("openRolesCount", 0)
        verified = 1 if c.get("verified") else 0
        score = followers * 0.001 + employees * 0.01 + roles * 0.5 + verified * 2
        out.append({"id": c.get("id"), "slug": c.get("slug"), "score": round(score, 3)})
    out.sort(key=lambda x: x["score"], reverse=True)
    return {"items": out}
