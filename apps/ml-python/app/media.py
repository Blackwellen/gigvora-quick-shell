"""Domain 20 — Media Viewer ML endpoints.

Deterministic, explainable scoring/ranking + lightweight moderation hint.
No external model dependency; safe defaults so the API never breaks.
"""
from __future__ import annotations

import math
import re
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ._obs import payload_guard, track

router = APIRouter(prefix="/media", tags=["media"])

NSFW_PATTERNS = re.compile(r"(nsfw|adult|leak|password|weapon|violence)", re.IGNORECASE)


class ScoreQualityIn(BaseModel):
    assetId: str
    kind: str
    sizeBytes: int = Field(ge=0)
    width: Optional[int] = None
    height: Optional[int] = None
    durationSec: Optional[float] = None
    bitrateKbps: Optional[float] = None


@router.post("/score-quality")
@track("media.score_quality")
def score_quality(body: ScoreQualityIn):
    res_px = (body.width or 0) * (body.height or 0)
    res_score = min(50.0, math.log2(max(2, res_px)) * 2.4)
    size_mb = body.sizeBytes / 1_000_000
    size_penalty = min(20.0, max(0.0, (size_mb - 50) / 4))
    bitrate_score = min(30.0, (body.bitrateKbps or 0) / 200) if body.bitrateKbps else 18.0
    score = max(0, min(100, round(res_score + bitrate_score + 30 - size_penalty)))
    return {
        "assetId": body.assetId,
        "score": score,
        "factors": {
            "resScore": round(res_score, 2),
            "bitrateScore": round(bitrate_score, 2),
            "sizePenalty": round(size_penalty, 2),
        },
        "source": "ml-python",
    }


class GalleryItem(BaseModel):
    id: str
    kind: str
    views: int = 0
    likes: int = 0
    downloads: int = 0


class RankGalleryIn(BaseModel):
    items: List[GalleryItem] = Field(default_factory=list, max_length=500)


@router.post("/rank-gallery")
@track("media.rank_gallery")
def rank_gallery(body: RankGalleryIn):
    payload_guard(body.items, key="items")
    scored = []
    for it in body.items:
        s = it.views * 0.4 + it.likes * 1.6 + it.downloads * 1.1
        if it.kind == "video":
            s += 6
        scored.append((it.id, s))
    scored.sort(key=lambda x: x[1], reverse=True)
    return {
        "items": [{"id": i, "rank": idx + 1, "score": round(s, 2)} for idx, (i, s) in enumerate(scored)],
        "source": "ml-python",
    }


class ModerationHintIn(BaseModel):
    assetId: str
    mimeType: str
    tags: Optional[List[str]] = None
    filename: Optional[str] = None


@router.post("/moderation-hint")
@track("media.moderation_hint")
def moderation_hint(body: ModerationHintIn):
    text = " ".join([body.filename or "", *(body.tags or [])])
    flagged = bool(NSFW_PATTERNS.search(text))
    return {
        "assetId": body.assetId,
        "verdict": "review" if flagged else "clean",
        "confidence": 0.74 if flagged else 0.92,
        "source": "ml-python",
    }
