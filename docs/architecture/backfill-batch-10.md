# Backfill batch 10 — Identity, Entitlements, Search, Auth, Overlays

Closes the remaining 5 schema files referenced by `packages/db/src/schema/index.ts`.

## Schemas
- `identity.ts` — `identities`, `identity_org_memberships`, `identity_handles`
- `entitlements.ts` — `plans`, `subscriptions`, `role_grants`, `entitlement_grants`, `entitlement_denials`
- `search.ts` — `search_index` (GIN tsvector + trigram), `search_history`, `search_clicks`, `saved_searches`, `command_palette_items`, `command_shortcuts`
- `auth.ts` — `auth_credentials`, `auth_sessions`, `auth_oauth_connections`, `auth_mfa_factors`, `auth_password_resets`, `auth_issued_tokens`
- `overlays.ts` — `workflow_definitions`, `overlay_drafts`, `overlay_snapshots`, `undo_tombstones`, `overlay_events`

## Migrations
`0053`–`0057` with strict CHECK constraints on every status enum, `ON DELETE CASCADE` for child rows, unique indexes for natural keys, and `pg_trgm` + `to_tsvector('english', …)` GIN indexes for full-text + fuzzy match.

## Seeders
`0053`–`0057` are idempotent (`DO $$ … $$` + `ON CONFLICT DO NOTHING`). Must be skipped under `NODE_ENV=production`.

## Flutter wiring (12 new routes in `apps/mobile-flutter/lib/app/router.dart`)
`/identity/switch`, `/identity/:id`, `/plans`, `/entitlements`, `/search/v2`, `/commands`, `/auth/v2/sign-in`, `/auth/v2/sessions`, `/auth/v2/mfa`, `/create`, `/drafts`.

## Open follow-ups
- Wire NestJS modules + repositories for these 5 domains.
- Replace mock state in search_v2 with real `/search` API calls.
- Promote VideoViewer to 8K HLS/DASH with device codec/GPU detection.
- Enforce `NODE_ENV=production` guard on seeder runner.
