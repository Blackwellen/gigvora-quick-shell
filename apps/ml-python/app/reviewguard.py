"""ReviewGuard v2.x — deterministic review-manipulation detector.

Looks at a cluster of reviews (typically reviews on a single seller or a
suspected reviewer ring) and returns a manipulation likelihood with
explainable components.

Inputs:
  - review_count, avg_rating, rating_variance
  - same_ip_pct (0..1), reviewer_account_age_days_avg
  - text_similarity_avg (0..1, MinHash/Jaccard precomputed by NestJS)
  - cross_review_ratio (0..1, % of reviewers who also got reviewed BY the seller)
  - burstiness (max reviews in any 1h window / total)
"""
from __future__ import annotations
from time import perf_counter
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/reviewguard", tags=["reviewguard"])
MODEL = "ReviewGuard"
VERSION = "2.1.0"


class ReviewClusterFeatures(BaseModel):
    cluster_id: str
    review_count: int = 0
    avg_rating: float = 0.0
    rating_variance: float = 0.0
    same_ip_pct: float = 0.0
    reviewer_account_age_days_avg: float = 365.0
    text_similarity_avg: float = 0.0
    cross_review_ratio: float = 0.0
    burstiness: float = 0.0


def _band(score: float) -> str:
    if score >= 0.85: return "critical"
    if score >= 0.65: return "high"
    if score >= 0.4: return "medium"
    return "low"


@router.post("/score")
def score(body: ReviewClusterFeatures) -> Dict[str, Any]:
    t0 = perf_counter()
    comp: List[Dict[str, Any]] = []
    s = 0.0

    # Five-star clustering
    five_star = 1.0 if body.avg_rating >= 4.85 and body.rating_variance < 0.1 else 0.0
    s += 0.18 * five_star
    comp.append({"k": "five_star_cluster", "raw": {"avg": body.avg_rating, "var": body.rating_variance}, "weighted": round(0.18 * five_star, 3)})

    s += 0.20 * max(0.0, min(1.0, body.same_ip_pct))
    comp.append({"k": "same_ip_pct", "raw": body.same_ip_pct, "weighted": round(0.20 * body.same_ip_pct, 3)})

    young = 1.0 if body.reviewer_account_age_days_avg < 30 else (0.5 if body.reviewer_account_age_days_avg < 90 else 0.0)
    s += 0.12 * young
    comp.append({"k": "reviewer_account_age_days_avg", "raw": body.reviewer_account_age_days_avg, "weighted": round(0.12 * young, 3)})

    s += 0.20 * max(0.0, min(1.0, body.text_similarity_avg))
    comp.append({"k": "text_similarity_avg", "raw": body.text_similarity_avg, "weighted": round(0.20 * body.text_similarity_avg, 3)})

    s += 0.15 * max(0.0, min(1.0, body.cross_review_ratio))
    comp.append({"k": "cross_review_ratio", "raw": body.cross_review_ratio, "weighted": round(0.15 * body.cross_review_ratio, 3)})

    s += 0.10 * max(0.0, min(1.0, body.burstiness))
    comp.append({"k": "burstiness", "raw": body.burstiness, "weighted": round(0.10 * body.burstiness, 3)})

    sample_pen = 0.05 if body.review_count < 5 else 0.0
    s += sample_pen
    comp.append({"k": "small_sample_penalty", "raw": body.review_count, "weighted": round(sample_pen, 3)})

    score_v = round(min(1.0, s), 4)
    return {
        "data": {
            "cluster_id": body.cluster_id,
            "score": score_v,
            "band": _band(score_v),
            "flag": "REVIEW_RING" if score_v >= 0.85 else ("MANIPULATION_LIKELY" if score_v >= 0.65 else "OK"),
            "components": comp,
            "reason": [c["k"] for c in sorted(comp, key=lambda c: -c["weighted"])[:3]],
        },
        "meta": {"model": f"{MODEL}-deterministic", "version": VERSION,
                 "latency_ms": round((perf_counter() - t0) * 1000, 2)},
    }
