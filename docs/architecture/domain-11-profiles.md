# Domain 11 — Profiles, Professional Identity, and Reputation Surfaces

## Surfaces wired
- `/profile` (overview) and `/profile/edit` (11-tab editor): Basic Info, Experience, Education, Skills, Portfolio, Reviews, Activity, Services, Gigs, Projects, Visibility.
- Verification drawer (ID, email, phone, LinkedIn, GitHub, company).
- Reputation badge cluster on profile header + hover preview cards.
- Public `/u/:handle` (unauthenticated viewers see only `visibility=public` profiles).

## State machines
- **Profile**: `active → paused → archived` (visibility orthogonal).
- **Verification**: `pending → active | failed | expired | revoked`.
- **Review**: `published → flagged → removed` (moderation overlay only).
- **Reputation band**: `new (0–29) → rising (30–59) → trusted (60–79) → top (80–100)`.

## Backend
- NestJS `ProfilesDomainModule` (`apps/api-nest/src/modules/profiles/`).
  - Controllers: `/api/v1/profiles/*` — detail, owner upsert, skills+endorsements,
    experience, education, portfolio, reviews, verifications, badges, reputation.
  - Service: deterministic reputation scoring with auto badge awards.
  - Repository: in-memory shadow store today; swap with TypeORM/Knex impl
    once production Postgres is connected (migration `0013_profiles.sql` ships
    the canonical schema, seeder `0012_seed_profiles.sql` fills demo data).

## Reputation scoring
```
score = 30·(reviews/5) + 20·completion + min(verifications,5)·4
      + 15·activity + min(endorsements,100)·0.15
band  = top ≥80 | trusted ≥60 | rising ≥30 | new <30
```
Mirrored in `apps/analytics-python/app/profiles.py` (`POST /profiles/score`) so
mobile/web/admin can cross-check identically; analytics also exposes
`POST /profiles/insights` for completeness suggestions.

## Mobile (Flutter)
`apps/mobile-flutter/lib/features/profiles/profiles_api.dart` provides full
parity. Tabs collapse into a horizontal scroller; edit controls open as bottom
sheets; verification uploads use the platform image picker.

## SDK
`sdk.profiles.*` — get, update, addSkill, endorse, addPortfolio, addReview,
requestVerification, getBadges, getReputation, recomputeReputation.

## Tests
- Jest: `apps/api-nest/test/profiles.service.spec.ts` — 11-tab envelope, self-review/endorse blocks, reputation recompute + badge auto-award, private visibility enforcement.
- Pytest: `apps/analytics-python/tests/test_profiles.py` — score band thresholds + completeness suggestions.
- Playwright: `tests/playwright/profiles.spec.ts` — `/profile` and `/profile/edit` smoke + 11-tab presence.

## UK governance
- Reviews and badges are public; reputation components are not exposed externally.
- Verification evidence stored via signed URLs; deletion path honours GDPR right-to-erasure (handled in Domain 08 settings DataRequests).

## Enterprise posture (hardened)
- **Persistence**: Drizzle schema in `@gigvora/db` (`schema/profiles.ts`); in-memory shadow store for unit tests.
- **Audit**: `AuditService.record(...)` on profile.upsert, skill add/remove/endorse, experience add/remove, education add, portfolio add/update/remove, review add, verification request/approve/reject, badge award.
- **Idempotency**: every mobile write sends `Idempotency-Key`; replayed requests return the original response via `IdempotencyInterceptor`.
- **Rate limit**: globally guarded by `WriteThrottlerGuard` (60 writes / 60s / actor).
- **Error envelope**: `ErrorEnvelopeFilter` → `{ error: { code, message, details? } }`.
- **RBAC**: `@UseGuards(AuthGuard('jwt'))` on every owner/state-changing endpoint; viewer logging respects `visibility`.

## Mobile screens (Flutter, Riverpod + go_router)
- `apps/mobile-flutter/lib/features/profiles/profiles_api.dart` — Dio-based client.
- `apps/mobile-flutter/lib/features/profiles/profiles_providers.dart` — `profileDetailProvider`, `myVerificationsProvider`, `reputationProvider`, `badgesProvider`, `profileMutationsProvider`.
- `apps/mobile-flutter/lib/features/profiles/profile_view_screen.dart` — 8-tab profile view (Overview / Experience / Education / Skills / Portfolio / Reviews / Badges / Verifications) with endorsement, verification request bottom-sheet.
- `apps/mobile-flutter/lib/features/profiles/profile_edit_screen.dart` — owner edit form + portfolio compose bottom-sheet.
- Routes registered in `apps/mobile-flutter/lib/app/router.dart`: `/profile/:id`, `/profile/:id/edit`. Every screen uses `AsyncStateView` for loading/empty/error/success.

## Hardening pass (3-per-turn sweep)

- **Pagination envelope**: list endpoints return `{ items, total, limit, hasMore }`.
- **Audit**: state changes recorded via `AuditService.record({...})` (object signature).
- **RBAC**: ownership/visibility checks in service layer.
- **Idempotency**: write endpoints accept `Idempotency-Key` header.
- **Mobile parity**: Riverpod providers + AsyncStateView screens registered in router.
