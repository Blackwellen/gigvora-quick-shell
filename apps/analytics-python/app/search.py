"""Domain 05 — Search analytics & lightweight semantic re-ranking.

Two endpoints:
  POST /search/insights  — operational summaries: zero-result queries, long-tail,
                           top clicked, drop-off candidates. Deterministic.
  POST /search/rerank    — optional semantic boost. Uses token Jaccard overlap as
                           a deterministic stand-in so the contract is stable
                           even when no embedding model is loaded.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/search", tags=["search"])


class HistoryRow(BaseModel):
    query: str
    result_count: int = Field(ge=0)
    clicks: int = 0


class InsightInput(BaseModel):
    rows: List[HistoryRow] = []


class InsightOutput(BaseModel):
    zeroResults: List[str]
    topClicked: List[str]
    underperforming: List[str]
    summary: str


@router.post("/insights", response_model=InsightOutput)
def insights(inp: InsightInput) -> InsightOutput:
    zero = [r.query for r in inp.rows if r.result_count == 0][:10]
    clicked = sorted([r for r in inp.rows if r.clicks > 0], key=lambda r: -r.clicks)
    top = [r.query for r in clicked[:10]]
    under = [r.query for r in inp.rows if r.result_count > 0 and r.clicks == 0][:10]
    summary = (
        f"{len(zero)} zero-result queries, {len(top)} popular, {len(under)} underperforming"
        if inp.rows else "No search history yet."
    )
    return InsightOutput(zeroResults=zero, topClicked=top, underperforming=under, summary=summary)


class RerankItem(BaseModel):
    id: str
    title: str
    body: str = ""
    rank: float = 0.0


class RerankInput(BaseModel):
    query: str
    items: List[RerankItem]


class RerankOutput(BaseModel):
    items: List[RerankItem]
    model: str


def _jaccard(a: str, b: str) -> float:
    sa = set(a.lower().split())
    sb = set(b.lower().split())
    if not sa or not sb: return 0.0
    return len(sa & sb) / len(sa | sb)


@router.post("/rerank", response_model=RerankOutput)
def rerank(inp: RerankInput) -> RerankOutput:
    scored = []
    for it in inp.items:
        sem = _jaccard(inp.query, f"{it.title} {it.body}")
        boosted = it.rank * 0.6 + sem * 0.4
        scored.append((boosted, RerankItem(id=it.id, title=it.title, body=it.body, rank=boosted)))
    scored.sort(key=lambda t: -t[0])
    return RerankOutput(items=[it for _, it in scored], model="jaccard-fallback")
