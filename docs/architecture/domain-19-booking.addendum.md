# Domain 19 — Calendar Booking (back-fill addendum)

> Original: see prior commit. This addendum closes the **ML**, **Socket.IO realtime**, and **3rd-party integration** gaps required by `mem://tech/single-sweep-domain-rule`.

## ML (Python — apps/ml-python/app/booking.py)

| Endpoint | Purpose |
|---|---|
| `POST /booking/slot-rank` | Rank candidate time slots by invitee preferences (morning/afternoon, lunch avoidance, fringe-hour penalties). |
| `POST /booking/cancellation-risk` | Cancellation risk per appointment from rescheduleCount, leadTimeHours, invitee history. Bands: low / medium / high. |

Bridge: `apps/api-nest/src/modules/booking/booking.ml.service.ts` (deterministic local fallback). Exposed via:
- `POST /api/v1/booking/ml/rank-slots`
- `GET /api/v1/booking/appointments/:id/cancellation-risk`
- SDK: `client.booking.rankSlots(...)`, `client.booking.cancellationRisk(id)`

## Socket.IO realtime

`BookingService` injects `NotificationsGateway` and emits on every transition:

| Event | Rooms | Trigger |
|---|---|---|
| `appointment.created` | `user:{ownerId}`, `entity:appointment:{id}`, `topic:booking-link:{linkId}` | `book()` |
| `appointment.approved` | same | `approve()` |
| `appointment.rejected` | same | `reject()` |
| `appointment.rescheduled` | same | `reschedule()` |
| `appointment.cancelled` | same | `cancel()` |
| `appointment.completed` | same | `markCompleted()` |
| `appointment.no_show` | same | `markNoShow()` |

Frontend connects to `/realtime` and joins `entity:appointment:{id}` on the booking detail surface, or `topic:booking-link:{linkId}` on the owner's calendar dashboard.

## Package & 3rd-party integration check

| Layer | Package / Provider | Purpose |
|---|---|---|
| Realtime | `@nestjs/websockets` + `socket.io` | Reused via `NotificationsModule` |
| Calendar adapter | Internal `CalendarService` (Domain 18 cousin) | Provider-agnostic meeting links |
| Calendar providers | Google Calendar, Microsoft Outlook (via Lovable connectors `microsoft_outlook` when wired); Zoom for video | External calendar sync, reschedule propagation |
| Email reminders | Resend connector available; Microsoft Outlook connector available | Confirmation + reminder emails |
| SMS reminders | Twilio connector available | High-risk no-show reminders (drive from `noShowRisk` ≥ medium) |
| Mobile HTTP | `package:http` | No new deps required |
| Audit | Internal `AuditService` | Every transition recorded |

No new npm or pip dependencies added. SMS/email providers are **available connectors** to be wired when the domain owner enables them — booking does not assume a default provider.

## Payment touchpoints

When a booking link is monetised (paid sessions, deposits), the Confirm step MUST hand off to the multi-step checkout pattern (`mem://features/payment-checkout-pattern`): availability → details → payment-method → review/summary → confirm → success/receipt → failure-recovery. Never collapse into a single Pay button.
