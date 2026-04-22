# SLO — Analytics Python service

Mirrors the ML service SLO doc; both Python services are operated to the same
posture. See also `slo-ml-python.md`.

## Endpoints in scope

`/summary`, `/forecast`, `/entitlements/insights`, plus per-domain analytics
routers (companies, network, profiles, marketing, identity, etc.) included in
`app/main.py`.

## Latency budgets (per endpoint)

| Percentile | Budget   |
|-----------:|---------:|
| p50        | 25 ms    |
| p95        | 150 ms   |
| p99        | 400 ms   |

## Error rate

* 5xx rate < **0.1 %** over any 5-minute window.
* Validation rejections (4xx) are **not** SLO-impacting — they are a feature.

## Fallback rate

Deterministic fallbacks are tracked via `analytics_fallbacks_total{endpoint}`.
Sustained fallback rate > **2 %** for 10 min triggers an investigation alert
(no page).

## DoS posture

* Body cap: `ANALYTICS_MAX_BODY_BYTES` (default 50 KB)
* Item cap: `ANALYTICS_MAX_ITEMS` (default 500)
* Both enforced via `payload_guard()` and surfaced as HTTP 413.

## Observability

* `/metrics` — Prometheus exposition (counters + latency histogram)
* `x-request-id` echoed on every response for cross-service tracing
* Structured JSON access log per request

## Runbook (on-call)

1. **p95 breach** — check the offending endpoint label on
   `analytics_request_latency_seconds_bucket`; isolate to a single endpoint
   before assuming a service-wide regression.
2. **Spiking fallback rate** — usually means an upstream Postgres or DuckDB
   query is timing out. Check the corresponding domain router's logs first.
3. **413 spike** — almost always a misconfigured client batching too many
   rows. Surface the request-id in the alert and trace it back to the caller.
4. **5xx spike** — the JSON access log already includes status + latency_ms +
   request-id; grep by request-id to reconstruct the trace.
