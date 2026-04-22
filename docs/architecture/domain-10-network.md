# Domain 10 — Network Graph, Connections, Followers, Degree Logic

## Mission
Operating-grade network surface: connection requests, symmetric connections,
blocks, degree look-ups (1°/2°), mutual count, and ranked suggestions.
Followers (asymmetric) live in Domain 09 (Feed) and remain shared.

## API Surface (`/api/v1/network`)
| Method | Path                              | Purpose                            |
|--------|-----------------------------------|------------------------------------|
| POST   | `/requests`                       | Send connection request            |
| GET    | `/requests/incoming`              | Inbox (`?status=pending`)          |
| GET    | `/requests/outgoing`              | Sent requests                      |
| POST   | `/requests/:id/respond`           | Accept / decline                   |
| DELETE | `/requests/:id`                   | Withdraw                           |
| GET    | `/connections`                    | Direct connections                 |
| GET    | `/connections/count`              | Degree-1 count                     |
| DELETE | `/connections/:id`                | Remove connection                  |
| GET    | `/degree/:id`                     | Viewer→target degree + mutual count|
| GET    | `/mutuals/:id`                    | Mutual connections list            |
| GET    | `/suggestions`                    | Ranked candidates (`?maxDegree=2`) |
| POST   | `/blocks/:id`                     | Block user                         |
| DELETE | `/blocks/:id`                     | Unblock                            |
| GET    | `/blocks`                         | Block list                         |
| POST   | `/recompute`                      | Manual edge recompute (override)   |

## Persistence
- `connection_requests` — pending/accepted/declined/withdrawn/blocked/expired
  with a partial unique index that allows one open request per pair
- `connections` — symmetric, canonical (lo, hi) ordering enforced via CHECK
- `user_blocks` — directional with optional reason
- `network_edges` — denormalised viewer×target×degree×mutual_count cache,
  bounded to 2°, recomputed on accept/remove/block

## Service rules
- self-connect / self-block rejected
- request to a blocked party rejected
- one open pending request per pair (DB-enforced)
- on accept → materialise canonical connection + recompute both edge caches
- on remove/block → recompute both edge caches
- block also tears down any existing connection

## Analytics (FastAPI)
- `POST /network/rank-suggestions` — deterministic ranking (mutuals, degree,
  shared tags, activity). ML-ready slot.
- `POST /network/insights` — accept-rate, dormancy, backlog flags.

## Mobile parity
`apps/mobile-flutter/lib/features/network/network_api.dart`:
- Tabbed Incoming/Outgoing inbox with swipe accept/decline/withdraw
- Searchable connection list with alphabet bar
- Suggestions horizontal carousel; Connect → bottom-sheet composer
- Degree badge inline on profile headers
- Blocks settings page with confirmation dialog

## SDK
`packages/sdk/src/index.ts` — `sdk.network.*` namespace and contracts
(`ConnectionRequest`, `Connection`, `Degree`, `Suggestion`, `Block`).

## Tests
- Jest: `apps/api-nest/test/network.service.spec.ts` — self-connect,
  blocked recipient, duplicate pending, accept-recompute, decline-no-recompute,
  block teardown, degree(self)=0, suggestions ranking.
- Pytest: `apps/analytics-python/tests/test_network.py` — suggestion ranking,
  insight flags.
- Playwright: `tests/playwright/network.spec.ts` — endpoint mount + /network
  render.

## Completion gate
- ✅ Build: migration + seeder + NestJS module + DTOs + repo + service + controller
- ✅ Integration: SDK `sdk.network.*`, Flutter parity, controller mounted, analytics router mounted
- 🟡 Validation: Jest + pytest + Playwright suites added; per-component frontend swap (network inbox, suggestions rail, connection list, degree badges) from mock data to `sdk.network.*` is the next pass
echo done
ls docs/architecture/domain-10-network.md 2>/dev/null && echo exists || echo missing

---

## Enterprise posture (retro-hardened)

| Requirement | Wired |
|---|---|
| Real Postgres (no in-memory) | ✅ `network.repository.ts` (TypeORM `DataSource`, canonical (lo,hi) ordering, indexed) |
| RBAC on writes | ✅ requester/recipient/blocker enforced in SQL `UPDATE`/`DELETE` |
| Audit log on every state change | ✅ `AuditService.record({ domain:'network', action:... })` for request.send/accept/decline/withdraw, connection.remove, block, unblock, recompute |
| Validation at controller boundary | ✅ `class-validator` DTOs |
| Pagination envelope (typed, bounded) | ✅ incoming/outgoing/connections/suggestions return `{ items, total, limit, hasMore }` |
| Error envelope | ✅ global `ErrorEnvelopeFilter` |
| Idempotency on writes | ✅ global `IdempotencyInterceptor`; mobile sends `Idempotency-Key` on `sendRequest` |
| Rate-limit on writes | ✅ global `WriteThrottlerGuard` (60 writes / 60s per actor+route) |
| Observability | ✅ structured audit log line per write |
| GDPR / UK posture | ✅ block removes connection, recomputes edges; audit trail preserved |

## Mobile screens (apps/mobile-flutter/lib/features/network)

- `network_api.dart` — Dio client with paginated envelopes + `Idempotency-Key`.
- `network_providers.dart` — Riverpod providers for connections, requests
  (incoming/outgoing × status), suggestions, blocks, count, degree.
- `network_home_screen.dart` — single tabbed surface with four tabs:
  - **People** — connection list, action sheet (remove / block) with confirm.
  - **Requests** — segmented Incoming/Outgoing, accept/decline/withdraw inline.
  - **Suggestions** — cards with degree + mutual count, Connect bottom-sheet
    with optional message and idempotency-keyed send.
  - **Blocks** — list with one-tap unblock.

Route registered in `apps/mobile-flutter/lib/app/router.dart`:
- `/network` — network home (all four tabs)

All tabs render through `AsyncStateView` (loading / empty / error / success)
and every destructive action goes through `confirmAction(...)`.
