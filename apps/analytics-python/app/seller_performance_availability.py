"""Domain 46 — Seller Performance, Capacity, Availability analytics.

Operational summaries, anomaly commentary, and prioritisation hints for the
Seller Availability workbench. Deterministic fallback when inputs absent.
"""
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

router = APIRouter(prefix="/seller-performance", tags=["seller-performance"])


class PerformanceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    seller_id: str = Field(min_length=1, max_length=128)
    orders_completed: int = Field(default=0, ge=0)
    orders_cancelled: int = Field(default=0, ge=0)
    on_time_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    response_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    avg_response_minutes: int = Field(default=0, ge=0)
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    repeat_buyer_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    queue_depth: int = Field(default=0, ge=0)
    max_queue: int = Field(default=5, ge=1)


class CapacityInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    seller_id: str
    active_gigs: int = Field(ge=0)
    paused_gigs: int = Field(ge=0)
    total_queue: int = Field(ge=0)
    max_concurrent_orders: int = Field(ge=0)


@router.post("/summary")
def summary(req: PerformanceInput):
    health = "healthy"
    flags: list[str] = []
    if req.on_time_rate < 0.9:
        health, _ = "at_risk", flags.append("on_time_below_90")
    if req.response_rate < 0.8:
        health, _ = "at_risk", flags.append("response_rate_below_80")
    if req.avg_response_minutes > 240:
        flags.append("slow_response")
    if req.rating < 4.5:
        flags.append("rating_below_threshold")
    utilization = req.queue_depth / max(req.max_queue, 1)
    if utilization >= 1.0:
        health = "overloaded"
        flags.append("queue_full")
    elif utilization >= 0.8:
        flags.append("queue_high")
    cancel_rate = req.orders_cancelled / max(req.orders_completed + req.orders_cancelled, 1)
    if cancel_rate > 0.05:
        flags.append("cancel_rate_high")
    return {
        "seller_id": req.seller_id,
        "health": health,
        "utilization": round(utilization, 4),
        "cancel_rate": round(cancel_rate, 4),
        "flags": flags,
        "recommendations": _recommendations(req, flags),
    }


@router.post("/capacity-hint")
def capacity_hint(req: CapacityInput):
    util = req.total_queue / max(req.max_concurrent_orders, 1)
    posture = "accept_more" if util < 0.6 else "balanced" if util < 0.9 else "throttle"
    return {
        "seller_id": req.seller_id,
        "utilization": round(util, 4),
        "posture": posture,
        "active_gigs": req.active_gigs,
        "paused_gigs": req.paused_gigs,
        "suggestion": _capacity_suggestion(posture, req),
    }


def _recommendations(req: PerformanceInput, flags: list[str]) -> list[dict]:
    recs: list[dict] = []
    if "on_time_below_90" in flags:
        recs.append({"type": "delivery", "title": "Tighten delivery commitments",
                     "detail": "Add 1-day buffer to package delivery times."})
    if "response_rate_below_80" in flags or "slow_response" in flags:
        recs.append({"type": "response_time", "title": "Enable saved replies",
                     "detail": "Use templates to respond within 2h."})
    if "rating_below_threshold" in flags:
        recs.append({"type": "quality", "title": "Add revision rounds",
                     "detail": "Offer a free revision to improve buyer satisfaction."})
    if "queue_full" in flags:
        recs.append({"type": "availability", "title": "Pause low-margin gigs",
                     "detail": "Free capacity for higher-priority orders."})
    return recs


def _capacity_suggestion(posture: str, req: CapacityInput) -> str:
    if posture == "accept_more":
        return f"Capacity available — promote {req.active_gigs} active gigs."
    if posture == "throttle":
        return "Pause lowest-priority gigs or raise prices to throttle demand."
    return "Maintain current pacing; monitor queue depth daily."
