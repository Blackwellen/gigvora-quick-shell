# FD-15 — Admin Root Portal, Portal Router, Marketing Portal & Cross-Portal Completion — Run 1 Audit

Date: 2026-04-18 · Group: G5 · Maps to **Master Sign-Off Matrix → G02 (admin gateway), G03 (backend), G06 (realtime), G09 (Playwright), G12 (analytics/ML), G13 (runbooks)**.

> Scope: prove admin landing routes every button into the correct portal, marketing admin portal is fully operational (ads moderation + ads records + traffic analysis + IP analysis + location analysis + SEO + internal chat + emails + delegated tasks + notices + notifications + stats + analytics + super-admin-defined KPI cards), every sidebar item resolves to a real wired page.

## 1. Inventory snapshot

### Admin shell
- `src/pages/admin/` holds **17 pages** including `InternalAdminShellPage`, `InternalAdminLoginPage`, `InternalAuditPage`, `InternalSearchPage`, `SuperAdminPage`, plus 9 `Admin*Page.tsx` workstations (Disputes/Moderation/Ops/Reports/Subscriptions/Tickets/Verification/Withdrawals/Finance) and `FinanceAdminPage`.
- **No marketing admin shell page** — grep for `marketing.admin`/`MarketingAdmin`/`/internal/marketing` returns zero hits in `src/`.
- Admin root (`AdminPage.tsx`) exists but no audit confirmed all sidebar items wire to real routes.

### Nest modules
- `apps/api-nest/src/modules/` includes `internal-admin-shell`, `internal-admin-login-terminal`, `super-admin-command-center`, `marketing`, `finance-admin`, `ads-ops`, `ads-manager-builder`, `ads-analytics-performance`. ✅ scaffolds present.
- **No dedicated `marketing-admin` module** — `marketing` module is generic; no controllers for ads moderation, ads records, traffic/IP/location analysis, SEO, notices, delegated tasks.

### Marketing portal sub-tooling (the 13 required surfaces)
| Required surface | Page exists? | Nest module? | Wired? |
|---|:-:|:-:|:-:|
| Ads moderation | ☐ | ☐ | ☐ |
| Ads records | ☐ | ☐ | ☐ |
| Traffic analysis | ☐ | ☐ | ☐ |
| IP analysis | ☐ | ☐ | ☐ |
| Location analysis | ☐ | ☐ | ☐ |
| SEO admin | ☐ | ☐ | ☐ |
| Internal chat | ☐ | ☐ | ☐ |
| Emails (admin outbox) | ☐ | ☐ | ☐ |
| Delegated tasks | ☐ | ☐ | ☐ |
| Notices | ☐ | ☐ | ☐ |
| Notifications | partial (`NotificationsPage`) | ☐ | ☐ |
| Stats | ☐ | ☐ | ☐ |
| Analytics | partial (ads analytics) | partial (`ads-analytics-performance`) | ☐ |
| Super-admin KPI cards | ☐ | ☐ (cross-cuts FD-13 P0) | ☐ |

### Sidebar wiring
- No audit script proves every internal sidebar item resolves to a real route file. `InternalAdminShellPage` likely renders a static menu — needs per-item route mount verification.

## 2. Findings

### 🚨 P0
1. **No marketing admin portal exists.** Zero pages, zero module, zero routes for the 13 required surfaces (ads moderation/records, traffic/IP/location analysis, SEO, internal chat, emails, delegated tasks, notices, notifications, stats, analytics, KPI cards).
2. **Admin root sidebar wiring unverified.** Without a "every sidebar item resolves to a mounted route" Playwright spec, dead links will ship.
3. **Super-admin KPI cards not implemented** — cross-cuts FD-13 P0 (no `kpi_definitions` table, no admin define/edit UI, no unset-state handling).
4. **Ads moderation pipeline missing** — `ads-ops` module exists but has no moderation queue, no policy violations table, no appeal flow, no content classifier hookup (cross-cuts FD-12 ML moderation).
5. **Traffic/IP/location analysis missing** — no edge-collected request log, no GeoIP enrichment, no admin surfaces. Required for fraud, compliance, and FCA geo-restriction enforcement.
6. **SEO admin missing** — no per-route meta override store, no sitemap admin, no robots editor, no canonical management.
7. **Internal chat for ops missing** — operators have no thread-bound channel for incident handoff (cross-cuts FD-14 realtime).
8. **Admin emails outbox missing** — no surface for transactional email previews, suppression management, bounce review (cross-cuts `email_send_log`).
9. **Delegated tasks missing** — no task assignment/triage queue between admin operators.
10. **Notices missing** — no platform-wide notice composer (banner/maintenance/incident), no targeting (env/role/region), no schedule.
11. **Stats vs Analytics distinction not implemented** — required as separate surfaces; only ads analytics partial.
12. **No "every button routes" Playwright coverage** for admin root or marketing portal.

### P1
13. No role-aware filtering of sidebar items (`viewer` vs `sa_operator` vs `sa_admin` vs `sa_root`).
14. No mobile parity for admin portals.
15. No `/internal/marketing` operator surfaces wired to status board.

## 3. Run 2 build priorities (FD-15)
- New `apps/api-nest/src/modules/marketing-admin/` with sub-controllers: `ads-moderation`, `ads-records`, `traffic-analysis`, `ip-analysis`, `location-analysis`, `seo`, `ops-chat`, `emails`, `delegated-tasks`, `notices`, `stats`. Each with DTOs + RBAC gates + audit ledger writes.
- New tables: `ma_ads_moderation_queue`, `ma_ads_records`, `ma_request_log` (edge-collected, GeoIP-enriched), `ma_seo_overrides`, `ma_ops_threads`+`ma_ops_messages`, `ma_delegated_tasks`, `ma_notices`, `ma_email_outbox` (or view over `email_send_log`).
- New pages under `src/pages/admin/marketing/`: 13 surfaces above + super-admin KPI define/edit/preview (binds to FD-13 plan).
- Sidebar registry `src/lib/admin/sidebar.tsx` becomes single source of truth; Playwright spec asserts every entry mounts a non-404 page.
- Realtime: ops-chat + delegated-tasks + notices + ads-moderation queue depth use FD-14 realtime channels.
- Tests: 12+ Playwright specs covering sidebar wiring, ads moderation transitions, notice publish, delegated task assignment, KPI define/preview.
- Runbook `docs/runbooks/marketing-admin-incident.md`.

## 4. Acceptance criteria (binding)
- A1. All 13 marketing admin surfaces shipped with real Nest controllers + tables + RBAC + audit + UI.
- A2. Sidebar registry + Playwright spec proves zero dead links across admin root and marketing portal.
- A3. Super-admin KPI define/edit/preview live and bound to FD-13 `kpi_definitions`.
- A4. Ads moderation queue uses FD-12 ONNX classifier + appeal flow.
- A5. Traffic/IP/location analysis backed by edge-collected `ma_request_log` with GeoIP + retention.
- A6. SEO admin writes per-route overrides consumed by `usePageMeta`/`PageSEO`.
- A7. Ops-chat + delegated-tasks + notices push via FD-14 realtime; counters live.
- A8. Mobile parity for KPI strip + notices banner.
- A9. ≥12 Playwright specs green; runbook published.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
