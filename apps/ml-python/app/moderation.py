"""FD-12 — Real moderation endpoint backed by the model registry.

Single locked envelope shared with the trust router so the NestJS write-path
guard can call either path interchangeably:

  POST /moderation/text        — classify a single piece of text
  POST /moderation/batch       — classify N texts in one call
  GET  /moderation/health      — model name/version + `loaded`
"""
from __future__ import annotations

import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ._obs import payload_guard, track
from ._registry import REGISTRY, classify_text

router = APIRouter(prefix="/moderation", tags=["moderation"])


class TextIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=120)
    text: str = Field(default="", max_length=8000)
    surface: str = Field(default="generic", max_length=40)


class BatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[TextIn] = Field(default_factory=list, max_length=200)


@router.post("/text")
def text(body: TextIn) -> dict[str, Any]:
    started = time.perf_counter()
    with track("moderation.text"):
        verdict = classify_text(body.text)
        verdict["id"] = body.id
        verdict["surface"] = body.surface
        return {
            "data": verdict,
            "meta": {
                "model": verdict["model"], "version": verdict["version"],
                "latency_ms": int((time.perf_counter() - started) * 1000),
            },
        }


@router.post("/batch")
def batch(body: BatchIn) -> dict[str, Any]:
    payload_guard(items=body.items)
    started = time.perf_counter()
    with track("moderation.batch"):
        out = []
        for it in body.items:
            v = classify_text(it.text)
            v["id"] = it.id; v["surface"] = it.surface
            out.append(v)
        return {
            "data": out,
            "meta": {
                "model": "moderation.text",
                "version": REGISTRY.models.get("moderation.text").version
                            if REGISTRY.has("moderation.text") else "deterministic",
                "latency_ms": int((time.perf_counter() - started) * 1000),
                "count": len(out),
            },
        }


@router.get("/health")
def health() -> dict[str, Any]:
    return {
        "data": {
            "loaded":  REGISTRY.has("moderation.text"),
            "manifest": REGISTRY.manifest(),
        },
        "meta": {"model": "moderation.text", "version": "1.0", "latency_ms": 0},
    }
