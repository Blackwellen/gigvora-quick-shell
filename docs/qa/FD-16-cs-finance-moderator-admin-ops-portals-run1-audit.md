# FD-16 — Customer Service, Finance, Moderator & Admin Ops Portal Completion — Run 1 Audit

Date: 2026-04-18 · Group: G5 · Maps to **Master Sign-Off Matrix → G02 (admin gateway), G03 (backend), G05 (security/encryption), G06 (realtime), G09 (Playwright), G12 (analytics/ML), G13 (runbooks)**.

> Scope: prove the four operational internal portals are end-to-end real — Customer Service (tickets/task delegation/internal chat/customer chat/emails/notices/notifications/analytics/KPI), Finance (transactions/escrow/projects/gigs/credits/subscriptions/commissions/site earnings/ad spend/held credits/encrypted bank details/analytics/KPI), Moderator (tickets/queues/internal comms/analytics/live feed review/chat lists/comments lists/docs/ads/company+user lists/workflows), Admin Ops (lists across content/commerce/users/companies/mentors/subscriptions/operational controls).

## 1. Inventory snapshot

### Customer Service
- Pages ✅: `support/CustomerServiceDashboardPage`, `MyTicketsPage`, `SupportCenterPage`, `SupportSearchPage`, `TicketDetailPage`, `TicketSubmissionPage`, `HelpArticleDetailPage`, `HelpCategoryPage`, `admin/AdminTicketManagementPage`, `dashboard/DashboardSupportPage`, `ai/AISupportSummarizerPage`, `dashboard/enterprise/EntSupportRiskPage`.
- Nest module ✅: `customer-service`.

### Finance
- Pages ✅: `admin/FinanceAdminPage`, `admin/AdminWithdrawalsPage`, `admin/AdminSubscriptionsPage`, `finance/FinanceHubPage`, `finance/EscrowLedgerPage`, `finance/PayoutsPage`, `contracts/EscrowPage`, `projects/ProjectEscrowPage`, `dashboard/professional/ProEarningsPage`, `dashboard/professional/ProCreditsBillingPage`.
- Nest modules ✅: `finance-admin`, `payouts-escrow-finops`.

### Moderator
- Pages ✅: `admin/ModeratorDashboardPage`, `admin/AdminModerationPage`, `admin/TrustSafetyDashboardPage`, `admin/VerificationComplianceDashboardPage`, `ads/AdsPolicyReviewPage`, `creation-studio/PublishReviewPage`, `disputes/ArbitrationReviewPage`, `groups/GroupModerationPage`, `podcasts/PodcastQueuePage`.
- Nest module ✅: `moderator-dashboard`.

### Admin Ops
- 18 pages under `src/pages/admin/` — workstations exist for Disputes/Moderation/Ops/Reports/Subscriptions/Tickets/Verification/Withdrawals/Finance/TrustSafety/VerificationCompliance/Moderator/SuperAdmin/InternalAuditPage/InternalSearchPage/InternalAdminShell/InternalAdminLogin.

### Critical absence — encrypted bank details
- Grep for `encrypted.*bank|bank.*encrypted|payout_method|bank_account` returns **zero hits** across `src/`, `apps/`, `packages/`. **Finance portal cannot pay out** — required by domain depth.

## 2. Findings

### 🚨 P0 (release blockers)
1. **Encrypted bank details infrastructure missing** — no `payout_methods`/`bank_accounts` table, no envelope encryption (KMS/Vault), no admin reveal-with-audit flow, no FCA-safe access logging. Finance payouts cannot operate compliantly.
2. **Held credits + commissions + site earnings + ad spend ledgers not separated** — no canonical double-entry tables (`fin_ledger_entries`, `fin_balances`, `fin_commission_runs`, `fin_held_credits`, `fin_ad_spend`); audit reveals only generic finance pages.
3. **Customer chat (live operator↔customer) missing** — only ticket pages exist; no real-time chat surface, no presence, no transcripts (cross-cuts FD-14 realtime).
4. **Internal chat for ops missing across all four portals** (cross-cuts FD-15 P0).
5. **Task delegation queue missing** in CS portal — no `cs_delegated_tasks` table, no assignment UI.
6. **Notices + notifications surfaces missing** in CS/Finance/Moderator portals (cross-cuts FD-15).
7. **KPI cards missing across all four portals** — cross-cuts FD-13 P0 (no `kpi_definitions`).
8. **Live feed review missing** in moderator portal — no streaming queue, no inline action toolbar, no SLA timers.
9. **Chat lists / comments lists / docs / ads moderation tabs missing** in moderator portal (only Ads policy review partial).
10. **Company / user / mentor lists missing** in admin ops — no master CRUD/list pages with bulk actions, exports, or governance hooks.
11. **Held credits visibility absent** — users + admins cannot see what credits are pending release after refund/dispute.
12. **No "every sidebar item routes" Playwright spec** for any of the four portals (cross-cuts FD-15).
13. **No double-entry invariant test** (sum of debits = sum of credits per period); finance integrity unenforced.
14. **No FCA-safe access audit** on bank/payout reveal; no `fin_access_log` append-only table.

### P1
15. No realtime push for ticket SLA breach, payout failure, moderation queue depth, dispute SLA breach (cross-cuts FD-14).
16. No mobile parity for CS triage, finance approvals, moderator queue actions.
17. No DSAR redaction on tickets/chat transcripts; no retention policy on `cs_chat_messages`.

## 3. Run 2 build priorities (FD-16)

### A. Finance integrity (highest urgency)
- New tables: `fin_ledger_entries` (double-entry, append-only), `fin_balances` (materialized per account), `fin_commission_runs`, `fin_held_credits`, `fin_ad_spend`, `payout_methods` (envelope-encrypted, AES-256-GCM via KMS DEK + per-tenant KEK), `fin_access_log` (append-only reveal trail).
- New Nest module `finance-portal/` consolidating: transactions/escrow/projects/gigs/credits/subscriptions/commissions/site earnings/ad spend/held credits/payout methods/analytics/KPI controllers — each with RBAC `finance_operator < finance_admin < finance_root`.
- Reveal flow: bank details masked by default; reveal requires step-up auth + writes to `fin_access_log` with reason; auto-redact on screen after 60s.
- Double-entry invariant trigger; nightly reconciliation job (cross-cuts FD-14 cron).

### B. Customer Service
- Customer↔operator chat over FD-14 realtime channel `cs:thread:{id}` with presence + typing + transcript persistence.
- `cs_delegated_tasks` table + assignment UI + SLA timers.
- AI ticket summarizer (already partial in `AISupportSummarizerPage`) wired to `customer-service` module.
- KPI cards (avg first response, resolution time, CSAT, backlog) bound to FD-13 `kpi_definitions`.

### C. Moderator
- Live feed review surface: streaming pub/sub of new posts/comments/media with inline approve/reject/escalate; SLA timers; bulk actions.
- Chat lists / comments lists / docs / ads moderation tabs each backed by their own queue table + ML classifier scoring (FD-12 ONNX).
- Company/user/mentor moderation list pages with risk score, last action, restriction state.

### D. Admin Ops master lists
- Generic `AdminListPage` framework with: server-side pagination, advanced filters (cross-cuts AdvancedFilterPanel), bulk actions, exports (CSV/XLSX via FD-13 reporting), inline drawers, audit trail.
- Concrete instances: content/commerce/users/companies/mentors/subscriptions/credits/refunds/disputes/verifications/withdrawals.

### E. Cross-portal
- Sidebar registry per portal + Playwright "no dead link" spec.
- Realtime channels: ticket SLA breach, payout failure, moderation depth, dispute SLA breach.
- DSAR redaction + retention on tickets/chat/access logs.
- Mobile parity for CS triage + finance approve + moderator queue actions.
- 16 Playwright specs covering: ticket assign+resolve, customer chat round-trip, payout reveal-with-audit, double-entry invariant, moderator queue transition, live feed approve/reject, admin list filter+export, sidebar wiring per portal.
- Runbooks: `cs-incident.md`, `finance-incident.md`, `moderator-incident.md`, `admin-ops-incident.md`.

## 4. Acceptance criteria (binding)
- A1. Encrypted bank details with envelope encryption + reveal audit live; FCA-safe access logged.
- A2. Double-entry ledger with invariant trigger + nightly reconciliation green.
- A3. Held credits + commissions + site earnings + ad spend each have dedicated tables + admin surfaces.
- A4. CS customer chat + delegated tasks + KPI cards live; SLA timers proven.
- A5. Moderator live feed review + chat/comments/docs/ads tabs + company/user/mentor lists live; bulk actions audited.
- A6. Admin ops `AdminListPage` framework + ≥10 concrete instances with filter/export/bulk.
- A7. Sidebar registry + Playwright "no dead link" green for all four portals.
- A8. Realtime push for ticket SLA / payout failure / moderation depth / dispute SLA.
- A9. Mobile parity for CS triage + finance approvals + moderator queue actions.
- A10. ≥16 Playwright specs green; 4 runbooks published; DSAR redaction + retention proven.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
