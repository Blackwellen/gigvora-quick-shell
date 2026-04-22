"""Domain 41 — Gigs Browse / Marketplace Discovery analytics.

Operational summaries and prioritisation hints surfaced in the seller
analytics workspace and the marketplace command-centre right rail.
Mirrors apps/ml-python/app/gigs_browse.py at score level so the two
services agree on relative ordering during cross-validation.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any

router = APIRouter(prefix="/gigs-browse", tags=["gigs-browse"])


class MarketSummaryRequest(BaseModel):
    gigs: list[dict[str, Any]] = Field(default_factory=list)


@router.post("/summary")
def summary(req: MarketSummaryRequest):
    active = [g for g in req.gigs if g.get("status") == "active"]
    total = len(active)
    if total == 0:
        return {
            "totals": {"active": 0, "featured": 0, "proSellers": 0, "fastDelivery": 0},
            "averages": {"rating": 0, "priceFromCents": 0},
            "topCategories": [],
            "commentary": ["Catalogue empty — onboard sellers to populate the marketplace."],
        }
    featured = sum(1 for g in active if g.get("isFeatured"))
    pro = sum(1 for g in active if g.get("isProSeller"))
    fast = sum(1 for g in active if g.get("hasFastDelivery"))
    avg_rating = sum(float(g.get("ratingAvg") or 0) for g in active) / total
    avg_price = sum(int(g.get("pricingFromCents") or 0) for g in active) / total

    cats: dict[str, int] = {}
    for g in active:
        c = g.get("category") or "uncategorised"
        cats[c] = cats.get(c, 0) + 1
    top_categories = sorted(
        ({"category": k, "count": v} for k, v in cats.items()),
        key=lambda x: x["count"], reverse=True,
    )[:5]

    commentary: list[str] = []
    if featured / total < 0.05:
        commentary.append("Less than 5% of gigs are featured — rotate editorial picks weekly.")
    if pro / total > 0.3:
        commentary.append("Pro Seller density is high — surface a 'Trusted by enterprises' rail.")
    if avg_rating > 4.5:
        commentary.append("Catalogue quality is strong — relax review-gate thresholds.")
    if not commentary:
        commentary.append("Marketplace mix is balanced across price, delivery, and seller bands.")

    return {
        "totals": {"active": total, "featured": featured, "proSellers": pro, "fastDelivery": fast},
        "averages": {
            "rating": round(avg_rating, 2),
            "priceFromCents": round(avg_price),
        },
        "topCategories": top_categories,
        "commentary": commentary,
    }
