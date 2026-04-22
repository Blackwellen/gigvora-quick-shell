"""Domain 21 — Podcasts analytics endpoint."""
from __future__ import annotations
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/podcasts", tags=["podcasts"])


class TotalsIn(BaseModel):
    shows: int = 0
    episodes: int = 0
    recordings: int = 0
    purchases: int = 0
    totalPlays: int = 0
    revenueCents: int = 0


class InsightsIn(BaseModel):
    totals: TotalsIn
    topShows: list[dict[str, Any]] = []
    recentEpisodes: list[dict[str, Any]] = []


@router.post("/insights")
def insights(payload: InsightsIn) -> dict[str, Any]:
    t = payload.totals
    avg_plays = (t.totalPlays / t.episodes) if t.episodes else 0
    anomalies = []
    if t.recordings and t.episodes == 0:
        anomalies.append({"kind": "recordings_without_publishes", "severity": "warning",
                          "message": f"{t.recordings} recording(s) but no published episodes."})
    if t.episodes and avg_plays < 10:
        anomalies.append({"kind": "low_engagement", "severity": "info",
                          "message": f"Average plays/episode is {avg_plays:.1f}; consider promo or tags."})
    if t.purchases == 0 and t.episodes > 0:
        anomalies.append({"kind": "no_monetisation", "severity": "info",
                          "message": "No purchases yet — try a paid episode or donation prompt."})

    revenue = t.revenueCents
    return {
        "summary": (
            f"{t.shows} shows · {t.episodes} episodes · {t.totalPlays:,} plays "
            f"· avg {avg_plays:.0f} plays/ep · ${revenue/100:.2f} revenue"
        ),
        "anomalies": anomalies,
        "revenueBands": [
            {"band": "subscriptions", "cents": int(revenue * 0.6)},
            {"band": "one-off",       "cents": int(revenue * 0.3)},
            {"band": "donations",     "cents": int(revenue * 0.1)},
        ],
    }
