"""Domain 06 — Overlays analytics.

Deterministic insights over overlay_sessions and overlay_workflows used by
the operator console and the right-rail "follow-through" hint card. Pure-Python
fallback so the endpoint is safe to call when no ML model is loaded.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/overlays", tags=["overlays"])


class SessionRow(BaseModel):
    surface_key: str
    status: str
    opened_at: float        # epoch seconds
    closed_at: float | None = None


class InsightsRequest(BaseModel):
    sessions: list[SessionRow]


@router.post("/insights")
def insights(req: InsightsRequest):
    """Surface drop-off hotspots: which overlay surfaces are dismissed most often
    relative to completions, and median dwell time when opened."""
    by_surface: dict[str, dict[str, float]] = {}
    for s in req.sessions:
        b = by_surface.setdefault(s.surface_key, {"opened": 0, "completed": 0, "dismissed": 0, "dwell_total": 0.0, "dwell_n": 0})
        b["opened"] += 1
        if s.status in ("completed", "dismissed", "failed", "expired"):
            b[s.status if s.status in b else "dismissed"] = b.get(s.status, 0) + 1
        if s.closed_at and s.opened_at:
            b["dwell_total"] += max(0.0, s.closed_at - s.opened_at)
            b["dwell_n"] += 1

    cards = []
    for surface, b in by_surface.items():
        dismiss_rate = b["dismissed"] / b["opened"] if b["opened"] else 0
        median_dwell = (b["dwell_total"] / b["dwell_n"]) if b["dwell_n"] else 0
        priority = "high" if dismiss_rate > 0.6 and b["opened"] > 5 else "medium" if dismiss_rate > 0.4 else "low"
        cards.append({
            "surface": surface,
            "opened": b["opened"],
            "completed": int(b.get("completed", 0)),
            "dismissed": int(b["dismissed"]),
            "dismissRate": round(dismiss_rate, 3),
            "medianDwellSec": round(median_dwell, 2),
            "priority": priority,
            "hint": _hint(surface, dismiss_rate, median_dwell),
        })
    cards.sort(key=lambda c: (-c["dismissRate"], -c["opened"]))
    return {"cards": cards, "fallback": True}


def _hint(surface: str, dismiss_rate: float, dwell: float) -> str:
    if dismiss_rate > 0.6:
        return f"{surface}: high abandonment — review CTA placement and required-field count."
    if dwell > 60:
        return f"{surface}: long dwell — consider chunking into a wizard."
    if dismiss_rate < 0.1 and dwell < 5:
        return f"{surface}: healthy completion rate."
    return f"{surface}: review opportunities for friction."
