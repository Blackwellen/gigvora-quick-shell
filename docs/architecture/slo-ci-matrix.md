# SLO — Cross-Cutting CI Matrix (Group 6)

The CI gate enforces every per-service SLO doc:

| Suite               | Source                                            | Gate                          |
|---------------------|---------------------------------------------------|-------------------------------|
| ml-python           | `apps/ml-python/tests/`                           | required check, blocks merge  |
| analytics-python    | `apps/analytics-python/tests/`                    | required check, blocks merge  |
| api-nest (Jest)     | `apps/api-nest/`                                  | required check, blocks merge  |
| frontend Playwright | `tests/playwright/enterprise-matrix.spec.ts`      | required check, blocks merge  |
| mobile-flutter      | `apps/mobile-flutter/test/`                       | required check, blocks merge  |
| k6 smoke            | `tests/load/{ml,analytics}-python.js`             | informational (warning only)  |

Workflow: `.github/workflows/enterprise-qa.yml`
Aggregate gate job: `enterprise-qa-gate` — set this as the required PR check.

## Per-suite SLO references

* `docs/architecture/slo-ml-python.md`
* `docs/architecture/slo-analytics-python.md`
* `docs/architecture/slo-frontend.md`
* `docs/architecture/slo-mobile.md`

## Failure runbook

* **Pytest red** — read the matrix in the failing suite (happy / empty / oversize / malformed / metrics). The first three lines of the failure pinpoint which contract regressed.
* **Jest red (api-nest)** — usually MlClient retry/fallback or audit-row drift. Check `MlClient.withFallback` and the corresponding `*.service.spec.ts`.
* **Playwright red** — `enterprise-matrix.spec.ts` lists which route failed and why (pageerror / console catastrophe / stuck spinner).
* **Flutter red** — `async_state_test.dart` failure means a canonical key was renamed; `offline_cache_test.dart` failure means the TTL decision tree drifted.
* **k6 warning** — non-blocking, but file an issue if p95 latency or error rate breaches the per-service SLO doc.

## Promoting k6 from warning to gate

When the platform is stable for 2 consecutive weeks with green k6, flip
`|| echo "::warning::..."` to a hard `exit 1` in `enterprise-qa.yml` and add
`k6-smoke` to the `enterprise-qa-gate` `needs:` list.
