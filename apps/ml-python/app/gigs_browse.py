"""ML ranking for Domain 41 — Gigs Browse / Search / Marketplace Discovery.

Endpoint: POST /gigs-browse/rank
Body: { ownerId?, filters, candidates: [...] }
Returns: { ranked: [...], mode: 'ml' }

Heuristic blend designed to fail closed within 600ms — the NestJS bridge
times out and falls back to deterministic ranking automatically.

Score components:
  • category match               weight 6
  • skills overlap (Jaccard)     weight 5
  • language overlap             weight 2
  • rating (0..5)                weight 4
  • orders (log)                 weight 2
  • Pro Seller flag              +3
  • Featured flag                +4
  • Fast delivery flag           +1.5
  • Recency (decays over 30d)    weight 3
  • Price-fit relative to filter weight 2
"""
from datetime import datetime, timezone
from math import log1p
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any

router = APIRouter()


class GigsRankBody(BaseModel):
    model_config = {"extra": "forbid"}
    ownerId: str | None = None
    filters: dict[str, Any] = Field(default_factory=dict)
    candidates: list[dict[str, Any]] = Field(default_factory=list)


def _age_days(iso: str | None) -> float:
    if not iso: return 30.0
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 86400)
    except Exception:
        return 30.0


def _price_fit(price_cents: int, fmin: int | None, fmax: int | None) -> float:
    if fmin is None and fmax is None:
        return 0.5
    lo = fmin if fmin is not None else 0
    hi = fmax if fmax is not None else max(lo * 2, lo + 5000)
    if price_cents < lo or price_cents > hi:
        return 0.0
    span = max(1, hi - lo)
    centre = (lo + hi) / 2
    return max(0.0, 1.0 - abs(price_cents - centre) / span)


def _score(c: dict[str, Any], filters: dict[str, Any]) -> float:
    cat_match = 1.0 if filters.get("category") and c.get("category") == filters["category"] else 0.0

    f_skills = {s.lower() for s in (filters.get("skills") or [])}
    c_skills = {s.lower() for s in (c.get("skills") or [])}
    sk_overlap = (len(f_skills & c_skills) / max(1, len(f_skills | c_skills))) if (f_skills or c_skills) else 0.0

    f_langs = set(filters.get("languages") or [])
    c_langs = set(c.get("languages") or [])
    lang_overlap = (len(f_langs & c_langs) / max(1, len(f_langs))) if f_langs else 0.0

    rating = float(c.get("ratingAvg") or 0)
    orders = int(c.get("orders") or 0)
    pro = 1.0 if c.get("isProSeller") else 0.0
    feat = 1.0 if c.get("isFeatured") else 0.0
    fast = 1.0 if c.get("fastDelivery") else 0.0
    recency = max(0.0, 1.0 - _age_days(c.get("publishedAt")) / 30.0)
    pf = _price_fit(int(c.get("priceCents") or 0), filters.get("priceMin"), filters.get("priceMax"))

    return (
        6 * cat_match
        + 5 * sk_overlap
        + 2 * lang_overlap
        + 4 * (rating / 5.0)
        + 2 * (log1p(orders) / log1p(1000))
        + 3 * pro
        + 4 * feat
        + 1.5 * fast
        + 3 * recency
        + 2 * pf
    )


@router.post("/gigs-browse/rank")
def rank(body: GigsRankBody):
    if not body.candidates:
        return {"ranked": [], "mode": "ml", "model": "gigs-browse-heuristic-v1"}
    scored = [(c, _score(c, body.filters)) for c in body.candidates]
    scored.sort(key=lambda t: t[1], reverse=True)
    return {
        "ranked": [c for c, _ in scored],
        "mode": "ml",
        "model": "gigs-browse-heuristic-v1",
    }
