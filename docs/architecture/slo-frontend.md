# SLO — Frontend (React) routes

Defines the operational bar for the 10 primary domain routes hardened in
Group 4 of the enterprise upgrade. Mirrors the SLO docs for the ML and
Analytics Python services — every public-facing surface ships with explicit
loading / empty / error / ready states and a Playwright assertion that no
route gets stuck in a spinner.

## Routes in scope

`/feed`, `/network`, `/profile`, `/companies`, `/agency`, `/groups`,
`/events`, `/notifications`, `/search`, `/settings`.

## Contract

Every list/detail surface uses `<DataState>` from
`src/components/state/DataState.tsx`. The four branches are exposed via
canonical test IDs:

| Status   | Test ID                  | Aria         |
|----------|--------------------------|--------------|
| loading  | `data-state-loading`     | `role=status, aria-busy=true` |
| empty    | `data-state-empty`       | (text)       |
| error    | `data-state-error`       | `role=alert` |
| ready    | `data-state-ready`       | (children)   |

## Time budgets

* TTI < **2 s** on a fresh navigation (3G Fast).
* Loading slot must transition to a terminal slot within **10 s** even when
  the backend returns nothing (enforced by `enterprise-matrix.spec.ts`).

## Error budget

* `pageerror` rate per route < **0.1 %** of sessions / week.
* Console-error rate excluding 401/403/favicon < **0.5 %** of sessions / week.

## QA matrix

`tests/playwright/enterprise-matrix.spec.ts` covers, per route:

1. No `pageerror` is thrown during initial mount.
2. No console error fires (excluding benign auth/favicon noise).
3. The page reaches a terminal `DataState` slot — never an infinite spinner.

Routes not yet migrated to `<DataState>` are detected and skipped so the
matrix is additive, never breaking.

## Runbook

* **Stuck-in-loading regression**: search the failing route's hooks for a
  query that never resolves (most common cause: missing `enabled` flag on a
  `useQuery` waiting for an async dependency).
* **Page-error regression**: open the spec output → `pageerror` payload
  contains the stack frame; almost always a missing import or undefined
  context value.
* **Migration to `<DataState>`**: replace ad-hoc `if (loading) return …; if
  (error) return …; if (!data?.length) return …;` with a single `DataState`
  call using `deriveStatus()`.
