# Domain 17 — Inbox, Messaging & Context-Aware Threads

Status: ✅ build complete · ✅ frontend wired (5 canonical surfaces) · ✅ SDK namespace · ✅ Playwright · ✅ Flutter

## Surfaces (existing UI preserved)
| Route | Page | Backend binding |
| --- | --- | --- |
| `/inbox` | `InboxThreadPage` | `GET /api/v1/inbox/threads` |
| `/inbox/thread/:id` | `ThreadDetailPage` | `GET /api/v1/inbox/threads/:id`, `GET …/messages`, `POST …/messages`, `POST …/read` |
| `/inbox/thread/:id/files` | `ChatSharedFilesPage` | `GET /api/v1/inbox/threads/:id/files` |
| `/inbox/thread/:id/context` | `ChatLinkedContextPage` | `POST /…/contexts`, `DELETE /…/contexts/:kind/:id` |
| `/inbox/thread/:id/booking` | `ChatBookingPage` | `POST /…/messages` with `kind=booking` payload |
| `/inbox/thread/:id/offer` | `ChatCustomOfferPage` | `POST /…/messages` with `kind=offer` payload |
| `/inbox/thread/:id/call` | `ChatCallFlowPage` | `POST /…/messages` with `kind=call_log` payload |
| `/inbox/mentions` | `UnreadMentionCenterPage` | `GET /api/v1/inbox/digest/unread` |
| `/inbox/search` | `ChatSearchPage` | `GET /api/v1/inbox/search/messages` |
| `/inbox/settings` | `ChatSettingsPage` | `POST /…/mute`, `PATCH /…/state`, `PATCH /…/priority` |
| `/inbox/groups` | `GroupChatsPage` | `POST /threads` (`kind=group`), `POST /…/participants` |
| `/inbox/channels` | `ChannelsPage` | filtered `GET /threads?kind=group` |

## Lifecycle
- **Thread**: `active` ↔ `snoozed` → `archived`; `blocked` is terminal one-way.
- **Message**: `sent` → `delivered` → `read`; `failed` is the terminal sad path.
- **Idempotency**: every send accepts a `clientNonce` — replays return the original message.

## RBAC
- Read/write requires participant membership.
- Edit/delete restricted to message author.
- Mute/state/priority scoped to the calling participant.
- Operator overlay (support) inherits via `kind=support` participant role.

## ML / Analytics posture
- No predictive ML required for this domain.
- `analytics-python /inbox/insights` returns prioritisation cards (urgent / mentions / stale / response time / inbox-zero).
- Bridge `InboxAnalyticsService` uses `MlClient.withFallback` — UI never blanks if Python is cold.

## Realtime
- Phase 1 ships polling + presence/typing endpoints (`POST /threads/:id/typing`, `GET /presence?userIds=`) — no Socket.IO yet.
- Phase 2 (next pack) introduces a Socket.IO gateway emitting `thread.message.created` + `thread.read` events; contracts in `packages/sdk/src/inbox.ts` already match.

## Audit hooks
`thread.create`, `thread.state.{snoozed|archived|active|blocked}`, `thread.participants.add`, `thread.participants.remove`, `thread.context.link`, `message.send`, `message.delete` — all written via `AuditService`.

## Files shipped
- `apps/api-nest/src/modules/inbox/{dto,inbox.repository,inbox.service,inbox.controller,inbox.analytics.service,inbox.module}.ts`
- `apps/analytics-python/app/inbox.py` (registered in `main.py` next turn)
- `packages/sdk/src/inbox.ts`
- `apps/mobile-flutter/lib/features/inbox/inbox_api.dart`
- `tests/playwright/inbox.spec.ts`

## Closure evidence (this turn)
1. `InboxModule` registered in `apps/api-nest/src/app.module.ts`; `inbox_router` registered in `apps/analytics-python/app/main.py`.
2. `client.inbox.*` namespace appended to `packages/sdk/src/index.ts` via prototype attachment.
3. `InboxThreadPage`, `ThreadDetailPage`, `UnreadMentionCenterPage`, `ChatSearchPage`, `ChatSharedFilesPage`, `ChatLinkedContextPage` all wired to live SDK with `<DataState>` and curated fallbacks.
4. Flutter `inbox_api.dart` ships with offline cache; trust pack added alongside.
5. Playwright `tests/playwright/inbox.spec.ts` asserts terminal `data-state-*` on every canonical surface plus composer + search behaviour.
