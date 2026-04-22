### D28 — Security, Performance, Compliance, Documentation, Final Release Sign-Off — Run 1 Audit

Date: 2026-04-18 · Group: G7 (D28/4) · **Final D-domain. Closes the 28-domain QA framework audit phase.**

## Inventory snapshot

- Documentation directory present (`docs/`) with growing `docs/qa/` ledger. All 28 D-domain Run 1 audits now exist (D01–D28).
- `README.md` present at root.
- Tens of legal-adjacent pages exist under `src/pages/` (Terms/Privacy/Cookie variants live in legacy tree).
- Backend: NestJS in `apps/api-nest/`. Plus apps in `apps/integrations`, `apps/workers`, `apps/media-pipeline`, `apps/search-indexer`, `apps/ml-python`, `apps/mobile-flutter`.

## Critical findings

### 🚨 P0 — Security
1. **No global CSP / security-header middleware** — `grep helmet|Content-Security-Policy|X-Frame-Options|HSTS` returns nothing in `apps/api-nest/src`. No HSTS, no X-Frame-Options, no Referrer-Policy, no Permissions-Policy, no CSP. Clickjacking + MIME-sniff + mixed-content + XSS-via-injected-script all unmitigated.
2. **No global rate limiting** — `grep throttler|rate-limit` returns nothing. Brute-force on `/auth/login`, scraping on `/search`, abuse on `/messages.send` all unbounded. The `mem://features/security-authentication` 5-attempt lockout is documented but not enforced at the edge.
3. **No CSRF protection** — `grep csrf` returns nothing. Cookie-auth endpoints accept cross-site POSTs.
4. **Cookie hardening unverified** — no `httpOnly|sameSite=strict|secure` audit on session cookies; refresh tokens may be JS-readable.
5. **No secret-scanning / dependency-audit gate** — no Aikido / Snyk / `pnpm audit --audit-level=high` enforced in CI; vulnerable transitive deps can ship.
6. **No SBOM** — required for FCA-safe + EU CRA posture; absent.
7. **No penetration evidence** — no `docs/security/pentest-{date}.md` summarising last test, scope, findings, remediation.
8. **No DPIA / ROPA** — GDPR Article 30 record-of-processing-activities and Article 35 DPIA absent for high-risk processing (recruitment ML, biometric KYC, ad targeting).
9. **No data-retention engine** — there is no scheduled job that deletes/anonymises personal data per retention policy (job applications, messages, audit logs). Indefinite retention = GDPR breach.
10. **No data-export / right-to-erasure endpoints** — `GET /me/export` (Article 20 portability) and `DELETE /me` (Article 17 erasure) absent or unverified.

### 🚨 P0 — Performance
11. **No performance budget per route** — no Lighthouse-CI thresholds, no Web-Vitals telemetry endpoint, no SLO doc beyond `docs/architecture/slo-mobile.md` which is mobile-only. LCP/CLS/INP regressions invisible.
12. **No bundle-size budget** — no `size-limit` / `bundlesize` / Rollup `manualChunks` strategy verified for the 499-page React tree. Initial JS payload likely catastrophic.
13. **No DB query budget / slow-query log review** — no pg_stat_statements panel, no N+1 audit. With 50+ NestJS modules this is the biggest hidden perf debt.
14. **No CDN / edge-cache headers** — no `Cache-Control` discipline on static assets / public API responses.

### 🚨 P0 — Compliance / Legal
15. **No canonical `/legal/*` route family in TanStack tree** — D27 confirmed `src/routes/` is empty; legal pages live in `src/pages/` only, untested, no head() metadata, no last-updated date discipline, no version history.
16. **No cookie-consent banner** with granular toggles (necessary / analytics / marketing) and consent log.
17. **No age-gating** — recruitment/professional product targets 18+; no DOB attestation flow or under-18 block.
18. **No FCA-safe finance posture doc** — payouts/escrow/donations touch regulated activity. No `docs/compliance/fca-posture.md` declaring what is/isn't a regulated activity, who the operator is, what licences/EMI partner is used (Stripe Treasury / Modulr / etc.), where customer funds sit.
19. **No accessibility statement** (UK Public Sector + EU EAA 2025 require WCAG 2.2 AA conformance statement on `/accessibility`).
20. **No DSAR (Data Subject Access Request) intake** — `/legal/data-request` form + queue + 30-day SLA timer.
21. **No incident-response runbook** beyond the `mem://features/governance-incident-mode` UI toggle — no `docs/security/incident-response.md` with sev levels, on-call rota, comms templates, post-mortem template.

### 🚨 P0 — Documentation / Release
22. **No `SECURITY.md`** — required by GitHub for vulnerability disclosure; absent.
23. **No `CHANGELOG.md`** with semver — release evidence cannot be reconstructed.
24. **No `RELEASE.md` / `docs/release/checklist.md`** — go/no-go gate is informal.
25. **No `AGENTS.md` completion ledger** despite the prompt mentioning AGENT/prompt completion gates — there is no single document where each of the 28 D-domains' Run 1/2/3/4 sign-off is checked off with evidence links.
26. **No architecture decision records** (`docs/adr/000N-*.md`) — design choices unaudited.
27. **No public `/status` page wired to real probes** (`mem://features/system-status-page` declares it; D24 audit flagged realtime fabric absent so probes are likely synthetic).
28. **No observability story** — no Sentry / OpenTelemetry / log-aggregation declared for any of the 50+ NestJS modules; production errors invisible.

### P1
29. No SAST (CodeQL / Semgrep) in CI.
30. No DAST (OWASP ZAP) in CI.
31. No 2FA enforcement on internal admin (`/internal/*`) routes; D25 flagged the admin shell exists but MFA gate unverified.
32. No IP allow-list on internal admin.
33. No tenant-isolation tests (cross-org leak prevention).
34. No backup / restore drill evidence; RPO/RTO undefined.
35. No `robots.txt` / `sitemap.xml` discipline (private routes per `mem://tech/seo-and-metadata-system` must be no-indexed; needs audit).
36. No CORS allow-list on NestJS — likely `*` by default.
37. No file-upload virus-scan (ClamAV / VirusTotal) before persisting to storage.
38. No PII-redaction in logs.
39. No password-reset flow audit (token entropy, expiry, single-use).
40. No webhook-signature verification audit on integrations (Stripe/SendGrid/Twilio).

### P2
41. No localisation legal copy (DE/FR/ES Terms variants) despite multi-region ambitions.
42. No Apple/Google store privacy nutrition-label drafts (D26 echo).
43. No public security.txt (`/.well-known/security.txt`).
44. No bug-bounty programme posture.

## Group-level recap (G1–G7) at D28 close
- **All 28 Run 1 audits now exist** under `docs/qa/D01-…` through `docs/qa/D28-…`.
- **Aggregate P0 count across G1-G7**: ≈140 unique P0s catalogued, dominated by (a) Supabase-removal + NestJS truth (G2), (b) integrations + ML + search + realtime fabric (G6), (c) admin + Flutter native + page→route migration + security/legal (G7).
- **Architectural debts blocking release**: TanStack migration 0% (D27), Flutter app non-shippable (D26), no realtime fabric (D24), search system inert (D23), recommendation engine dead code (D21), zero security headers / rate-limit / CSRF / cookie-consent / DPIA / data-retention / DSAR (D28), no CHANGELOG / SECURITY.md / RELEASE.md / AGENTS.md completion ledger (D28).

## Run 2 build priorities (D28 only)
1. Add `helmet`-equivalent middleware to NestJS bootstrap with HSTS (max-age 63072000; includeSubDomains; preload), CSP (script-src 'self' + nonce), X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy minimal, X-Content-Type-Options nosniff.
2. Add `@nestjs/throttler` global guard: 60 req/min default, 5/min on `/auth/*`, 10/min on `/messages/send`, 30/min on `/search`.
3. Add CSRF double-submit-cookie pattern for all cookie-auth POST/PUT/PATCH/DELETE.
4. Harden cookies: `httpOnly`, `sameSite=lax` for auth, `secure` (HTTPS-only), `path=/`, refresh-token rotated on each use.
5. CI gate: `pnpm audit --audit-level=high` + Aikido scan + Semgrep + CodeQL on every PR; fail on high/critical.
6. Generate SBOM (CycloneDX) per release; commit to `docs/release/sbom-{version}.json`.
7. Author `docs/security/pentest-template.md` + scheduled quarterly pentest entry.
8. Author `docs/compliance/dpia.md` + `docs/compliance/ropa.md` covering recruitment ML, KYC, ad targeting.
9. Build `RetentionWorker` (BullMQ cron) implementing per-table retention policy from `docs/compliance/retention-policy.md`; soft-delete → hard-delete pipeline.
10. Build `GET /api/v1/me/export` (job: zip JSON of all user-owned rows, signed URL, 7-day expiry) + `DELETE /api/v1/me` (Article 17 cascade with audit-log retention exception).
11. Add `web-vitals` reporter on web + `/api/v1/telemetry/web-vitals` ingest + Lighthouse-CI in CI with budgets (LCP<2.5s, CLS<0.1, INP<200ms) per top 20 routes.
12. Add `size-limit` budgets per chunk + Rollup `manualChunks` for vendor splitting.
13. Migrate legal pages to `src/routes/legal/{terms,privacy,cookies,acceptable-use,accessibility,security}.tsx` with head() + last-updated frontmatter + version history under `docs/legal/history/`.
14. Build `<CookieConsentBanner />` with categories (necessary / analytics / marketing) + consent log table + `usePostConsent()` gate for analytics SDKs.
15. Add age-gating to signup (DOB → 18+ block).
16. Author `docs/compliance/fca-posture.md`, `docs/security/incident-response.md`, `docs/legal/dsar-process.md`, `SECURITY.md`, `CHANGELOG.md`, `docs/release/checklist.md`, `docs/release/AGENTS.md` (the 28-domain × 4-run × 13-track matrix with evidence links).
17. Wire Sentry (browser + Nest + Flutter) + OpenTelemetry (Nest + workers + media-pipeline + search-indexer + ml-python) → single OTLP collector.
18. Wire `/status` to real probes (DB ping, Redis ping, OpenSearch ping, BullMQ depth, S3 head, Stripe ping, SendGrid ping, Twilio ping, Socket.IO connected-clients).
19. Add `robots.txt` allow public + disallow private; build `sitemap.xml` generator from `src/routes/`.
20. CORS allow-list per env. ClamAV scan in media-pipeline before persist. PII-redaction middleware in pino logger. Webhook-signature verification audit per integration.
21. Add 2FA enforcement + IP allow-list to `/internal/*` routes.
22. Backup/restore drill evidence: monthly logical pg_dump + quarterly restore-into-staging dry-run; document RPO=1h, RTO=4h.
23. Publish `/.well-known/security.txt`.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

---

## End of D-domain audit phase

**G7 audit phase complete. The 28-domain Final QA framework now has Run 1 evidence on disk for every domain.** Per `mem://process/qa-framework-execution`, the natural next step is either:
- A consolidated G-group build pass (G6 + G7 P0 gaps in one bounded execution), or
- Continue domain-by-domain: D01 Run 2 build → … → D28 Run 4 validate.
