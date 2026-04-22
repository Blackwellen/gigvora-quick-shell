# Domain 08 — Settings, Preferences, Localization, Accessibility, Profile Controls

## Mission
Single source of truth for every per-identity preference. Persisted across
refresh, audited on every change, exposed identically on web/mobile/SDK.

## API Surface (`/api/v1/settings`)
| Method | Path                            | Purpose                                  |
|--------|---------------------------------|------------------------------------------|
| GET    | `/`                             | List settings (optional `?namespace=`)   |
| GET    | `/:namespace/:key`              | Read one setting                         |
| POST   | `/`                             | Upsert a setting (validated + audited)   |
| POST   | `/bulk`                         | Upsert many in one call                  |
| POST   | `/reset`                        | Reset a namespace to defaults            |
| GET    | `/audit/log`                    | Recent settings changes                  |
| GET    | `/catalogue/locales`            | Enabled locales                          |
| GET    | `/catalogue/timezones`          | Enabled timezones                        |
| GET    | `/connections`                  | Connected third-party accounts           |
| POST   | `/connections`                  | Link a third-party account               |
| DELETE | `/connections/:id`              | Revoke a linked account                  |
| GET    | `/data-requests`                | List GDPR export/erasure requests        |
| POST   | `/data-requests`                | Submit GDPR request                      |

## Namespaces
- `general` — `theme`, `density`
- `locale` — `language`, `timezone`, `date_format`, `currency`
- `accessibility` — `reduce_motion`, `high_contrast`, `font_scale`, `keyboard_only`
- `privacy` — `profile_visibility`, `searchable_by_email`, `data_sharing_marketing`
- `profile` — `show_activity_feed`, `show_endorsements`
- `connections` — managed via `/connections` endpoints

## Validation rules (service-level)
- `general.theme`: `light|dark|system`
- `general.density`: `compact|comfortable|spacious`
- `accessibility.font_scale`: `0.75 ≤ n ≤ 2.0`
- `privacy.profile_visibility`: `public|connections|private`
- All boolean toggles strictly typed as `boolean`
- Unknown keys are accepted (forward-compat) but unvalidated

## Persistence
- `settings` — one row per (identity, scope, namespace, key)
- `locales`, `timezones` — reference catalogues
- `connected_accounts` — third-party links (Google, GitHub, Slack, etc.)
- `settings_audit` — append-only change log
- `data_requests` — GDPR export / erasure / rectification (UK posture)

## Analytics (FastAPI)
- `POST /settings/insights` — flags missing essentials (timezone, language,
  theme), inconsistent privacy posture, accessibility consistency hints.
  Deterministic; no model.

## Mobile parity
`apps/mobile-flutter/lib/features/settings/settings_api.dart` covers list,
upsert, bulk, reset, locale catalogue, timezone catalogue, connections,
revocation, GDPR requests. Mobile UX:
- ListView grouped by namespace, bottom-sheet editors per row
- Locale/timezone catalogues cached, refreshed on cold start
- Accessibility toggles surfaced at the top level
- Connections: swipe-left to revoke
- Data requests: confirmation dialog before submit

## SDK
`packages/sdk/src/index.ts` — `sdk.settings.*` namespace with 13 typed methods
and contracts (`Setting`, `SettingNamespace`, `Locale`, `Timezone`,
`ConnectedAccount`, `DataRequest`, `SettingsAuditEntry`).

## Tests
- Jest: `apps/api-nest/test/settings.service.spec.ts` — validation, audit,
  bulk, reset, GDPR.
- Pytest: `apps/analytics-python/tests/test_settings.py` — insights cards.
- Playwright: `tests/playwright/settings.spec.ts` — endpoint mount + page render.

## Completion gate
- ✅ Build: migration + seeder + NestJS module + DTOs + repo + service + controller
- ✅ Integration: SDK namespace `sdk.settings.*`, Flutter parity, controller mounted, analytics router mounted
- 🟡 Validation: Jest + pytest + Playwright suites added; per-page frontend swap from local-state toggles to `sdk.settings.upsert(...)` is the next pass

## Hardening pass (3-per-turn sweep)

- **Pagination envelope**: list endpoints return `{ items, total, limit, hasMore }`.
- **Audit**: state changes recorded via `AuditService.record({...})` (object signature).
- **RBAC**: ownership/visibility checks in service layer.
- **Idempotency**: write endpoints accept `Idempotency-Key` header.
- **Mobile parity**: Riverpod providers + AsyncStateView screens registered in router.
