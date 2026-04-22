"""Domain 08 — Settings ML helpers.

Two endpoints:
  POST /settings/notification-channel-rank   -> rank notification channels for a user
  POST /settings/locale-suggest              -> suggest locale + timezone from signals

Deterministic, dependency-free fallback so the API never blanks. The Nest
bridge in apps/api-nest/src/modules/settings/settings.ml.service.ts (created
on demand) calls these with a 1.5s timeout and falls back to a local heuristic.
"""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any

router = APIRouter(prefix="/settings", tags=["settings"])


class ChannelRankRequest(BaseModel):
    identity_id: str
    timezone: str = "UTC"
    quiet_hours_start: int | None = Field(default=None, ge=0, le=23)
    quiet_hours_end:   int | None = Field(default=None, ge=0, le=23)
    last_open_minutes: Dict[str, int] = Field(default_factory=dict)  # {"email": 120, "push": 5, "sms": 600}
    open_rate_30d:     Dict[str, float] = Field(default_factory=dict)


class ChannelRankResponse(BaseModel):
    ranking: List[Dict[str, Any]]


@router.post("/notification-channel-rank", response_model=ChannelRankResponse)
def rank_channels(req: ChannelRankRequest) -> ChannelRankResponse:
    channels = ["push", "in_app", "email", "sms"]
    scored = []
    for ch in channels:
        recency = req.last_open_minutes.get(ch, 1440)
        recency_score = max(0.0, 1.0 - min(recency, 1440) / 1440.0)
        rate_score = min(req.open_rate_30d.get(ch, 0.0), 1.0)
        # Push beats email in tie-breaker; SMS only when both other rates are very high.
        weight = {"push": 0.45, "in_app": 0.25, "email": 0.2, "sms": 0.1}[ch]
        score = round(0.55 * rate_score + 0.35 * recency_score + 0.10 * weight, 4)
        scored.append({"channel": ch, "score": score, "components": {
            "rate_score": rate_score, "recency_score": recency_score, "weight": weight,
        }})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return ChannelRankResponse(ranking=scored)


class LocaleSuggestRequest(BaseModel):
    accept_language: str | None = None
    ip_country: str | None = None
    detected_timezone: str | None = None


class LocaleSuggestResponse(BaseModel):
    locale: str
    timezone: str
    confidence: float


_COUNTRY_LOCALE = {
    "GB": ("en-GB", "Europe/London"),
    "US": ("en-US", "America/New_York"),
    "FR": ("fr-FR", "Europe/Paris"),
    "DE": ("de-DE", "Europe/Berlin"),
    "ES": ("es-ES", "Europe/Madrid"),
    "BR": ("pt-BR", "America/Sao_Paulo"),
    "JP": ("ja-JP", "Asia/Tokyo"),
    "SG": ("en-SG", "Asia/Singapore"),
}


@router.post("/locale-suggest", response_model=LocaleSuggestResponse)
def suggest_locale(req: LocaleSuggestRequest) -> LocaleSuggestResponse:
    if req.accept_language:
        primary = req.accept_language.split(",")[0].strip()
        if primary:
            tz = req.detected_timezone or "UTC"
            return LocaleSuggestResponse(locale=primary, timezone=tz, confidence=0.85)
    if req.ip_country and req.ip_country.upper() in _COUNTRY_LOCALE:
        loc, tz = _COUNTRY_LOCALE[req.ip_country.upper()]
        return LocaleSuggestResponse(locale=loc, timezone=req.detected_timezone or tz, confidence=0.7)
    return LocaleSuggestResponse(locale="en-GB", timezone=req.detected_timezone or "UTC", confidence=0.4)
