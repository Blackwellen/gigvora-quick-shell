# FD-12 — ML platform (NestJS bridges + Python ML service)

## Architecture

```
React UI                                  Python ML service (apps/ml-python)
   │                                          ▲
   ▼                                          │ HTTP (timeout/retry/circuit/Zod)
NestJS bridges (apps/api-nest)  ──── MlClient.withFallback ──┐
   │                                                          │
   ├── 25 <domain>.ml.service.ts   (canonical pattern)        │
   ├── ModerationClient            (write-path guard)         │
   ├── MlMetricsService            (per-endpoint Prometheus)  │
   └── MlRegistrySyncService       (cron 5min — pulls /registry into ml_models)
                                                              │
React MlFallbackBanner ── /internal/ml-metrics ───────────────┘
                          (per-endpoint fallback rate + circuit)
```

## Canonical bridge pattern

All 25 NestJS ML bridges must use **`MlClient.withFallback`** with a **Zod
envelope schema**. The shape is non-negotiable:

```ts
const Schema = z.object({
  data: z.<endpoint-specific>,
  meta: z.object({
    model: z.string(),
    version: z.string(),
    latency_ms: z.number(),
    fallback: z.boolean().optional(),
  }),
});
```

Bridges shipped with this contract (FD-12 Run 2):

| # | Module | Endpoint label |
|---|---|---|
| 1 | feed | `feed.rank` |
| 2 | search | `search.rank` |
| 3 | trust | `trust.classify` |
| 4 | profiles | `profiles.score` |
| 5 | companies | `companies.score` |
| 6 | groups | `groups.rank` |
| 7 | network | `network.suggest` |
| 8 | notifications | `notifications.rank` |
| 9 | candidate-availability-matching | `cam.score` |
| 10 | enterprise-hiring-workspace | `ehw.score-approval` |
| 11 | media-viewer | `media.score-quality`, `media.rank-gallery`, `media.moderation-hint` |
| 12 | podcasts | `podcasts.rank-discovery`, `podcasts.recommend-next`, `podcasts.score-recording` |
| 13 | proposal-builder-bid-credits | `proposal.pricing-advice` |
| 14 | proposal-review-award | `proposal.score-project` |
| 15 | booking | `booking.rank` |
| 16 | calls | `calls.score-quality`, `calls.no-show-risk` |
| 17 | gigs-browse | `gigs.rank` |
| 18 | jobs-browse | `jobs.rank` |
| 19 | webinars | `webinars.rank` |
| 20 | job-application-flow | `job-application.score` |
| 21 | job-posting-studio | `job-posting.optimize` |
| 22 | project-posting-smart-match | `project-posting.smart-match` |
| 23 | projects-browse-discovery | `projects.rank` |
| 24 | recruiter-job-management | `recruiter.rank` |
| 25 | interview-planning | `interview.score` |

Every bridge:
- Uses **timeout 1500 ms** by default (moderation overrides to 800 ms).
- **1 retry** with jittered exponential backoff capped at 250 ms.
- **Per-endpoint circuit breaker**: 5 failures in 30 s → open for 15 s, half-open probe.
- **Schema-validated envelope** — schema errors are non-retried (would fail same way).
- **Deterministic local fallback** — same envelope, `meta.fallback=true`,
  `meta.source="<endpoint>:fallback"` so callers/UI can label it.
- **MlMetricsService.record(endpoint, outcome, latency)** for every call.

## Python ML service (apps/ml-python)

CPU-only, runnable on a 16 GB-RAM VPS (no GPU, no model weights >500 MB).

| Component | File |
|---|---|
| Model registry | `app/_registry.py` (singleton `REGISTRY`) |
| Registry HTTP | `app/registry_router.py` (`GET /registry`, `POST /registry/refresh`) |
| Moderation | `app/moderation.py` (sklearn TF-IDF + LogisticRegression) |
| Image / quality | `app/media.py` |
| Ranking | `app/feed.py`, `app/search.py`, etc. |
| Dockerfile | `apps/ml-python/Dockerfile` (Python 3.11-slim, ~700 MB final) |

Default registry includes:
- `moderation.text` — `sklearn-tfidf-logreg` toxicity/scam classifier (seeded).
- Lazy-loaded sentence-transformers (MiniLM) when `ML_ENABLE_EMBEDDINGS=1`.

## Moderation in the write path

`ModerationClient` (`apps/api-nest/src/infra/moderation-client.ts`) is the
single guard used in write paths. It:

1. Calls `POST /moderation/text` via `MlClient.withFallback` (timeout 800 ms).
2. Falls back to a deterministic backstop (toxic-term + URL count → score).
3. Honours `MODERATION_ENFORCE=0` kill-switch (verdict still logged).
4. Throws `422 moderation_rejected` (with `verdict.reasons`) on `reject` when
   enforcement is on; `hold` returns the verdict so the caller can flag rows.

**Wired write paths (Run 2):**
- `feed.createPost` — body + opportunity title/description + poll options.
- `feed.comment` — comment body.

Both paths persist the verdict (`action`, `score`, `model`, `fallback`) into
the audit log so trust-and-safety can replay decisions, and the response to
the client includes a `moderation` field for client-side disclosure.

## ml-batch worker (FD-14 ↔ FD-12)

`apps/workers/src/handlers.ts → mlBatch` runs:
1. `GET /registry` from the Python service to read current model manifest.
2. `POST /registry/refresh` to in-process reload after artefact rotation.
3. Optional `POST /embeddings/refresh` when invoked with `{ refreshEmbeddings: true }`.
4. Persists a row in `ml_batch_runs` (table optional) and broadcasts:
   - `ml.batch.last_ok` (0/1)
   - `ml.batch.models` (count)
   - `ml.batch.tick` event (Socket.IO global topic).

## Frontend fallback indicator

| File | Purpose |
|---|---|
| `src/hooks/useMlFallbackStatus.ts` | Polls `/internal/ml-metrics` every 30 s |
| `src/components/ml/MlFallbackBanner.tsx` | Slim amber banner with per-endpoint chips |
| Mounted in: `src/components/layout/LoggedInShell.tsx` | Visible to authenticated users sitewide |

The banner appears only when at least one endpoint has fallback rate ≥ 5%
over its last ≥ 5 calls, **or** when its circuit is open. Dismissible
per-session.

## Playwright coverage

| Spec | Surface |
|---|---|
| `tests/playwright/ml-fallback-banner.spec.ts` | Banner shows on degraded metrics, hides when healthy |
| `tests/playwright/ml-bridges-coverage.spec.ts` | All 25 bridge labels validated against `/internal/ml-metrics` |

## Runtime envs

| Env | Default | Purpose |
|---|---|---|
| `ML_PY_URL` | `http://localhost:8001` | Python ML service base URL |
| `ML_PYTHON_URL` | (alias) | Legacy alias still respected by 6 bridges |
| `MODERATION_ENFORCE` | `1` | `0` disables hard-block (verdicts still logged) |
| `ML_ENABLE_EMBEDDINGS` | `0` | Lazy-load sentence-transformers in Python service |
