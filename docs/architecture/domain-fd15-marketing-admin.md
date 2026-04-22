# Domain — FD-15 Marketing Admin Portal (closed)

## Storage
All tables in user's Postgres (`DATABASE_URL`).
Migration: `packages/db/migrations/0088_marketing_admin.sql`.

## Tables
- `marketing_ads_queue`        — review queue with ML risk score + flags
- `marketing_traffic_events`   — pageview/click/convert ingest sink
- `marketing_ip_intel`         — IP reputation + status (watch/block/clean)
- `marketing_seo_audit`        — per-URL SEO snapshots
- `marketing_tasks`            — delegated tasks queue
- `marketing_notices`          — policy/announcement notices
- `marketing_threads` + `marketing_thread_messages` — internal team chat
- `marketing_email_blasts`     — outbound email console
- `marketing_admin_audit`      — append-only audit (UPDATE/DELETE blocked)

## NestJS HTTP surface — `/api/v1/marketing-admin`
| Method | Path | Notes |
|---|---|---|
| GET  | `/ads`            | Queue list (filter: status,risk,q) |
| POST | `/ads/score`      | Score creative via ml-python `/ads-ops/score-creative` (deterministic fallback) |
| POST | `/ads/decision`   | Bulk approve/reject/flag/needs_changes |
| GET  | `/traffic`        | KPIs+sources+pages+countries + funnel summary via analytics-python `/marketing/funnel/summary` |
| GET  | `/ips`            | IP intel rows |
| POST | `/ips/action`     | Bulk watch/block/clear |
| POST | `/ips/score`      | BotDetect via ml-python `/botdetect/score` |
| GET  | `/tasks` POST PATCH | Delegated tasks CRUD |
| GET  | `/notices` POST   | Notices CRUD |

## ML / Analytics integration
- `apps/ml-python/app/ads_ops.py`        → ad creative policy scoring (real)
- `apps/ml-python/app/botdetect.py`      → IP/visitor bot scoring (real)
- `apps/analytics-python/app/marketing.py` → funnel health summary (real)
- All three have deterministic in-process fallbacks in `marketing-admin.ml.service.ts`.

## Frontend
- Hook: `src/hooks/useMarketingAdmin.ts` — TanStack Query hooks for ads, traffic, ips, tasks, notices.
- Existing pages under `src/pages/admin/marketing/` (already routed in `App.tsx` lines 1027-1036, sidebar in `AdminShell.tsx` line 68) — replace fixtures with hook calls per page.

## Security
- Read = `marketing-admin | ads-ops | super-admin | viewer`
- Write = `marketing-admin | ads-ops | super-admin`
- Every mutation writes `marketing_admin_audit` with actor/IP/UA before/after.
