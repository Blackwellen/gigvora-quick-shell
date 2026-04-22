"""Domain 72 — Ads Ops policy scoring (deterministic, explainable)."""
from __future__ import annotations
import re
from typing import Any, Dict, List
from urllib.parse import urlparse

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ads-ops", tags=["ads-ops"])


class CreativeIn(BaseModel):
    campaignId: str | None = None
    advertiserId: str | None = None
    creativeKind: str = "image"
    headline: str | None = None
    body: str | None = None
    landingUrl: str | None = None
    geos: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


PATTERNS = [
    (re.compile(r"\b(bitcoin\s+doubler|free\s+btc|crypto\s+giveaway)\b", re.I),
     "crypto_scam", "critical", 60),
    (re.compile(r"\b(miracle\s+pill|lose\s+\d{1,3}\s*kg|burn\s+fat\s+fast)\b", re.I),
     "misleading_health", "critical", 50),
    (re.compile(r"\b(guaranteed\s+win|sports?\s+betting|gambling)\b", re.I),
     "gambling", "high", 30),
    (re.compile(r"\b(cbd|cannabis|marijuana)\b", re.I),
     "controlled_substance", "high", 25),
    (re.compile(r"\b(adult|xxx|nsfw)\b", re.I),
     "adult_content", "high", 35),
    (re.compile(r"\b(weapon|firearm|ammo)\b", re.I),
     "weapons", "critical", 40),
]


def _band(score: int) -> str:
    if score >= 80: return "critical"
    if score >= 60: return "high"
    if score >= 35: return "elevated"
    return "normal"


@router.post("/score-creative")
def score_creative(body: CreativeIn) -> Dict[str, Any]:
    text = " ".join([
        body.headline or "", body.body or "", body.landingUrl or "",
        " ".join(body.keywords or []),
    ])
    flags: List[Dict[str, Any]] = []
    reasons: List[str] = []
    score = 10
    for regex, code, sev, weight in PATTERNS:
        if regex.search(text):
            flags.append({"code": code, "severity": sev, "source": "keyword"})
            reasons.append(f"pattern:{code}")
            score += weight
    if body.landingUrl:
        try:
            host = urlparse(body.landingUrl).hostname or ""
            if not re.search(r"\.(com|org|net|io|co|uk|de|fr)$", host, re.I):
                flags.append({"code": "unverified_url", "severity": "high", "source": "url"})
                reasons.append("url_unverified_tld")
                score += 15
        except Exception:
            flags.append({"code": "invalid_url", "severity": "critical", "source": "url"})
            score += 25
    score = min(100, score)
    return {"score": score, "band": _band(score), "flags": flags,
            "reasons": reasons, "model": "ads-ops-policy-v1"}
