# Domain 07 — Notifications, Real-Time Events, Activity Routing, Badges

## Mission
Single source of truth for every event that needs to reach a user — across
in-app, email, push, SMS, Slack, and outbound webhooks — with realtime fan-out
via Socket.IO and durable badge counters.

## API Surface (`/api/v1/notifications`)
| Method | Path                     | Purpose                                |
|--------|--------------------------|----------------------------------------|
| GET    | `/`                      | List notifications (filters, cursor)   |
| GET    | `/unread-count`          | Bell-icon count                        |
| POST   | `/`                      | Create + fan out + realtime push       |
| POST   | `/mark-read`             | Mark a set of ids read                 |
| POST   | `/mark-all-read`         | Clear bell                             |
| POST   | `/:id/dismiss`           | Hide one card                          |
| GET    | `/:id/deliveries`        | Operator delivery log                  |
| GET    | `/prefs`                 | Per-topic routing rules                |
| POST   | `/prefs`                 | Upsert one rule                        |
| GET    | `/devices`               | Push-token registry                    |
| POST   | `/devices`               | Register device                        |
| DELETE | `/devices/:token`        | Revoke                                 |
| GET    | `/badges`                | All badge counters                     |
| GET    | `/activity`              | Activity feed                          |
| POST   | `/activity`              | Emit activity event                    |
| GET    | `/webhooks`              | List subscriptions                     |
| POST   | `/webhooks`              | Create (returns secret ONCE)           |
| DELETE | `/webhooks/:id`          | Deactivate                             |

## Realtime gateway (`/realtime` Socket.IO namespace)
Each authenticated socket joins:
- `user:{identityId}` — personal notifications + badge updates
- `topic:{topic}` — global broadcast (status, maintenance)
- `entity:{type}:{id}` — granular co-edit / co-view sync

Server emits: `notification.created`, `notification.dismissed`,
`badge.updated`, `activity.event`, `hello`.
Client emits: `subscribe.topic`, `subscribe.entity`.

## Channels & state machines
- `notification.status`: `pending → queued → sent → delivered → (read | dismissed | failed | suppressed)`
- `delivery.status`: `pending → sent → delivered | failed | bounced | dropped`
- Channels: `in_app`, `email` (Resend), `push` (Expo/FCM/APNs), `sms` (Twilio),
  `webhook` (HMAC-signed), `slack`.
- Channel selection: explicit override → user pref for topic → wildcard pref → `in_app`.

## Persistence
- `notifications` — one logical event per recipient
- `notification_deliveries` — one row per channel attempt
- `notification_preferences` — routing rules + quiet hours + digest cadence
- `device_tokens` — push registrations
- `activity_events` — broader event stream
- `badge_counters` — durable per-surface counts
- `webhook_subscriptions` — outbound HMAC-signed callbacks

## Analytics (FastAPI)
- `POST /notifications/rank` — importance × freshness × affinity (24h half-life)
- `POST /notifications/digest` — group-by-topic with operator commentary

Both deterministic; no model required.

## Mobile parity
`apps/mobile-flutter/lib/features/notifications/notifications_api.dart` covers
list / unread-count / mark-read / mark-all / dismiss / badges / prefs / devices /
activity. Mobile UX:
- bell → DraggableScrollableSheet, swipe-left dismiss, swipe-right read
- preferences → grouped settings page with channel chips
- realtime → single Socket.IO + FCM cold-start
- badges → BottomNavigationBar dot indicators

## SDK
`packages/sdk/src/index.ts` — `sdk.notifications.*` namespace with 16
contract-versioned methods and full TypeScript types
(`Notification`, `NotificationDelivery`, `NotificationPreference`,
`DeviceToken`, `BadgeCounter`, `ActivityEvent`, `WebhookSubscription`).

## Tests
- Jest: `apps/api-nest/test/notifications.service.spec.ts` — fan-out, badge
  bump, mark-all-read, activity multi-room emit, webhook secret issuance.
- Pytest: `apps/analytics-python/tests/test_notifications.py` — rank ordering,
  digest grouping.
- Playwright: `tests/playwright/notifications.spec.ts` — bell mount + endpoint
  reachability.

## Completion gate
- ✅ Build: migration + seeder + NestJS module + gateway + DTOs
- ✅ Integration: SDK namespace `sdk.notifications.*`, Flutter parity, controller mounted, analytics router mounted
- 🟡 Validation: Jest + pytest + Playwright suites added; per-component frontend swap from mock notification arrays to `sdk.notifications.list()` is the next pass

## Mobile screens

- `apps/mobile-flutter/lib/features/notifications/notifications_api.dart` — Dio client (Idempotency-Key on writes that need replay safety)
- `apps/mobile-flutter/lib/features/notifications/notifications_providers.dart` — Riverpod providers (autoDispose)
- `apps/mobile-flutter/lib/features/notifications/notifications_screens.dart` — Screens registered at: /notifications, /notifications/preferences

All screens use `AsyncStateView` for loading/empty/error/success.

## Enterprise posture

- **Pagination envelope**: list endpoints return `{ items, total, limit, hasMore }`.
- **Audit**: state changes recorded in domain audit table.
- **RBAC**: ownership checks in service layer.
- **Idempotency**: write endpoints accept `Idempotency-Key` header.
- **Error envelope**: standard `{ error: { code, message } }` via `ErrorEnvelopeFilter`.
