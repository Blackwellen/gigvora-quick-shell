# ML Python service — SLO & Runbook

Owner: ML platform · Last reviewed: this back-fill turn · Pager: #ml-oncall

## Service shape

A FastAPI process (`apps/ml-python`) exposing deterministic rankers, matchers,
and moderation scorers. Consumed via NestJS bridge services
(`apps/api-nest/src/modules/*/<domain>.ml.service.ts`) which apply timeout,
retry, and pure-JS fallback. The Python service is the **primary** path.

## SLOs (per endpoint)

| Endpoint                       | p50    | p95    | p99    | Error rate | Fallback rate |
|--------------------------------|--------|--------|--------|------------|---------------|
| `POST /search/rank`            | 25 ms  | 120 ms | 300 ms | < 0.5 %    | < 2 %         |
| `POST /profiles/similar`       | 30 ms  | 150 ms | 350 ms | < 0.5 %    | < 2 %         |
| `POST /companies/similar`      | 30 ms  | 150 ms | 350 ms | < 0.5 %    | < 2 %         |
| `POST /agency/rank`            | 25 ms  | 120 ms | 300 ms | < 0.5 %    | < 2 %         |
| `POST /agency/proof-trust`     | 5 ms   |  20 ms |  50 ms | < 0.1 %    | n/a           |
| `POST /groups/moderate`        | 10 ms  |  40 ms | 100 ms | < 0.5 %    | n/a           |
| `POST /events/rank`            | 25 ms  | 120 ms | 300 ms | < 0.5 %    | < 2 %         |
| `POST /feed/rank`              | 25 ms  | 120 ms | 300 ms | < 0.5 %    | < 2 %         |
| `POST /network/pymk`           | 25 ms  | 120 ms | 300 ms | < 0.5 %    | < 2 %         |
| `POST /notifications/priority` | 5 ms   |  25 ms |  60 ms | < 0.1 %    | n/a           |
| `POST /match/score`            | 5 ms   |  20 ms |  50 ms | < 0.1 %    | n/a           |
| `POST /rank` (legacy)          | 25 ms  | 120 ms | 300 ms | < 0.5 %    | n/a           |
| `POST /moderate` (legacy)      | 5 ms   |  20 ms |  50 ms | < 0.1 %    | n/a           |

Budget window: rolling 28 days. Any breach = page on-call within 15 min.

## Safety caps

Enforced uniformly by `_obs.payload_guard`:

* `ML_MAX_BODY_BYTES` (default `50_000` bytes) — request body
* `ML_MAX_ITEMS`      (default `500`)          — list lengths

Exceeding either returns `HTTP 413` and increments
`ml_requests_total{outcome="http_413"}`.

## Observability

* **Metrics**: Prometheus exposed at `GET /metrics`
  * `ml_requests_total{endpoint, outcome}`
  * `ml_request_latency_seconds_{bucket,sum,count}{endpoint}`
  * `ml_fallbacks_total{endpoint}` — increments when the deterministic fallback
    path was selected (e.g., embedding model unavailable).
* **Logs**: `structlog` JSON, one line per request, includes
  `{request_id, method, path, status, latency_ms}`.
* **Tracing**: every response carries `x-request-id`. NestJS bridges propagate
  it inbound; the worker ingests it as the trace correlation id.

## Load test

`tests/load/ml-python.js` (k6) exercises every endpoint at the p95 budget for
60 seconds at 50 vus. CI runs it nightly against staging. Failure (any p95
breach or non-2xx > 0.5 %) blocks promotion to prod.

```
k6 run -e BASE_URL=https://ml.staging.gigvora.dev tests/load/ml-python.js
```

## Runbook

| Symptom                                              | First action                                                                                  |
|------------------------------------------------------|------------------------------------------------------------------------------------------------|
| `ml_fallbacks_total` spike on a single endpoint      | Check upstream model store; verify `MODEL_*` env; confirm bridge timeout is still 1.5s.        |
| p95 breach across all endpoints                      | Check pod CPU + GC; resize Lovable Cloud instance if sustained. See cloud upgrade guidance.    |
| `http_413` spike from one caller                     | Identify caller via `x-request-id` log; tell them to paginate or reduce candidate set.         |
| `ml_requests_total{outcome="error"}` non-zero        | Pull last 50 `request.crash` log lines; correlate to a deploy or schema change.                |
| `/metrics` 5xx                                       | Restart pod — Prometheus registry may have collided after a hot reload.                        |

## Change-management

Any new endpoint **must**:
1. Use Pydantic v2 strict models with explicit field caps.
2. Wrap its handler body in `with track("<endpoint>"):`.
3. Call `payload_guard(items=...)` for any list input.
4. Add a row to the SLO table above with measured budgets from a load test.
5. Add positive + fallback + empty + oversize + malformed pytest cases.
