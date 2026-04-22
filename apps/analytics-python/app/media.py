"""Domain 20 — Media Viewer analytics endpoints.

Operational summaries, top performers, and anomaly hints.
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ._obs import payload_guard, track

router = APIRouter(prefix="/media", tags=["media"])


class MediaItem(BaseModel):
    id: str
    kind: str
    status: str
    views: int = 0
    downloads: int = 0
    likes: int = 0
    comments: int = 0
    sizeBytes: int = 0
    moderation: Optional[str] = "unknown"


class InsightsIn(BaseModel):
    items: List[MediaItem] = Field(default_factory=list, max_length=2000)


@router.post("/insights")
@track("media.insights")
def insights(body: InsightsIn):
    payload_guard(body.items, key="items")
    items = body.items
    by_kind = Counter(i.kind for i in items)
    total_views = sum(i.views for i in items)
    total_downloads = sum(i.downloads for i in items)
    stuck = sum(1 for i in items if i.status == "processing")
    failed = sum(1 for i in items if i.status == "failed")
    review = sum(1 for i in items if i.moderation in ("review", "blocked"))
    anomalies = []
    if stuck >= 3:
        anomalies.append({"code": "processing-backlog", "severity": "warning",
                          "message": f"{stuck} assets stuck in processing."})
    if failed > 0:
        anomalies.append({"code": "transcode-failed", "severity": "critical",
                          "message": f"{failed} transcoding failures need retry."})
    if review > 0:
        anomalies.append({"code": "moderation-review", "severity": "warning",
                          "message": f"{review} assets pending moderator review."})
    top = sorted(items, key=lambda i: i.views + i.likes * 3, reverse=True)[:5]
    return {
        "summary": {
            "total": len(items),
            "byKind": dict(by_kind),
            "totalViews": total_views,
            "totalDownloads": total_downloads,
            "stuckProcessing": stuck,
            "failed": failed,
            "moderationReview": review,
        },
        "topPerformers": [{"id": i.id, "views": i.views, "likes": i.likes} for i in top],
        "anomalies": anomalies,
        "source": "analytics-python",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
