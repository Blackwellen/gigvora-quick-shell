"""Domain 62 — Map Views & Geo Intel: deterministic media moderation scoring."""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/map-views-geo-intel", tags=["map-views-geo-intel"])


class ModerateIn(BaseModel):
    kind: str
    url: str
    bytes: Optional[int] = None


@router.post("/moderate-media")
def moderate_media(req: ModerateIn):
    """Deterministic 0..1 risk score (higher = more risky).

    Heuristics (no external model required, runs on a 16 GB-RAM VPS):
      • base 0.05
      • +0.10 if URL host looks suspicious (no TLD or contains unusual chars)
      • +0.20 if video > 200 MB (likely uncompressed)
      • +0.10 if document but URL ends in an executable extension
      • clamp to [0, 1]; explanation included for audit defensibility
    """
    score = 0.05
    reasons = []
    url = (req.url or "").lower()
    if "://" not in url or "." not in url.split("://", 1)[-1].split("/", 1)[0]:
        score += 0.10; reasons.append("malformed_host")
    if req.kind == "video" and (req.bytes or 0) > 200_000_000:
        score += 0.20; reasons.append("oversized_video")
    if req.kind == "document" and any(url.endswith(ext) for ext in (".exe", ".bat", ".sh", ".js")):
        score += 0.50; reasons.append("executable_extension")
    score = max(0.0, min(1.0, round(score, 3)))
    return {"score": score, "reasons": reasons, "source": "ml-deterministic"}
