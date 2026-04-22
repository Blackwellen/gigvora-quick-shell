# Supabase Removal Runbook

## Current usage (web app)
- `src/integrations/supabase/client.ts` — auth + queries
- `src/integrations/supabase/client.server.ts` — admin queries
- `supabase/functions/ai-assistant/index.ts` — edge function for AI gateway

## Replacement plan

| Concern              | Today (Supabase)                | Target                                      |
|----------------------|---------------------------------|---------------------------------------------|
| Auth                 | `supabase.auth`                 | `api-nest /auth/*` + JWT, refresh tokens    |
| DB queries           | `supabase.from(...).select()`   | `@gigvora/sdk` calling api-nest             |
| Storage              | `supabase.storage`              | api-nest signs S3 URLs (media-pipeline)     |
| Realtime             | Postgres changes channel        | Socket.IO gateway in api-nest               |
| Edge functions       | `supabase/functions/*`          | api-nest controllers + workers              |

## Cutover sequence

1. Stand up api-nest + Postgres + migrations (`database/migrations/0001_init.sql`).
2. Backfill from Supabase: `pg_dump` schemas `auth`, `public` → import users + profiles + habits.
3. Issue SDK in `packages/sdk`; replace one feature module at a time in web app.
4. Switch `AuthContext.tsx` from `supabase.auth.*` to `sdk.auth.*` once parity verified.
5. Migrate file uploads to signed S3 (delete Supabase storage usage).
6. Replace realtime subscriptions with Socket.IO channels.
7. Decommission Supabase project; delete `src/integrations/supabase/*` and `supabase/`.

## Verification gate per module
- Functional parity test (Playwright)
- Data drift check (row count + checksum)
- Rollback documented before each cutover step
