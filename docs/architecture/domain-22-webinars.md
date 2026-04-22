# Domain 22 — Webinars (Discovery, Live Rooms, Replays, Donations, Sales)

Single full-stack pack covering web + mobile + ML + analytics + SDK + tests.

## Backend
- `apps/api-nest/src/modules/webinars/` — module, controller (`/api/v1/webinars/*`),
  service, repository (seeded fixtures + state machines), ML bridge, analytics bridge, DTOs.
- State machines:
  - **Webinar**: draft → scheduled ↔ cancelled, scheduled → live → ended → archived
  - **Purchase**: pending → confirmed → paid | failed → refunded
  - **Donation**: pending → captured | failed → refunded

## Live rooms
- Free **Jitsi** by default (`meet.jit.si`) per the Jitsi-and-Voice rule. The
  controller returns `{ jitsiDomain, jitsiRoom }` so the frontend mounts
  `<JitsiRoom>` directly.
- Live chat uses a per-webinar Socket.IO topic (`webinar:{id}`) and a
  200-message ring buffer in the repository.

## Replays
- Default storage = local-first (`local://webinar-replays/{id}.mp4`) per the
  local-first storage rule.
- Replay player uses `<VideoViewer>` (Video Viewer SDK) with hover-preview
  and thumbnail picking via `<VideoThumbnailPicker>`.
- Promotable to R2 / S3 later via `apps/integrations/src/storage/`.

## Sales (multi-step checkout per payment-checkout-pattern rule)
1. `POST /api/v1/webinars/purchases` → returns `{ id, status: 'pending' }`
2. `POST /api/v1/webinars/purchases/:id/confirm` with `{ paymentMethod, billing, acceptTos: true }` → `paid`
3. Confirmation auto-registers the buyer (so the live room unlocks).

## Donations
- `POST /api/v1/webinars/:id/donate` captures (simulated) and emits
  `webinar.donation.captured` for the live room donation rail.

## ML & Analytics
- `apps/ml-python/app/webinars.py` — `/webinars/rank` + `/webinars/recommend` (600ms budget).
- `apps/analytics-python/app/webinars.py` — `/webinars/insights`.
- Deterministic fallback always serves a result (live > soonest > popular).

## SDK
- `packages/sdk/src/webinars.ts` — `createWebinarsClient(fetch)` with multi-step purchase signature.

## Web hooks
- `src/hooks/useWebinarsData.ts` — `useWebinarsDiscover`, `useWebinarsRecommend`,
  `useWebinarsInsights`, `useWebinarDetail`, `useWebinarLiveRoom`,
  `useWebinarChat` + `usePostChat`, `useRegisterWebinar`,
  `useCreateWebinarPurchase` + `useConfirmWebinarPurchase` + `useWebinarPurchases`,
  `useDonateWebinar`, `useWebinarsRealtime`.
- Realtime subscriptions on `webinar.live.started/ended`, `webinar.chat.message`,
  `webinar.purchase.confirmed`, `webinar.donation.captured`.

## Mobile (Flutter)
- `apps/mobile-flutter/lib/features/webinars/webinars_api.dart`
- `apps/mobile-flutter/lib/features/webinars/webinars_screen.dart` — discovery list,
  detail bottom sheet, **3-step checkout** (Review → Confirm → Success), donation button.

## Realtime
Socket.IO via NotificationsGateway (rule: WebSockets Everywhere).
Topics: `webinars`, `webinar:{id}`; user channel for purchase receipts.

## Third-party / packages
- Voice/video: **Jitsi** (`apps/integrations/src/voice/jitsi.ts`, `<JitsiRoom>`).
- Video player: **VideoViewer SDK** (`<VideoViewer>` with hover preview).
- Storage: local-first (`apps/integrations/src/storage/local.ts`); promotable to R2/S3.
- Payments: Stripe/Paddle adapter (Lovable built-in payments for live).
- Search: OpenSearch index `webinars_v1` (write path stubbed; ML+repo fallback active).
- npm packages added: none new (uses existing `@tanstack/react-query`, `socket.io-client`, `hls.js`).

## Tests
- `tests/playwright/webinars.spec.ts` — discovery → detail → live-room reachability + checkout probe.
