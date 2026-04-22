# Domain 18 — Calls, Video, Presence & Contact Windows (back-fill addendum)

> Original: see prior commit. This addendum closes the **ML**, **Socket.IO realtime**, and **3rd-party integration** gaps required by `mem://tech/single-sweep-domain-rule`.

## ML (Python — apps/ml-python/app/calls.py)

| Endpoint | Purpose |
|---|---|
| `POST /calls/score-quality` | Connection-quality score from session metrics (bitrate, packet loss, jitter, RTT). Bands: excellent / good / fair / poor. |
| `POST /calls/no-show-risk` | Pre-call no-show risk from minutesUntil, rescheduleCount, confirmation, past no-shows. Bands: low / medium / high. |

Bridge: `apps/api-nest/src/modules/calls/calls.ml.service.ts` calls Python with a **deterministic local fallback** (1.5s timeout) so the journey never blanks. Exposed via:
- `POST /api/v1/calls/ml/score-quality`
- `POST /api/v1/calls/ml/no-show-risk`
- SDK: `client.calls.scoreQuality(...)`, `client.calls.noShowRisk(...)`

## Socket.IO realtime

`CallsService` injects `NotificationsGateway` (from `NotificationsModule`) and emits on every transition:

| Event | Rooms | Trigger |
|---|---|---|
| `call.created` | `topic:calls`, `entity:call:{id}`, `user:{participantId}` | `create()` |
| `call.updated` | same | `update()` |
| `call.rescheduled` | same | `reschedule()` |
| `call.cancelled` | same | `cancel()` |
| `presence.updated` | `topic:presence` | `setPresence()` |

Frontend should `socket.io-client` connect to `/realtime` and `subscribe.topic: 'calls'` or `subscribe.entity: { entityType: 'call', entityId }`.

## Package & 3rd-party integration check

| Layer | Package / Provider | Purpose |
|---|---|---|
| Realtime | `@nestjs/websockets` + `socket.io` | Reused via `NotificationsModule` |
| HTTP client | Native `fetch` + `AbortSignal.timeout` | Python ML bridge |
| Audit | Internal `WorkspaceModule.AuditService` | Lifecycle traceability |
| Calendar / video | Internal `CalendarService` adapter (Domain 19 booking reuses) | Meeting links |
| External video providers | Adapter pattern in `CalendarService` — concrete providers: Google Meet, Microsoft Teams, Zoom (via Lovable connectors when wired) | Join URLs |
| Telephony | Telegram / Twilio Lovable connectors available for SMS/voice OTP — not bound by default | Reminder SMS, voice fallback |
| Mobile HTTP | `package:http` (already in `apps/mobile-flutter/pubspec.yaml`) | No new deps required |

No new npm or pip dependencies added.
