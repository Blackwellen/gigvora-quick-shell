# Master Sign-Off Matrix — Gigvora Final Release Gate

Source: user-issued Master Sign-Off Rules (post-D28).
Status: **active** · binding gate for release · supersedes any per-domain "complete" claim that lacks evidence.

## Master Sign-Off Rules (verbatim intent)

1. **No box may be ticked complete merely because code was generated.** Completion requires:
   - Repository evidence (files, modules, migrations on disk)
   - Working routes (TanStack `src/routes/*` registered, not legacy `src/pages/*` only)
   - Integrated data (real DB rows, real API responses, no mock arrays)
   - Valid runtime config (env vars, secrets, feature flags wired)
   - Observable browser or terminal success (Playwright pass, curl/SDK pass, screenshot/log artefact)
2. **All site-map pages accounted for.** Any page intentionally absorbed into another execution domain must be explicitly logged in `docs/sitemap.md` with the absorbing domain ID.
3. **All forms, edits, and creation flows enterprise-enriched** — not minimally functional. Includes jobs, gigs, projects, settings, webinars, podcasts, videos, reels, and all comparable creation surfaces. Baseline = the 10-step wizard pattern from `mem://features/commercial-builders`.
4. **All media players and editors fully operational** before release sign-off. **Reels and reels editing receive special priority** for mobile interaction quality (per `mem://features/media-ecosystem`).
5. **Final release is blocked** until security, speed, compliance, mobile parity, and final documentation are all evidenced.

## Final Sign-Off Matrix (13 gates)

| # | Gate | Complete | Evidence Logged | Owner Sign-Off | Release Allowed | Mapped D-domains | Current state (per Run 1 audits) |
|---|------|:-:|:-:|:-:|:-:|---|---|
| G01 | Supabase fully removed or isolated from production responsibilities | ☐ | ☐ | ☐ | ☐ | D02, D04 | **Blocked** — D02 audit confirms Supabase still in production path; `packages/db` Drizzle layer exists but cutover incomplete. |
| G02 | PostgreSQL + Drizzle schema/migrations/factories/seeders verified across all execution domains | ☐ | ☐ | ☐ | ☐ | D02, D03, D22 | **Partial** — schema + migrations + seeders present (`database/migrations/*`, `database/seeders/*`); per-domain coverage audit pending. |
| G03 | NestJS backend complete and route-aligned to site map | ☐ | ☐ | ☐ | ☐ | D04, D05–D20 | **Partial** — 50+ Nest modules present; route-to-site-map alignment unverified (D27 P0: no canonical `docs/sitemap.md`). |
| G04 | Integrations / connectors / webhooks / BYOK / providers complete | ☐ | ☐ | ☐ | ☐ | D19, D20 | **Partial** — `apps/integrations/src/{email,payments,voice}` exist; webhook-signature audit pending; BYOK surfaces per `mem://tech/byok-integrations` not E2E-verified. |
| G05 | ML, analytics, workers, queues, and OpenSearch fully wired | ☐ | ☐ | ☐ | ☐ | D21, D22, D23 | **Blocked** — D21 recommendations bridge dead; D22 BullMQ register/cron/DLQ unverified; D23 OpenSearch mappings + indexer + saved-search worker not built. |
| G06 | Missing pages, tabs, and components created and integrated | ☐ | ☐ | ☐ | ☐ | D27 | **Blocked** — D27 audit: 499 legacy pages in `src/pages/`, **0 routes** in `src/routes/`. TanStack migration 0%. |
| G07 | Real data only in production surfaces with realtime where required | ☐ | ☐ | ☐ | ☐ | D24 | **Blocked** — D24 audit: no Socket.IO server, demo arrays still embedded across feed/messages/notifications surfaces. |
| G08 | Players / editors / media / donation / payment flows complete | ☐ | ☐ | ☐ | ☐ | D08, D09, D10, D14 | **Partial** — UI shells exist; reels editor + podcast/webinar players + donation checkout end-to-end unverified. **Reels = special priority.** |
| G09 | Browser / terminal logic flows and Playwright suites passing | ☐ | ☐ | ☐ | ☐ | D27 | **Blocked** — 66 specs are shallow `body.toBeVisible()` smoke; no `tests/logic-flow/*` SDK harness; no a11y / visual-regression / mobile-viewport coverage. |
| G10 | Forms, edits, and creation flows enriched (enterprise-grade) | ☐ | ☐ | ☐ | ☐ | D06, D07, D11, D27 | **Blocked** — D27: only 11 of 499 pages use `useForm` or `<form>` (~2%). 10-step wizard pattern not propagated to all creation surfaces. |
| G11 | Mobile app parity and native wiring complete | ☐ | ☐ | ☐ | ☐ | D26 | **Blocked** — D26 audit: no `android/` or `ios/` shells; no Firebase/FCM; tokens in plain `shared_preferences`; no biometric / cert-pinning; no socket_io_client; no reels-first bottom nav; no `PrivacyInfo.xcprivacy`. |
| G12 | Security, performance, GDPR / legal / FCA-safe posture signed off | ☐ | ☐ | ☐ | ☐ | D25, D28 | **Blocked** — D28 audit: helmet+throttler+pino partially wired; no per-directive CSP/HSTS-preload, no per-route rate budgets, no CSRF, no cookie-consent, no DPIA/ROPA, no DSAR/erasure endpoints, no retention worker, no Lighthouse-CI/size-limit, no SBOM, no pentest evidence, no Sentry/OTel central wiring, no FCA-posture/incident-response/DSAR-process docs. |
| G13 | Final docs completed and release package ready | ☐ | ☐ | ☐ | ☐ | D28 | **Blocked** — no `SECURITY.md`, no `CHANGELOG.md`, no `docs/release/checklist.md`, no `docs/release/AGENTS.md` (28-domain × 4-run × 13-track completion ledger), no `docs/sitemap.md`, no `docs/qa/button-actions.md`, no `docs/adr/*`, no `/.well-known/security.txt`. |

## Evidence requirements per gate (binding)

For any gate to advance from ☐ → ☑ in **all four columns**, the following evidence must be linked from this file:

- **Repo evidence**: file paths under `apps/`, `packages/`, `src/routes/`, `database/`, `docs/` — not `src/pages/` legacy tree alone.
- **Data evidence**: migration ID, seeder ID, DB query result, queue topic + consumer, OpenSearch index name + mapping version.
- **UI evidence**: route path under `src/routes/*` (TanStack Start), Playwright spec ID, screenshot path under `docs/qa/screenshots/`, mobile screen path under `apps/mobile-flutter/lib/features/*`.
- **Test evidence**: `pnpm test` log excerpt, `pnpm playwright test` JUnit excerpt, terminal logic-flow harness exit code, `pnpm audit --audit-level=high` clean run, Lighthouse-CI report path.

## Domain → Gate map (for cross-reference during D-runs)

| D-domain | Primary gates | Secondary gates |
|---|---|---|
| D01 Shell/Sitemap/Route Registry | G06 | G09, G13 |
| D02 Postgres/Drizzle authoritative | G01, G02 | G03 |
| D03 Migrations/seeders/factories | G02 | G05 |
| D04 NestJS backend completeness | G03 | G01, G04 |
| D05 Auth/RBAC/Tenancy | G03, G12 | G09 |
| D06 Profiles/Companies/Pages | G03, G10 | G06 |
| D07 Jobs/Gigs/Services/Projects builders | G03, G10 | G08 |
| D08 Video/Podcast/Webinar players | G08 | G03, G11 |
| D09 Reels (special priority) | G08, G11 | G07, G09 |
| D10 Donations/Payments/Escrow | G04, G08, G12 | G03 |
| D11 Settings/Preferences | G10 | G06, G12 |
| D12 Network/Groups/Events | G03 | G06, G07 |
| D13 Feed/Notifications | G03, G07 | G09 |
| D14 Messaging | G03, G07 | G08, G11 |
| D15 Search/Discovery surfaces | G05 | G06 |
| D16 Recommendations | G05 | G09 |
| D17 Inbox/Work/Tasks | G03 | G06 |
| D18 Plans/Entitlements | G03, G12 | G10 |
| D19 Integrations/Connectors | G04 | G03, G12 |
| D20 BYOK/AI Workspace | G04 | G03, G12 |
| D21 Recommendation engine | G05 | G09 |
| D22 Workers/Queues | G05 | G07 |
| D23 OpenSearch/indexers | G05 | G06 |
| D24 Realtime/Streaming | G07 | G09, G11 |
| D25 Internal admin/CS/Finance/Disputes/Trust | G12 | G03, G09 |
| D26 Mobile parity / Flutter / Firebase / native security | G11 | G07, G08, G12 |
| D27 Pages/tabs/components / Playwright / logic-flow | G06, G09, G10 | G13 |
| D28 Security / perf / compliance / docs / release | G12, G13 | all |

## Aggregate posture at this checkpoint

- **Audit phase: ☑ complete** — all 28 D-domain Run 1 audits on disk under `docs/qa/D01-…` through `docs/qa/D28-…`.
- **Build/Integrate/Test/Sign-off phases: ☐ not started** for any of the 13 master gates.
- **Estimated P0 backlog**: ≈140 unique items across G1–G7.
- **Architectural release blockers** (must clear before any gate flips green):
  1. TanStack route migration 0% (G06)
  2. Flutter app non-shippable (G11)
  3. No realtime fabric (G07)
  4. Search system inert (G05)
  5. Recommendation engine dead code (G05)
  6. Security/legal/docs cluster (G12, G13)

## Operating rules going forward

- Every D-domain Run 2/3/4 message must end by updating the relevant gate row(s) in this file with evidence links — not just by writing code.
- A gate flips ☐ → ☑ in the **Release Allowed** column only when all four left columns are ☑ AND the linked evidence is independently re-runnable.
- Reels (G08 + G11 intersection) receives special priority per the Master Sign-Off Rules; do not green-light G08 without reels editor + mobile reels playback + reels publish flow all evidenced.

---
_Last updated: 2026-04-18 (post-D28 Run 1 audit). Next update expected at first Run 2 build closure._
