# Domain 67 — Networking + Speed Networking + Events + Groups

## Surfaces
`/networking/*`, `/networking/speed`, `/networking/cards`, `/events/*`, `/groups/*`.

## Persistence
Migration `0071_networking_events_groups.sql` adds: `net_rooms`, `net_room_attendees`,
`net_speed_matches`, `net_business_cards`, `net_card_shares`, `evt_events`,
`evt_rsvps`, `grp_groups`, `grp_members`, `grp_posts`, `neg_audit` (append-only).

## State machines
- **Rooms**: `draft → scheduled → live → ended → archived`
- **Events**: `draft → published → live → completed | cancelled`
- **Groups**: `active ↔ archived | suspended`
- **Group membership**: `pending → member → mod | admin | owner`

## RBAC
- Only the room/event host can transition status.
- Group `request`/`invite_only` policies create `pending` members; admins promote.
- Cross-tenant impossible — all queries filter by `identity_id` or membership join.

## Video & payments
- Provider auto-routes: capacity ≤ 50 & free → **Jitsi**; otherwise → **LiveKit**
  (`apps/integrations/src/voice/livekit.ts`, env: `LIVEKIT_URL/API_KEY/API_SECRET`).
- Paid rooms/events return `requiresPayment: true` with a `checkout` envelope; the
  Stripe webhook flips `paid_status` to `paid` and admits the user on next join.
- Free rooms/events skip Stripe entirely — same code path.

## Speed-matching algorithm (deterministic primary)
For each round:
1. Sort attendees by `id` (deterministic for replay).
2. Greedy pair on max Jaccard(interestsA, interestsB); leftover odd person becomes
   observer for the round.
3. Score = round(100 × jaccard). Reason payload includes `shared` interests.
Strategies: `interest_overlap` (default), `random`, `industry`. ML service mirrors
the same algorithm at `POST /networking-events-groups/speed-match` so callers can
batch-score outside the session.

## Analytics
`POST /networking-events-groups/overview` returns deterministic insight cards
(many_draft_rooms, low_speed_quality, paid_low_attendance, low_rsvp_yield, small_groups).

## Tests
- Jest: service contract, deterministic matcher.
- Pytest: ML envelope + ranker monotonicity.
- Playwright: route-mount smoke (`tests/playwright/networking-events-groups.spec.ts`).
