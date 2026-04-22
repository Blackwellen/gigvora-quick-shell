"""Domain 62 — Map Views & Geo Intel insights service."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/map-views-geo-intel", tags=["map-views-geo-intel"])


class InsightsIn(BaseModel):
    owner_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


def _build(signals: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    totals = signals.get("totals") or {}
    places = int(signals.get("places") or 0)
    sig = int(totals.get("signals") or 0)
    conv = int(totals.get("conversions") or 0)

    if places == 0:
        out.append({"id": "no_places", "severity": "info",
                    "title": "No active places yet",
                    "body": "Add a place to start collecting geo signals."})
        return out
    if sig == 0:
        out.append({"id": "no_signals", "severity": "warn",
                    "title": "No location signals captured",
                    "body": "Wire a webhook or SDK to begin ingesting visits."})
        return out
    if conv == 0:
        out.append({"id": "no_conversions", "severity": "warn",
                    "title": "Signals captured but no conversions",
                    "body": "Map the conversion event to your geofences."})
    if sig > 1000 and conv / max(sig, 1) > 0.05:
        out.append({"id": "strong_perf", "severity": "success",
                    "title": f"Conversion rate {conv*100/sig:.1f}% — strong",
                    "body": "Consider expanding nearby geofences."})
    if not out:
        out.append({"id": "healthy", "severity": "success", "title": "Geo telemetry healthy"})
    return out


@router.post("/insights")
def insights(req: InsightsIn):
    return {"insights": _build(req.signals),
            "computed_at": datetime.now(timezone.utc).isoformat()}
