"""ML for Domain 25 — Job Application Flow.

POST /job-applications/score      — quality + match score
POST /job-applications/moderate   — risk flags
POST /job-applications/summarise  — recruiter-facing 3-line summary

600ms budget on the Nest side; deterministic fallback there if we're slow.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class ScoreBody(BaseModel):
    responses: dict[str, Any] = {}
    attachments: list[dict[str, Any]] = []
    jobContext: dict[str, Any] = {}


@router.post("/job-applications/score")
def score(body: ScoreBody):
    r = body.responses or {}
    s = 40
    if r.get("fullName"): s += 6
    if r.get("email") and "@" in str(r["email"]): s += 6
    if r.get("coverLetter") and len(str(r["coverLetter"])) >= 200: s += 18
    if r.get("linkedin") and "linkedin.com" in str(r["linkedin"]): s += 8
    if any(a.get("key") == "cv" for a in (body.attachments or [])): s += 14
    if r.get("salaryExpectation"): s += 4
    s = min(100, s)
    skills = set(map(str.lower, body.jobContext.get("skills") or []))
    candidate_blob = " ".join(str(v).lower() for v in r.values())
    overlap = sum(1 for sk in skills if sk in candidate_blob)
    match = min(100, s - 6 + overlap * 4)
    return {"qualityScore": s, "matchScore": max(0, match)}


class ModBody(BaseModel):
    responses: dict[str, Any] = {}


@router.post("/job-applications/moderate")
def moderate(body: ModBody):
    text = " ".join(str(v) for v in body.responses.values()).lower()
    flags: list[str] = []
    import re
    if re.search(r"\b\d{9,}\b", text): flags.append("possible_id_number")
    if "bit.ly" in text or "tinyurl" in text: flags.append("shortened_link")
    if "hireme" in text or "please please" in text: flags.append("low_signal_language")
    risk = 5 if not flags else min(100, 30 + len(flags) * 12)
    return {"risk": risk, "flags": flags}


class SumBody(BaseModel):
    responses: dict[str, Any] = {}


@router.post("/job-applications/summarise")
def summarise(body: SumBody):
    cl = str((body.responses or {}).get("coverLetter") or "").strip()
    if not cl:
        return {"summary": "No cover letter provided."}
    snippet = cl[:280]
    if len(cl) > 280:
        snippet += "…"
    return {"summary": snippet}
