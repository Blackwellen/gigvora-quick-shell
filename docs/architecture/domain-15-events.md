# Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups
Backend: `apps/api-nest/src/modules/events/`
Schema: `packages/db/src/schema/events.ts` + migration `packages/db/migrations/0015_events.sql`
ML: `apps/ml-python/app/events.py` (ranking, networking match)
Analytics: `apps/analytics-python/app/events.py` (health, forecast)
Web hooks: `src/hooks/useEvents.ts` (envelope overlay; pages keep fixtures when API unset)
Mobile: `apps/mobile-flutter/lib/features/events/{events_api,events_providers,events_screens}.dart`
Calendar adapter: `apps/api-nest/src/modules/calendar/calendar.service.ts` (timezone-safe reschedule/cancel propagation; deterministic internal fallback)
Tests: `tests/playwright/events.spec.ts`

Lifecycle: draft → scheduled → live → completed (or cancelled/archived). RSVP states: going|interested|waitlist|cancelled|attended|no_show with capacity-gated waitlist promotion. Chat channels: lobby|live|qa|backstage. Check-in methods: manual|qr|auto|badge.
