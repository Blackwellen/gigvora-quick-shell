"""
Shared observability + safety primitives for the Gigvora Analytics service.

Mirrors `apps/ml-python/app/_obs.py` so both Python services expose the same
operational surface (Prometheus /metrics, JSON access log, request-id, payload
guard, latency tracker). Kept as a sibling copy rather than a shared package
to keep the two services independently deployable.
"""
from __future__ import annotations

import logging
import os
import time
import uuid
from contextlib import contextmanager
from functools import wraps
from typing import Callable, Iterable

import structlog
from fastapi import FastAPI, HTTPException, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
)

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(message)s")
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)
log = structlog.get_logger("gigvora.analytics")

REGISTRY = CollectorRegistry(auto_describe=True)

REQS = Counter(
    "analytics_requests_total",
    "Total analytics requests by endpoint and outcome.",
    labelnames=("endpoint", "outcome"),
    registry=REGISTRY,
)

LAT = Histogram(
    "analytics_request_latency_seconds",
    "Per-endpoint latency histogram.",
    labelnames=("endpoint",),
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    registry=REGISTRY,
)

FALLBACKS = Counter(
    "analytics_fallbacks_total",
    "Number of times an endpoint chose a deterministic fallback path.",
    labelnames=("endpoint",),
    registry=REGISTRY,
)

DEFAULT_MAX_BODY_BYTES = 50_000
DEFAULT_MAX_ITEMS = 500


def _max_body_bytes() -> int:
    return int(os.environ.get("ANALYTICS_MAX_BODY_BYTES", DEFAULT_MAX_BODY_BYTES))


def _max_items() -> int:
    return int(os.environ.get("ANALYTICS_MAX_ITEMS", DEFAULT_MAX_ITEMS))


def _run_payload_guard(*, items: Iterable | None = None, raw_body: bytes | None = None) -> None:
    """Raise HTTP 413 if the request exceeds size or item caps. Idempotent."""
    body_cap = _max_body_bytes()
    items_cap = _max_items()
    if raw_body is not None and len(raw_body) > body_cap:
        raise HTTPException(status_code=413, detail=f"payload exceeds {body_cap}B cap")
    if items is not None:
        try:
            n = len(items)  # type: ignore[arg-type]
        except TypeError:
            n = sum(1 for _ in items)
        if n > items_cap:
            raise HTTPException(status_code=413, detail=f"item count {n} exceeds {items_cap} cap")


def payload_guard(*args, items: Iterable | None = None, raw_body: bytes | None = None, **_kwargs):
    if args or _kwargs:
        if items is None and args and not callable(args[0]):
            items = args[0]
        _run_payload_guard(items=items, raw_body=raw_body)
        return None
    if items is not None or raw_body is not None:
        _run_payload_guard(items=items, raw_body=raw_body)
        return None

    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*fn_args, **fn_kwargs):
            return fn(*fn_args, **fn_kwargs)

        return wrapper

    return decorator


@contextmanager
def _track_context(endpoint: str, *, fallback_flag: dict | None = None):
    start = time.perf_counter()
    outcome = "ok"
    try:
        yield
    except HTTPException as e:
        outcome = f"http_{e.status_code}"
        raise
    except Exception:
        outcome = "error"
        raise
    finally:
        elapsed = time.perf_counter() - start
        LAT.labels(endpoint=endpoint).observe(elapsed)
        REQS.labels(endpoint=endpoint, outcome=outcome).inc()
        if fallback_flag and fallback_flag.get("used"):
            FALLBACKS.labels(endpoint=endpoint).inc()


class _TrackHelper:
    def __init__(self, endpoint: str, fallback_flag: dict | None = None):
        self.endpoint = endpoint
        self.fallback_flag = fallback_flag
        self._ctx = None

    def __call__(self, fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            with _track_context(self.endpoint, fallback_flag=self.fallback_flag):
                return fn(*args, **kwargs)

        return wrapper

    def __enter__(self):
        self._ctx = _track_context(self.endpoint, fallback_flag=self.fallback_flag)
        return self._ctx.__enter__()

    def __exit__(self, exc_type, exc, tb):
        if self._ctx is None:
            return False
        return self._ctx.__exit__(exc_type, exc, tb)


def track(endpoint: str, *_args, fallback_flag: dict | None = None):
    return _TrackHelper(endpoint, fallback_flag=fallback_flag)


def install_observability(app: FastAPI) -> None:
    @app.middleware("http")
    async def _obs_middleware(request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex
        structlog.contextvars.bind_contextvars(request_id=rid, path=request.url.path)
        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            log.error("request.crash", error=str(exc))
            structlog.contextvars.clear_contextvars()
            raise
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["x-request-id"] = rid
        log.info(
            "request.done",
            method=request.method,
            status=response.status_code,
            latency_ms=elapsed_ms,
        )
        structlog.contextvars.clear_contextvars()
        return response

    @app.get("/metrics", include_in_schema=False)
    def metrics() -> Response:
        return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)
