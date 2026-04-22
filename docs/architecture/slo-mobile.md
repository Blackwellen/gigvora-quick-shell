# SLO — Mobile Flutter app

Defines the operational bar for the mobile companion. Mirrors the SLO docs
for ML, Analytics, and Frontend (web) — every domain screen ships with the
same 4-state contract and offline posture.

## Screens in scope

`/feed`, `/network`, `/profiles`, `/companies`, `/agency`, `/groups`,
`/events`, `/notifications`, `/search`, `/settings` — i.e. every feature
pack under `apps/mobile-flutter/lib/features/`.

## Contract

Every list/detail screen renders through `AsyncStateView` from
`apps/mobile-flutter/lib/core/async_state.dart`. The four branches expose
canonical widget keys:

| State    | Key                              |
|----------|----------------------------------|
| loading  | `AsyncStateView.loadingKey`      |
| error    | `AsyncStateView.errorKey`        |
| empty    | `AsyncStateView.emptyKey`        |
| ready    | `AsyncStateView.readyKey`        |

Repositories that hit the network MUST go through
`OfflineCache.readOrFetch()` from `apps/mobile-flutter/lib/core/offline_cache.dart`
so the app degrades gracefully on flaky connections.

## Offline posture

* Fresh cache hit (within TTL) — no network call.
* Cache miss / stale + network OK — fetch, persist, return.
* Cache miss / stale + network FAIL — return stale cache if any; otherwise
  surface error via `AsyncStateView.errorKey`.

Default TTLs (per domain, override per repository):

| Domain        | TTL    |
|---------------|--------|
| feed          | 30 s   |
| notifications | 30 s   |
| companies     | 5 min  |
| profiles      | 5 min  |
| settings      | 1 h    |

## Accessibility budget

* Tap targets ≥ 40 pt (enforced in widget tests).
* Every interactive widget has a semantic label.
* All icons paired with text or `Semantics(label: …)`.
* Color contrast ≥ AA on theme tokens (manual audit per release).

## QA matrix

* `apps/mobile-flutter/test/async_state_test.dart` — widget matrix across
  all four branches + accessibility tap-target assertion.
* `apps/mobile-flutter/test/offline_cache_test.dart` — full TTL decision
  tree.
* `apps/mobile-flutter/test/shell_bootstrap_test.dart` — pre-existing
  smoke for shell repository parsing.

## Runbook

* **Stuck-in-loading regression** — check the screen's `Future`/`Stream`
  source; most often a `Provider` that never resolves because a dependency
  is null on cold start.
* **Stale cache returning forever** — confirm the repository is calling
  `readOrFetch()` rather than `read()` directly; check the TTL value.
* **Accessibility regression** — re-run `async_state_test.dart`; the
  tap-target test will fail if Material's defaults are overridden.
