# FD-17 — Super Admin Governance, KPI Assignment, CMS/Settings Control & Platform Oversight — Run 1 Audit

Date: 2026-04-18 · Group: G5 · Maps to **Master Sign-Off Matrix → G02 (admin gateway), G03 (backend), G05 (encryption/audit), G07 (CMS truth), G09 (Playwright), G12 (KPI), G13 (runbooks)**.

> Scope: prove the super-admin control plane + every system-level master setting + CMS/legal truth surfaces + KPI assignment + feature flags + role/entitlement control + emergency controls are real, encrypted, audited, role-locked end-to-end.

## 1. Inventory snapshot

### Super-Admin
- ✅ `src/pages/admin/SuperAdminPage.tsx`, `InternalAuditPage.tsx`.
- ✅ Nest module `super-admin-command-center` (controller/service/repository/dto present, supports flags + overrides + incidents + audit per `packages/sdk/src/super-admin-command-center.ts`).
- ✅ Routes scaffolded: `/internal/super-admin-command-center/{flags,overrides,incidents,audit}` (Playwright spec mounts).

### Settings (per-surface, NOT master platform)
- ✅ User/role-scoped settings exist: `settings/SettingsPage`, `IntegrationsSettingsPage`, `WebsiteSettingsPage`, `org/OrgSettingsPage`, `dashboard/DashboardSettingsPage`, plus 12+ surface-local settings pages.
- ✅ Nest module `settings` (per-identity preferences + connections + GDPR).

### CMS / Legal
- ✅ Public pages exist: `PrivacyPage`, `TermsPage`, `UserAgreementsPage`, `legal/AdvertisingPolicyPage`, `AppealsPolicyPage`, `CreatorMonetizationPolicyPage`, `DisputesPolicyPage`, `PaymentsEscrowPolicyPage`.
- ❌ All are **hardcoded markdown/JSX** — no CMS-backed source, no version history, no super-admin edit surface.

## 2. Findings

### 🚨 P0 (release blockers)
1. **No master "site control" settings store** — no `platform_settings` table holding site-name/logo/favicon/default-locale/default-timezone/maintenance-mode/branding tokens; no super-admin page to edit them. WebsiteSettingsPage is per-tenant, not platform.
2. **No finance/escrow master settings** — no `platform_finance_settings` (commission %, escrow hold period, payout cadence, FX margins, dispute SLA, FCA-safe limits). Cross-cuts FD-16.
3. **No master notification settings** — no platform-wide channel toggles, throttle defaults, quiet hours, fanout caps; no `platform_notification_settings`.
4. **CMS settings absent** — no `cms_documents` table (terms/privacy/user-agreement/cookie/legal pages) with versioning + draft/publish + diff + locale variants; legal pages currently hardcoded React.
5. **T&Cs/Privacy/User-Agreement editor missing** — no super-admin WYSIWYG/markdown editor, no version-pinning per user (consent record), no "force re-accept on change" flow.
6. **Mobile app settings absent** — no `mobile_app_settings` (min supported version, force-update, kill switches per feature, deep-link routes, store URLs, MOTD).
7. **Logo/Favicon management absent** — no upload+CDN flow, no light/dark variants, no per-locale variants, no consumed-by-shell wiring.
8. **API/SMTP/Connector/Database master settings absent** — no `platform_api_settings` (rate limits, CORS allow-list, default pagination), no `platform_smtp_settings` (provider, from, reply-to, footer, BIMI/DKIM check, encrypted creds), no `platform_connector_settings` (BYOK defaults, allowed providers, scope policy), no `platform_db_settings` (read-replica routing, slow-query thresholds, retention policies).
9. **KPI assignment surface missing** — no super-admin UI to define `kpi_definitions` (FD-13), bind to portals (Marketing/CS/Finance/Moderator/AdminOps), preview, role-target, schedule recalculation. Cross-cuts FD-13+FD-15+FD-16 P0s.
10. **Feature flags/portal entitlement control surfaces incomplete** — backend SDK exists (`FeatureFlag`+`PlatformOverride`), but no super-admin pages for flag rollout (segments+variants+envs), no `portal_entitlements` table mapping internal roles → portal sidebar items, no per-tenant entitlement overrides UI.
11. **Internal role control absent** — no super-admin UI to mint/freeze internal roles (`viewer`/`sa_operator`/`sa_admin`/`sa_root`/`finance_*`/`moderator_*`/`cs_*`), no role-membership audit, no "step-up to assign role" flow.
12. **Emergency controls partial** — `incident_mode` referenced in memory but no global kill-switch matrix surface (per-domain kill switches, write-freeze, read-only mode, banner publisher, rollback button), no break-glass audit.
13. **Sensitive-settings encryption + audit missing** — no envelope encryption for SMTP creds / connector secrets / DB DSN / signing keys; no `platform_settings_audit` append-only log of who changed what + reason + IP + step-up proof.
14. **Role-lock enforcement unverified** — no `@SuperAdminGuard` decorator + ABAC policy + Playwright proof that non-`sa_root` cannot mutate sensitive settings; no "two-person rule" for critical changes (e.g. payout cadence, kill switch).
15. **CMS document consent ledger absent** — no `cms_consents` (identity_id × document_id × version × accepted_at × ip × user_agent); GDPR/legal exposure.
16. **No Playwright "every super-admin sidebar item routes + RBAC denies non-root" spec**.

### P1
17. No realtime push for super-admin (incident mode toggled, kill-switch flipped, emergency banner published, role assigned) — cross-cuts FD-14.
18. No mobile parity for super-admin emergency banner consumption + force-update enforcement.
19. No DSAR redaction on `platform_settings_audit` (reason field may contain PII).

## 3. Run 2 build priorities (FD-17)

### A. Master settings backbone
- New Nest module `platform-governance/` with sub-controllers: `site`, `finance`, `escrow`, `notification`, `cms`, `mobile-app`, `branding` (logo/favicon), `api`, `smtp`, `connector`, `database`.
- New tables: `platform_settings` (kv with namespace+key+value+encrypted_flag+version), `platform_finance_settings`, `platform_notification_settings`, `platform_api_settings`, `platform_smtp_settings` (envelope-encrypted), `platform_connector_settings`, `platform_db_settings`, `mobile_app_settings`, `platform_branding_assets`, `platform_settings_audit` (append-only).
- Envelope encryption (KMS DEK + per-platform KEK) for SMTP creds / connector secrets / DB DSN / signing keys; reveal flow with step-up + reason + auto-redact 60s; writes to `platform_settings_audit`.
- Two-person rule for critical changes (payout cadence, kill switch, role mint, T&Cs publish): proposer + approver, both `sa_root`, both step-up'd, reason required.

### B. CMS + consent
- New tables: `cms_documents` (slug+title+body_md+locale+version+status draft|published|archived+published_at+published_by), `cms_consents` (identity_id × document_id × version × accepted_at × ip × ua), `cms_revisions` (full diff history).
- Super-admin CMS editor with markdown + live preview + locale switcher + "publish forces re-accept" toggle.
- Consumer hooks: `useCmsDocument(slug)` for legal pages; on version bump force re-accept modal at next login.

### C. KPI assignment
- Super-admin UI bound to FD-13 `kpi_definitions` (define formula + portal target + role target + recalc schedule + preview); writes to `platform_settings_audit`; live preview pulls FD-13 analytics service.

### D. Flags + portal entitlements + roles
- Super-admin UI for `feature_flags` rollout (segments + variants + envs + percentage + kill switch); `portal_entitlements` table mapping internal roles → portal sidebar items with per-tenant overrides.
- Internal role mint/freeze UI with step-up + audit; role-membership table `internal_role_grants` (identity_id × role × granted_by × granted_at × expires_at × reason).

### E. Emergency control matrix
- `platform_kill_switches` (key + state on|off + scope global|domain|tenant + flipped_by + flipped_at + reason); UI matrix with one-click flip + 5-second confirm + two-person rule for global.
- `platform_incident_banners` (id + severity + body_md + audience public|authed|internal + active + published_by + published_at); consumed by shell + mobile.
- "Write-freeze" and "read-only mode" implemented as middleware respecting kill-switch state.

### F. Cross-cutting
- `@SuperAdminGuard` + ABAC policies enforcing `sa_root` for sensitive mutations; Playwright proof non-root denied.
- Realtime channels (FD-14): `sa:incident-mode`, `sa:kill-switch`, `sa:banner`, `sa:role-grant`.
- Mobile parity for emergency banner + force-update enforcement.
- 14 Playwright specs: super-admin sidebar wiring + RBAC deny + setting edit-with-audit + reveal-with-step-up + two-person approval flow + CMS publish + force re-accept + KPI define-preview + flag rollout transition + role mint + kill-switch flip + banner publish + write-freeze enforcement + mobile force-update.
- Runbooks: `super-admin-incident.md`, `cms-publish.md`, `emergency-controls.md`, `role-grant.md`.

## 4. Acceptance criteria (binding)
- A1. All 11 master settings surfaces live + role-locked + audited; sensitive fields envelope-encrypted with reveal-step-up.
- A2. CMS-backed terms/privacy/user-agreement with versioning + consent ledger + force re-accept on publish.
- A3. Mobile app settings live (min version, force-update, deep-links, store URLs) + consumed by mobile.
- A4. KPI assignment UI bound to FD-13; preview + portal target + role target + recalc schedule.
- A5. Feature flags rollout UI + portal entitlement matrix + per-tenant overrides.
- A6. Internal role mint/freeze + grants table + step-up + audit.
- A7. Emergency control matrix (kill switches + banners + write-freeze) + two-person rule for global flips.
- A8. `platform_settings_audit` append-only with reason + IP + step-up proof; non-`sa_root` denied; Playwright proven.
- A9. Realtime push for incident-mode/kill-switch/banner/role-grant; mobile parity proven.
- A10. ≥14 Playwright specs green; 4 runbooks published; DSAR redaction on audit log proven.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._
