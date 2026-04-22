# Gigvora Release Package — FD-18 Run Final

**Owner:** Platform Engineering   **On-call rota:** see `docs/runbooks/oncall.md`

## 1. Changelog (since last release)

### Added
- AD-016 Admin Terminal portal hub + multi-tab system (browser-style)
- AD-017 Marketing Admin Portal — ads moderation, campaigns, traffic, IP, location, SEO, inbox, emails, tasks, notices
- AD-018 Customer Service Admin Portal — tickets, escalations, internal/customer chat, emails, notices, KPIs
- AD-019 Finance Admin Portal — transactions, escrow, records, subscriptions, credits, earnings, commissions, ad-spend, bank details (encrypted)
- AD-020 Moderator & Trust Review Portal — live feed, chat lists, comments, documents, ads, companies, users
- AD-021 Admin Ops & Site Control Portal — gigs/webinars/projects/jobs/podcasts/videos/reels/users/companies plus 12 settings surfaces
- AD-022 Super Admin Governance — KPI creation, feature flags, admin accounts, emergency controls, audit, entitlements
- Role-scoped admin notification tray with WebSocket live stream + ML risk badges
- Universal Admin → Any User messaging (`MessageUserDialog`, audit-logged)
- Hard-isolated admin shell: env ribbon, slim chrome, tab strip, isolation guard
- Interview player + Reels player + Reels editor (FD-18 G04)
- Checkout state machine (FD-18 G07) + tests
- Mobile Flutter scaffolds: Firebase, splash, AndroidManifest, iOS Info.plist
- Sitemap + robots generator, axe-core a11y runner, Lighthouse runner
- 84-spec FD-18 Playwright suite

### Changed
- All admin product flows route through the Gigvora SDK / NestJS backend (no Lovable Cloud)
- AdminShell density tightened (header py-2, sidebar w-56/w-12)

### Removed
- Supabase from product surfaces (`packages/sdk/src/*` is now the ingress)

## 2. Runbook

- **Build:** `bun install && bun run build`
- **Dev:** `bun run dev`
- **Tests:** `bun run test` (unit) · `bunx playwright test` (e2e)
- **Migrations:** none in this release; admin auth + tables managed by NestJS
- **Feature flags:** managed in `/admin/super/flags` — see Super Admin guide
- **Rollout pattern:** dark-launch (10% → 50% → 100%) via `rollout_pct` on each flag

## 3. On-call rota

| Shift | Primary | Secondary |
|-------|---------|-----------|
| Mon 09:00–17:00 UTC | TBA | TBA |
| Mon 17:00–01:00 UTC | TBA | TBA |
| Tue 01:00–09:00 UTC | TBA | TBA |
| (rotate weekly) | — | — |

Pager: PagerDuty service `gigvora-prod`. Escalation: 5 min ack window, then secondary, then incident commander.

## 4. Rollback plan

1. **Frontend:** revert preview deployment via the platform UI; previous build is retained for 30 days.
2. **Backend (NestJS):** `kubectl rollout undo deployment/gigvora-api`.
3. **Mobile:** halt staged rollout in Play Console / App Store Connect; previously-shipped binary remains live.
4. **Feature flags:** flip `kill_switch` overrides for the affected domain in `/admin/super/overrides` — takes effect within 30s.
5. **Database:** never run destructive rollback. If a migration must be reversed, ship a forward-fix migration.

## 5. Known limitations

- Reels editor produces a draft + raw blob; server-side encode + caption burn-in is async (≤2 min).
- WCAG and Lighthouse runners are wired but reports must be generated and committed before G08/G09 flip green.
- `apps/mobile-flutter` Firebase options are stubbed until `flutterfire configure` is run.

## 6. Sign-off

This release ships when every row in `docs/qa/FINAL-SIGNOFF-LEDGER.md` is `✅ PROVEN`.
