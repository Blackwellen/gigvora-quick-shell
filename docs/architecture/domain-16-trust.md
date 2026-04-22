# Domain 16 — Ratings, Reviews, Trust Badges & Social Proof Systems

Status: ✅ build complete · ✅ frontend wired · ✅ Flutter parity · ✅ Playwright

## Surfaces (UI preserved 1:1)
| Route | Page | Backend binding |
| --- | --- | --- |
| `/trust` | `TrustPage` (6 tabs) | `GET /api/v1/trust/reviews,references,verifications,score,summary,badges,moderation/log` + mutations |
| `/profile/...` (Reviews tab) | `ProfileReviewsTab` | `GET /api/v1/trust/reviews?direction=received&status=published` + `helpful` + `dispute` |

## Lifecycle
- **Review**: `draft → pending → published → disputed → rejected → archived`
- **Reference**: `pending → verified → expired/declined`
- **Verification**: `not_started → pending → verified/failed`
- **Idempotency**: helpful/respond/dispute fire-and-refetch via TanStack Query.

## RBAC
- Authenticated viewer can list/create/edit own reviews; only operators can `moderate`.
- Reference submission uses a single-use token (out-of-band email).

## ML / Analytics
- `ml-python /trust/moderation` scores review toxicity/spam (deterministic fallback).
- `analytics-python /trust/score` computes 5-dimension trust score with explainable bands.
- NestJS bridge uses `MlClient.withFallback`; UI never blanks if Python is cold.

## Files shipped
- `apps/api-nest/src/modules/trust/{dto,trust.repository,trust.service,trust.controller,trust.ml.service,trust.analytics.service,trust.module}.ts`
- `apps/ml-python/app/trust.py` + `apps/analytics-python/app/trust.py`
- `packages/sdk/src/trust.ts` + `packages/sdk/src/index.ts` (`client.trust.*`)
- `src/pages/trust/TrustPage.tsx` + `src/pages/profile/ProfileReviewsTab.tsx`
- `apps/mobile-flutter/lib/features/trust/{trust_api,trust_list_screen,leave_review_sheet}.dart`
- `tests/playwright/trust.spec.ts`

## Frontend wiring posture
Every page resolves data from `sdk.trust.*` via TanStack Query, with curated
deterministic fallbacks so the surface never blanks when the API is cold or
unconfigured. All branches render through `<DataState>` exposing
`data-state-{loading,empty,error,ready}` for Playwright.
