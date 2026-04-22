# FD-04 — Validation, Sanitization, Injection Defense, CAPTCHA & Abuse Controls — Run 1 Audit

Date: 2026-04-18 · Group: G1 · Maps to **Master Sign-Off Matrix → G12 (security/compliance)** + G06 (form-grade UI). Builds on FD-01 (lockout flow) + FD-03 (admin step-up).

> **Platform constraint** — backend rate-limiting primitives are not available; this audit therefore omits any rate-limit recommendations. Brute-force defense is scoped to (a) CAPTCHA on unauthenticated/public forms, (b) the existing per-identity lockout already present in `identities.failed_attempts`/`locked_until`, and (c) progressive challenge escalation on the *application logic* layer. If proper rate-limit infra lands later, it should plug in here.

## 1. Business & technical purpose
Guarantee that every untrusted byte that crosses the network boundary — query strings, JSON bodies, multipart files, headers, websocket messages, deep-link params, mobile form data — is **validated by an explicit schema, sanitized for the rendering context, and rejected before any database, file system, child fetch, or template engine ever sees it.** Bot/abuse defenses (CAPTCHA, lockout, progressive challenge) cover the unauthenticated surfaces (login, signup, password reset, support, public contact, public posting) where credential-stuffing and content-spam are the dominant threats.

## 2. Inventory snapshot

### Backend validation (NestJS)
- **Global `ValidationPipe` is wired**: `apps/api-nest/src/main.ts:19`
  ```ts
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  ```
  ✅ `whitelist: true` strips unknown fields; `transform: true` coerces primitives.
  ❌ **`forbidNonWhitelisted: true` is NOT set** — extra fields are silently dropped instead of rejected with 400, which masks client bugs and can hide attack probes.
  ❌ **No `disableErrorMessages: true` for production** — class-validator error messages can leak constraint internals.
- **DTO coverage**: 67 `dto.ts` files exist; 82 files reference `class-validator`/`Zod`. Coverage is broad but not provably 100% — large modules (e.g. `webinars`, `recruiter-job-management`, `enterprise-hiring-workspace`, `client-dashboard`, `shared-workspaces-collaboration`) need a per-endpoint matrix to confirm every `@Body()` is bound to a validated DTO and not `any`.
- **Helmet** is enabled (`main.ts:14 app.use(helmet())`) — D28 echo: per-directive CSP/HSTS/Permissions-Policy hardening still pending.

### Sanitization (HTML / rich text)
- `grep "dompurify|sanitize-html|isomorphic-dompurify|xss|validator.escape|he.encode"` across `apps/` + `src/` → **zero hits**.
- `dangerouslySetInnerHTML` appears **1×** in `src/` — must be inspected.
- The platform ships **rich-text fields** across many surfaces: gig descriptions, job postings, project briefs, webinar descriptions, podcast notes, profile bios, page builder blocks, comments, messaging, AI workspace outputs. Without DOMPurify on render and a server-side allow-listed sanitizer on write, **stored XSS is unmitigated** the moment any `<script>`/`<img onerror=>` payload is accepted.

### URL / handle / file normalization
- No central normalizers found for: handles (`@user`), URLs (lowercase host, strip default port, IDN punycode, block `data:`/`javascript:`/`file:` schemes), e-mails (RFC 5321 length, plus-tag preservation), money (always store minor units as integers + currency code), dates (UTC ISO-8601, no naïve strings), tags (NFC normalize, length cap, slugify), file metadata (strip EXIF, normalize MIME via magic bytes not extension).
- File upload pipeline: `grep "FileInterceptor|fileFilter|MulterModule|file-type|maxSize"` → **zero hits**. No `@nestjs/platform-express` Multer config visible; no MIME sniff via magic bytes; no virus-scan worker queue. EXIF strip / image transcode pipeline absent.

### SQL injection
- ✅ `grep "knex.raw|pool.query(\`...\${"` returns **zero hits** for unsafe concatenation. Drizzle ORM is the standard path. Known-good query in `identity.repository.ts:34-39` uses `$1/$2/$3` parameterized SQL. No template-literal user-controlled SQL detected at audit time, but the audit scope is grep — a typed CI rule (no `sql\`...${\`*\`}...\`` patterns) is needed for permanence.

### SSRF
- `grep "fetch((req|input|body|dto)\\.|axios\\.(get|post)\\((req|input|body|dto)\\."` → **zero direct hits** (good first-pass). However:
  - The platform fetches user-supplied URLs at multiple touchpoints by design: link previews (feed/comments), profile/portfolio external links, OAuth/BYOK callback URLs, webhook delivery URLs (`apps/webhook-gateway`), AI BYOK provider endpoints (`apps/integrations/src/ai/providers.ts`), media import (Reels/Video Center), import-from-URL flows in builders.
  - **No central `safeFetch()` helper** found that:
    - resolves DNS to a public IP (no `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`),
    - blocks redirect chains that land on private space,
    - caps response size and time,
    - strips inbound `Authorization`/cookie headers on redirect.
  - This is a P0 — link-preview alone is enough to expose internal metadata endpoints (e.g., cloud IMDS at `169.254.169.254`).

### Header abuse
- No `Host` header pinning; no `X-Forwarded-*` allow-list (must trust only the gateway/load-balancer; today, any client claim of `X-Forwarded-For` may flow into `getClientIp`).
- No request-size cap visible (Nest body parser default 100 kB is fine for JSON, but file routes need explicit limits).
- No JSON depth/array-length caps in `ValidationPipe` config (depth-bomb risk).

### CAPTCHA / bot
- `grep "turnstile|hcaptcha|recaptcha"` → **zero hits** anywhere.
- Public/unauth surfaces with no challenge today: `/auth/login`, `/auth/signup`, `/auth/password/reset`, `/auth/password/forgot`, public contact, support ticket creation, newsletter signup, free-tier "Post a Job" / "Post a Gig" public landing flows, comment posting on public pages, profile-view-with-form, public showcase enquiry.
- Per `mem://security-authentication`: 5-attempt lockout exists ✅, but no CAPTCHA precedes it — a credential-stuffer can still burn through an account list one shot per identity until lockout, then move on.

### Lockout (existing — keep)
- ✅ `apps/api-nest/src/modules/identity/identity.repository.ts:27-46` implements: increment `failed_attempts`, lock at threshold (`locked_until = now() + N min`), reset on success, status flip to `locked`. Internal-admin terminal has its own lockout table (`ialtLockouts`).
- Gap: lockout writes do not currently emit an `audit_log_entries` row with IP+UA+identifier-hash for forensic correlation (FD-03 carry-over).

### WS payload validation
- `notifications.gateway.ts` and other gateways: no `@MessageBody()` Zod/class-validator parse before handler executes (FD-01 P0 echo, lands here too — payload validation is the FD-04 angle of the same finding).

### Mobile (Flutter)
- Client-side validators per form are inconsistent. Server-side validation is the source of truth; mobile must surface 400-error envelopes uniformly. Today, error rendering in mobile forms is ad-hoc — bad input → silent failure or generic toast.

## 3. Findings

### 🚨 P0 (release blockers)
1. **`ValidationPipe` not strict**: missing `forbidNonWhitelisted: true`. Add it; surface unknown-field 400 in dev, hashed counter in prod.
2. **No HTML sanitization on rich-text writes** for gigs, jobs, projects, profiles, webinars, podcasts, page-builder blocks, comments, messages, AI outputs. Stored XSS is the highest-impact open vulnerability.
3. **No DOMPurify on render** — even after server sanitization, defence-in-depth requires DOMPurify before any `dangerouslySetInnerHTML` mount.
4. **No `safeFetch()` SSRF guard** anywhere. Link-preview, webhook delivery, AI BYOK callback, import-from-URL, OAuth callback URLs all pass user input straight to `fetch()`-equivalents. Cloud IMDS theft is one user-supplied URL away.
5. **No file-upload pipeline**: no MIME sniff via magic bytes, no max-size, no EXIF strip, no virus scan, no transcoding queue. Allows polyglot files (HTML-as-PNG), GPS leakage, malware delivery.
6. **No CAPTCHA on any unauthenticated form**. Lockout limits per-account, not per-attacker; credential-stuffing across user lists is unmitigated.
7. **No URL/handle/scheme normalization & deny-list.** Profile/portfolio fields accept `javascript:` URLs; renders as a clickable link.
8. **No JSON depth / array length caps** → JSON-depth-bomb DoS via deeply nested body.
9. **No file-route body-size caps** distinct from JSON cap; large multipart can exhaust memory.
10. **No central money / currency normalization**: monetary inputs cross the wire as floats in some DTOs (visible in `webinars/dto.ts`, `payouts-escrow-finops/dto.ts` patterns to verify) — must be `bigint` minor units + ISO-4217 currency, validated together.
11. **`X-Forwarded-For` not pinned to a trusted proxy**: client IP used in lockout/geo/audit can be spoofed; lockout becomes useless.
12. **WS handler payloads unvalidated** beyond what gateway code does manually (FD-01 echo).
13. **`dangerouslySetInnerHTML` (1 occurrence in `src/`) unaudited** — must inspect, prove the upstream is sanitized, or replace.

### P1
14. `disableErrorMessages: true` not set in production env → constraint leakage.
15. No NFKC unicode normalization on names/handles → homograph spoofing (`раypal` vs `paypal`).
16. No prohibited-character set enforced on display names (zero-width joiners, RTL override).
17. No EXIF / metadata strip on image uploads (privacy leak for users — GDPR exposure).
18. No virus / malware scan worker (queue + ClamAV/cloud equivalent) before file becomes downloadable.
19. No global "humanity" signal beyond CAPTCHA (e.g., browser fingerprint, JS challenge) for highest-risk endpoints (admin login, password reset).
20. No outbound webhook URL allow/deny list with cooldown after delivery failures.
21. No "honeypot" hidden field on public forms (cheap bot filter).
22. No idempotency-key requirement on POSTs that create money movements (would fold into D04 since it's a write-integrity concern).

### P2
23. No central error envelope (`{error:{code,message,fields:[{path,code}]}}`); each module shapes its own.
24. No CI typed gate to block raw SQL template literals or `dangerouslySetInnerHTML` introductions.

## 4. Run 2 build priorities (FD-04 only)

**Backend (NestJS)**
1. `apps/api-nest/src/main.ts`: tighten `ValidationPipe`:
   ```ts
   app.useGlobalPipes(new ValidationPipe({
     whitelist: true,
     transform: true,
     forbidNonWhitelisted: true,
     disableErrorMessages: process.env.NODE_ENV === 'production',
     transformOptions: { enableImplicitConversion: false },
   }));
   ```
   Add JSON body size cap (`bodyParser.json({ limit: '256kb' })` for default routes; per-route override).
2. New `apps/api-nest/src/common/sanitize/` module:
   - `sanitizeRichText(html, profile: 'comment'|'longform'|'profile-bio')` — server-side allow-list using `sanitize-html` (whitelisted tags/attrs/schemes per profile; strip `style`, `on*`, `srcset` data URIs except images).
   - `sanitizeUrl(input, { allowSchemes: ['http','https','mailto'] })` returning `URL | null`.
   - `normalizeHandle(input)` → NFC + lowercase + `[a-z0-9_]{3,20}` regex + reserved-word deny-list.
   - `normalizeMoney(input)` → `{ amountMinor: bigint, currency: 'GBP'|'USD'|... }` + sign rules.
   - `normalizeDate(input)` → ISO-8601 UTC; reject naïve.
   - `normalizeTags(input[])` → NFC, slugify, dedupe, cap length 24, cap count 12.
3. Centralised `safeFetch(url, opts)` in `apps/integrations/src/net/safe-fetch.ts`:
   - parse URL, reject schemes other than `https:` (and `http:` only for explicit dev-allow);
   - DNS-resolve, reject any answer in private/loopback/link-local/ULA/CGNAT/IMDS;
   - cap `maxRedirects: 3`, re-validate IP after each redirect;
   - `signal: AbortSignal.timeout(5000)`;
   - cap response with a streaming size limit (e.g. 2 MB);
   - strip `Authorization` and cookie headers on redirect.
   - Replace every direct `fetch(userUrl)` call site (link-preview, webhook delivery, OAuth callback verifier, AI BYOK ping, import-from-URL).
4. File upload pipeline:
   - `MulterModule` with `limits: { fileSize: 25 MB, files: 10 }` per route override.
   - `FileTypeInterceptor` reads first 4-32 bytes, calls `file-type`, rejects on mismatch.
   - For images: `sharp` re-encode (auto-rotate via EXIF then strip; resize cap; emit JPEG/WebP) — **note**: `sharp` is native and may not run in the Worker SSR runtime; perform image transcode in the `apps/workers` BullMQ worker, not in the Nest hot path.
   - Quarantine bucket → AV scan worker → publish to public bucket on clean.
5. `@TrustProxy` interceptor: read client IP only from `X-Forwarded-For` if request arrived from the configured gateway IP/CIDR; otherwise use `req.socket.remoteAddress`.
6. WS: every `@SubscribeMessage('event', { transform: true })` validates payload via Zod; reject + audit on failure.
7. Money / currency global rule via DTO base class `MoneyDto { @IsInt() @Min(0) amountMinor: number; @IsISO4217() currency: string; }`. Replace float price fields in webinars/payouts/wallet/billing.
8. Idempotency-key middleware (header `Idempotency-Key` ULID) on every POST that produces money/payment/notification side effects; persist `(key, response_body, status)` for 24 h.
9. Audit emit: every lockout, sanitizer drop, SSRF reject, file-type reject, validation 400 → `audit_log_entries` row with `severity: 'warning'`.
10. Honeypot field convention: shared `HoneypotInterceptor` rejects requests where `req.body.__hp_company` is non-empty.

**CAPTCHA**
11. Cloudflare Turnstile (free, privacy-respecting, no PII to third party):
    - `<TurnstileWidget>` React component on `/auth/login`, `/auth/signup`, `/auth/password/{forgot,reset}`, public contact, support ticket creation, public posting flows, public comment posting.
    - `TurnstileGuard` Nest guard verifies token server-side via Cloudflare API on these endpoints.
    - **Progressive challenge**: skip CAPTCHA on first attempt; require it after 1 failure on signup/login/password-reset (signal stored in a short-TTL cookie keyed by hashed identifier), and always for unauthenticated POSTs from new IPs.
    - Add `TURNSTILE_SITE_KEY` (public) + `TURNSTILE_SECRET_KEY` (server-only) via `add_secret`. Mobile uses Turnstile mobile SDK / WebView fallback.

**Frontend (web)**
12. `src/lib/sanitize.ts` — `renderRichText(html)` uses `isomorphic-dompurify` with the same allow-list profile names as server. Replace every `dangerouslySetInnerHTML` mount.
13. Form-builder helper hook `useSafeForm(zodSchema)` — Zod is already plausibly used; standardize so client and server share the same schema (in `packages/shared-validation/`).
14. Honeypot hidden field on every public form.

**Mobile**
15. Mirror Zod schemas from `packages/shared-validation/` via `freezed`/`json_serializable` generators or a thin Dart equivalent; render server 400 envelopes consistently.
16. Turnstile mobile widget on login/signup/reset/contact.

**Tests**
17. Playwright `tests/e2e/security/injection-defense.spec.ts`:
    - Stored XSS: post `<img src=x onerror=alert(1)>` to gig description → render shows escaped, no script execution; server stored value already stripped.
    - Reflected XSS: query string `?q=<svg onload=...>` rendered in search header → escaped.
    - SSRF: link-preview against `http://169.254.169.254/latest/meta-data/` → rejected.
    - File upload: rename `evil.html` → `evil.png` → rejected by magic-bytes interceptor.
    - JSON depth bomb: 200-level nested object → 400 in <100 ms.
    - `forbidNonWhitelisted`: extra field on signup → 400.
    - CAPTCHA missing on `/auth/signup` → 400; valid token → 201.
    - Honeypot filled → 400.
18. Terminal harness `tests/logic-flow/normalize-money.ts`: float dollars in DTO → 400; `amountMinor + currency` → 200; negative → 400.
19. SSRF unit tests against `safeFetch` truth table (loopback, ULA, CGNAT, IMDS, redirect-to-private, oversize, slow-loris).

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G12 (security/compliance).
- **Secondary**: G06 (form-grade UI — every creation/edit surface must surface server validation errors), G09 (Playwright injection matrix), G10 (form/edit enrichment depth).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, forms, popups, drawers mapped | ☐ | Public-form inventory listed §2 (CAPTCHA section); rich-text mount inventory pending |
| Backend files and APIs complete | ☐ | 67 DTO files exist; `forbidNonWhitelisted` off; sanitize/safeFetch/Multer modules absent |
| Supabase/demo data eliminated | n/a | n/a — FD-04 is policy/middleware concerns |
| Database schema, seeders, fixtures complete | ☐ | Money columns may be float in places; `MoneyDto` migration deferred to Run 2 |
| ML / analytics / workers integrated | ☐ | AV scan worker + image transcode worker not present |
| Indexing/search/filter logic | ☐ | Field-level redaction (FD-02) extends here for search payloads |
| Realtime / live data | ☐ | WS payload validation absent |
| Security & middleware protections | ☐ | 13 P0s open |
| Playwright logic-flow coverage | ☐ | `injection-defense.spec.ts` not present |
| Mobile / API parity | ☐ | Turnstile mobile + 400-envelope rendering pending |
| Acceptance criteria passed | ☐ | Pending Run 2 + Run 4 |

## 7. Acceptance criteria (binding)
- A1. `ValidationPipe` runs with `whitelist + transform + forbidNonWhitelisted + disableErrorMessages(prod)`.
- A2. Stored XSS payloads in any rich-text field do not survive write (server sanitized) **and** do not execute on read (DOMPurify on render).
- A3. `safeFetch()` rejects all 8 truth-table cases (loopback, RFC1918, ULA, link-local/IMDS, CGNAT, redirect-to-private, oversize, timeout); used at every link-preview / webhook / AI BYOK / import / OAuth-callback site.
- A4. File upload rejects MIME-mismatched files via magic bytes; images stripped of EXIF; AV scan worker queues and clean files become downloadable; quarantine TTL set.
- A5. CAPTCHA enforced on login/signup/forgot/reset/contact/support/public-post/public-comment when caller is unauthenticated and outside an established session cookie.
- A6. `MoneyDto` used everywhere money is accepted; `bigint` minor units + ISO-4217.
- A7. JSON body size cap + JSON depth cap enforced; over-cap returns 413/400 in <100 ms.
- A8. `X-Forwarded-For` honoured only from configured trusted-proxy CIDR.
- A9. WS `@MessageBody()` payloads validated on every event; failures audited.
- A10. `tests/e2e/security/injection-defense.spec.ts` + `tests/logic-flow/normalize-money.ts` + SSRF unit tests green in CI.
- A11. CI gate forbids new occurrences of `dangerouslySetInnerHTML` (use `<RichText>` wrapper) and forbids template-literal SQL.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Note: rate-limiting recommendations intentionally omitted per platform constraint; CAPTCHA + lockout + honeypot + progressive challenge cover the abuse vectors at the application logic layer._
