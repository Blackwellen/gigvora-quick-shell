"""Domain 15 — Events post-event analytics & host insights.

Enterprise-grade by contract: deterministic, runnable on 16 GB-RAM VPS, locked
envelope. Component breakdowns make every score explainable to an operator.
"""
from datetime import datetime
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/events", tags=["events-analytics"])


class HealthRequest(BaseModel):
    event: dict[str, Any]
    rsvps: list[dict[str, Any]] = []
    checkins: list[dict[str, Any]] = []
    feedback: list[dict[str, Any]] = []


def _band(s: float) -> str:
    if s >= 0.8: return "excellent"
    if s >= 0.6: return "healthy"
    if s >= 0.4: return "developing"
    return "at_risk"


@router.post("/health")
def health(req: HealthRequest):
    e = req.event or {}
    capacity = int(e.get("capacity") or 0)
    going = sum(1 for r in req.rsvps if r.get("status") == "going")
    attended = sum(1 for r in req.rsvps if r.get("status") == "attended")
    no_show = sum(1 for r in req.rsvps if r.get("status") == "no_show")
    expected = max(1, going + attended + no_show)
    ratings = [int(f.get("rating") or 0) for f in req.feedback if f.get("rating")]
    nps_scores = [int(f.get("npsLikely")) for f in req.feedback if isinstance(f.get("npsLikely"), int)]

    components = {
        "fill_rate":     min(1.0, (going + attended) / capacity) if capacity else min(1.0, (going + attended) / 50),
        "attendance":    attended / expected,
        "no_show_inv":   max(0.0, 1.0 - (no_show / expected)),
        "satisfaction":  (sum(ratings) / len(ratings) / 5) if ratings else 0.5,
        "feedback_rate": min(1.0, len(req.feedback) / max(1, attended)),
    }
    score = round(sum(components.values()) / len(components), 3)
    nps = None
    if nps_scores:
        nps = round((sum(1 for n in nps_scores if n >= 9) - sum(1 for n in nps_scores if n <= 6)) / len(nps_scores) * 100)

    suggestions: list[dict[str, str]] = []
    if components["attendance"] < 0.6:    suggestions.append({"key": "attendance",    "label": "Send a 24h-before reminder to lift attendance"})
    if components["no_show_inv"] < 0.7:   suggestions.append({"key": "no_show",       "label": f"{no_show} no-shows — consider a deposit or waitlist promotion"})
    if components["satisfaction"] < 0.7:  suggestions.append({"key": "satisfaction",  "label": "Avg rating below 3.5/5 — review session pacing"})
    if components["feedback_rate"] < 0.3: suggestions.append({"key": "feedback_rate", "label": "Few responses — auto-prompt feedback at session end"})
    if not suggestions:                   suggestions.append({"key": "ok",            "label": "Healthy event — replicate this format"})

    return {
        "score": score,
        "band":  _band(score),
        "components": {k: round(v, 3) for k, v in components.items()},
        "nps":   nps,
        "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else None,
        "suggestions": suggestions,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


class ForecastRequest(BaseModel):
    event: dict[str, Any]
    historical_fill_rates: list[float] = []   # 0..1 from past similar events


@router.post("/forecast")
def forecast(req: ForecastRequest):
    """Deterministic attendance forecast: capacity × blended fill rate, 80% CI."""
    cap = int(req.event.get("capacity") or 0) or 100
    rsvps = int(req.event.get("rsvpCount") or 0)
    base = sum(req.historical_fill_rates) / len(req.historical_fill_rates) if req.historical_fill_rates else 0.65
    # blend: 60% historical fill × 40% current rsvp ratio
    current_ratio = min(1.0, rsvps / cap)
    expected_fill = round(0.6 * base + 0.4 * current_ratio, 3)
    expected_attendance = round(cap * expected_fill)
    # 80% CI proxy: ±15% spread when little history, ±8% with 5+ samples
    spread = 0.15 if len(req.historical_fill_rates) < 5 else 0.08
    return {
        "capacity": cap,
        "expected_fill": expected_fill,
        "expected_attendance": expected_attendance,
        "ci_low":  max(0, round(expected_attendance * (1 - spread))),
        "ci_high": min(cap, round(expected_attendance * (1 + spread))),
        "model": "events-forecast-v1-deterministic",
    }
