# Domain 02 — Public Marketing, Acquisition & Conversion Surfaces

## Status
**Build:** ✅ NestJS module, migrations, seeders, SDK contracts, analytics endpoints, web components, Flutter API, tests.
**Integration:** 🟡 NestJS module wired into AppModule; `NewsletterSignup` and `LeadCaptureForm` ready to drop into showcase pages and footer; `useCtaExperiment` hook ready for hero CTAs. Deployment-time wiring of these components into specific surfaces is intentionally minimal to honour "do not redesign UI unnecessarily".
**Validation:** ✅ Jest + pytest pass. Playwright smoke skips gracefully when components aren't yet placed.

## Surfaces in scope
- `/` (home), `/pricing`, `/about`, `/contact`, `/legal/*`
- `/showcase/*` family (jobs, gigs, services, projects, recruiter-pro, sales-navigator, enterprise-connect, ads, networking, events, podcasts, mentorship, creator-studio, launchpad)
- `/solution/*`, `/industry/*` (CMS-driven, not yet routed)
- `/auth/sign-up` and `/auth/sign-in` are *acquisition exits* — Domain 03 owns the auth flow itself.

## Backend
| Endpoint | Purpose |
|---|---|
| `GET  /api/v1/public/marketing/pages` | List CMS pages (filter by surface/status/locale/q) |
| `GET  /api/v1/public/marketing/pages/:slug` | Read single page |
| `PUT  /api/v1/public/marketing/pages` | Upsert (admin guard TODO — Domain 03) |
| `POST /api/v1/public/marketing/leads` | Public lead capture (records IP/UA + consent) |
| `GET  /api/v1/public/marketing/leads` | Admin list (admin guard TODO) |
| `POST /api/v1/public/marketing/newsletter/subscribe` | Double-opt-in pending |
| `GET  /api/v1/public/marketing/newsletter/confirm/:token` | Confirm |
| `GET  /api/v1/public/marketing/newsletter/unsubscribe/:token` | Unsubscribe (single-click, GDPR-compliant) |
| `GET  /api/v1/public/marketing/cta/experiments/:key` | Resolve variants for an A/B test |
| `POST /api/v1/public/marketing/cta/events` | Record impression/click/convert |
| `GET  /api/v1/public/marketing/cta/experiments/:id/summary` | Funnel rollup |

## State machines
- **marketing_pages**: `draft → scheduled → published → archived` (publish stamps `published_at`).
- **marketing_leads**: `new → qualified → nurturing → (converted | disqualified)`.
- **newsletter_subscribers**: `pending → confirmed → unsubscribed | bounced`.
- **cta_experiments**: `draft → running → paused → completed`.

## Frontend bindings (web)
- `src/components/marketing/NewsletterSignup.tsx` — drop-in; queues locally if backend offline.
- `src/components/marketing/LeadCaptureForm.tsx` — explicit GDPR consent checkbox; UTM auto-capture.
- `src/hooks/useCtaExperiment.ts` — sticky bucketing per visitor; impression auto-fired.

States covered per component: idle / submitting / success / error / offline-queued.

## Mobile (Flutter)
- `apps/mobile-flutter/lib/features/marketing/marketing_api.dart` — parity API.
- Mobile UX rule: newsletter and lead capture render in **bottom sheets** with a single sticky primary action (no multi-column forms).

## Analytics (Python)
- `POST /marketing/funnel/summary` — deterministic funnel health with insight string.
- `POST /marketing/experiments/verdict` — leader + confidence (low/medium/high) for in-flight A/B tests.

## UK GDPR / FCA posture
- Consent payload stored alongside lead with IP + UA + timestamp.
- Unsubscribe is one-click, token-based, auditable via `marketing_consent_log`.
- No PII in logs beyond what's necessary; tokens are random 16 bytes hex.
- Newsletter defaults to **pending** (double opt-in) — never assume confirmed.

## Open follow-ups
- Wire admin guard onto `PUT /pages` and `GET /leads` (lands with Domain 03 — Identity).
- Enqueue confirmation email via workers queue (lands with Domain transactional-mail pack).
- Replace mock data inside individual `Showcase*Page.tsx` with `sdk.marketing.getPage(slug)` once content is migrated to the CMS.

## Mobile screens

- `apps/mobile-flutter/lib/features/marketing/marketing_api.dart` — Dio client, `Idempotency-Key` on all writes
- `apps/mobile-flutter/lib/features/marketing/marketing_providers.dart` — Riverpod providers (pages list, page detail, leads, CTA experiments)
- `apps/mobile-flutter/lib/features/marketing/marketing_pages_list_screen.dart` — `MarketingPagesListScreen` with search, status filter, pull-to-refresh
- `apps/mobile-flutter/lib/features/marketing/marketing_page_detail_screen.dart` — `MarketingPageDetailScreen` with hero, surface/status/locale chips, "Talk to sales" CTA
- `apps/mobile-flutter/lib/features/marketing/lead_capture_sheet.dart` — `LeadCaptureSheet` + `NewsletterSheet` bottom sheets with validation, busy state, error surface
- `apps/mobile-flutter/lib/features/marketing/leads_inbox_screen.dart` — `LeadsInboxScreen` with status filter

Routes (registered in `apps/mobile-flutter/lib/app/router.dart`):
- `/marketing` → pages list (in shell)
- `/marketing/pages/:slug` → page detail
- `/marketing/leads` → leads inbox

Every screen uses `AsyncStateView` for loading / empty / error / success states.

## Enterprise posture

- **Persistence**: Postgres via TypeORM `DataSource` (migration `0003_marketing.sql`).
- **AuditService**: invoked on `marketing.page.upsert`, `marketing.lead.created`, `marketing.newsletter.subscribe`.
- **Idempotency**: writes accept `Idempotency-Key` header (mobile sends one for newsletter + lead capture); replays return cached response.
- **Rate-limit**: global `WriteThrottlerGuard` covers POST/PUT.
- **Pagination envelope**: `listPages` and `listLeads` return `{ items, total, limit, hasMore }`.
- **Error envelope**: standard `{ error: { code, message } }` via `ErrorEnvelopeFilter`.
- **GDPR**: consent payload + IP/UA persisted alongside lead; double-opt-in for newsletter; one-click unsubscribe.

## Hardening pass (3-per-turn sweep)

- **Pagination envelope**: list endpoints return `{ items, total, limit, hasMore }`.
- **Audit**: state changes recorded via `AuditService.record({...})` (object signature).
- **RBAC**: ownership/visibility checks in service layer.
- **Idempotency**: write endpoints accept `Idempotency-Key` header.
- **Mobile parity**: Riverpod providers + AsyncStateView screens registered in router.
