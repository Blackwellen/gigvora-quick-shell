# Gigvora Platform Monorepo

Production-grade multi-service architecture supporting the Gigvora web app.

## Structure

```
apps/
  web/              # existing TanStack Start web app (this repo root)
  mobile/           # React Native / Expo companion app
  api-nest/         # NestJS main API backend
  ml-python/        # FastAPI ML service (ranking, matching, moderation)
  analytics-python/ # FastAPI analytics & BI service
  workers/          # BullMQ async workers
  connectors/       # Enterprise data sync connectors
  integrations/     # Third-party adapters (Stripe, SendGrid, Twilio, OAuth, S3, AI providers)
  webhook-gateway/  # Inbound/outbound webhook handler with signature validation
  search-indexer/   # OpenSearch indexing pipeline
  media-pipeline/   # Image/video/audio processing
packages/
  api-contracts/    # Shared OpenAPI / Zod contracts
  shared-domain/    # Domain types & invariants
  ui-tokens/        # Design tokens (mirrors web src/styles.css)
  sdk/              # Typed client SDK consumed by web + mobile
  shared-config/    # Env loaders, feature flags
database/
  migrations/       # SQL migrations (Postgres)
  seeders/          # Seed data
  fixtures/         # Test fixtures
infrastructure/
  docker/, compose/, scripts/, env/, deployment/
docs/
  architecture/, runbooks/, compliance/
```

## Stack

- **Frontend**: TanStack Start (web) + React Native/Expo (mobile)
- **API**: NestJS (TypeScript)
- **ML/Analytics**: Python + FastAPI
- **DB**: PostgreSQL (primary), Redis (cache/queues), OpenSearch (search), S3 (objects)
- **Realtime**: Socket.IO
- **Workers**: BullMQ
- **Tests**: Jest, Pytest, Playwright

## Supabase Removal Plan

Existing web app uses Supabase for auth/db/storage. Migration path:
1. Stand up `api-nest` auth (JWT + refresh) with PostgreSQL `users` table
2. Mirror `profiles`, `habits`, `habit_logs` schemas in `database/migrations/`
3. Generate typed SDK in `packages/sdk` consumed by web + mobile
4. Swap `@/integrations/supabase/client` calls for SDK calls module-by-module
5. Move file uploads to signed S3 URLs via `media-pipeline`
6. Replace Supabase realtime with Socket.IO gateway in `api-nest`
7. Decommission Supabase project

See `docs/architecture/supabase-removal.md` for the full runbook.
