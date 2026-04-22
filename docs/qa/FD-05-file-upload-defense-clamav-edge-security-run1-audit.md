# FD-05 — File Upload Defense, ClamAV/Malware Scanning, and Edge Security Headers — Run 1 Audit

Date: 2026-04-18 · Group: G1 · Maps to **Master Sign-Off Matrix → G12 (security/compliance)** + G05 (real-data persistence/storage), G07 (player/editor/media flows). Builds on FD-04 (validation/sanitization) and FD-01/FD-03 (session + admin posture). Cross-references `mem://features/media-ecosystem` and `mem://features/creation-studio` (UploadZone primitive).

> **Platform constraint reminder** — backend rate-limiting primitives are not available; this audit therefore omits per-IP/per-token rate-limit recommendations on the upload endpoint. Throughput defense is scoped to (a) per-request size cap, (b) per-session concurrent-upload cap enforced in application logic via a counter row, and (c) AV-queue backpressure (bounded BullMQ concurrency).

## 1. Business & technical purpose
Make every upload surface — avatars, profile cover photos, portfolio assets, gig/service/job/project attachments, message attachments, page-builder media blocks, podcast audio, video center clips, reels, AI workspace inputs, KYC docs (Recruiter Pro), enterprise hiring docs, finance attachments (invoices/receipts), admin import CSVs — provably:
- accept only files of declared type (verified by **magic bytes**, never by extension or client `Content-Type`),
- enforce size/dimension/duration caps per surface,
- pass an antivirus/malware scan **before** becoming downloadable,
- write to a **quarantine** prefix first and only get promoted to a public/served prefix when clean,
- be served back via short-lived signed URLs with `Content-Disposition: attachment` (or strict `image/*` rendering policy) — never as raw HTML/SVG/script,
- have all temporary objects garbage-collected on a schedule.

In parallel, finalize the **edge security headers** posture so even if an attacker does land a payload, the browser refuses to execute it: a strict CSP with hashed/nonce'd inline scripts, HSTS preload-eligible, X-Frame-Options/`frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` deny-list, and `Cache-Control: no-store` on every authenticated/sensitive surface.

## 2. Inventory snapshot

### Upload pipeline (NestJS)
- `grep "FileInterceptor|FilesInterceptor|multer|MulterModule|fileFilter|file-type|clamav|clamscan|virus"` across `apps/` → **zero hits**.
- There is **no central upload module** in `apps/api-nest/src/modules/`. Each surface that conceptually accepts files (Reels, Video Center, Podcast, Profile, Webinar covers, KYC) appears to expect a pre-signed-URL flow handled by storage adapters in `apps/integrations/src/storage/{r2,s3}.ts`, but:
  - There is no audit-trail row written when the signed URL is issued (no `who asked, for which key, with what declared MIME, what TTL`).
  - There is no server-side post-upload **finalize** endpoint that re-validates the object after the client PUT (re-reads first 32 bytes, confirms magic-bytes, records SHA-256, flips state from `quarantine`→`scanning`).
  - There is no quarantine vs. public bucket separation surfaced in the storage adapters.
- `apps/workers/src/index.ts` contains BullMQ workers; **no AV-scan worker** exists.

### Storage adapters
- `apps/integrations/src/storage/r2.ts` and `apps/integrations/src/storage/s3.ts` exist (Cloudflare R2 + AWS S3). No magic-bytes verification, no AV hook, no quarantine bucket convention, no `Content-Disposition` on download URLs, no max-age TTL standard on signed URLs (recommend 5 min for download, 15 min for upload).

### Frontend upload surfaces
- `UploadZone` primitive is referenced in `mem://features/creation-studio`. Multiple pages use raw `<input type="file">` patterns. No client-side magic-bytes pre-check (cheap UX win), no per-surface size hint shown to user, no progress + cancel + resume pattern standardized.

### Edge security headers
- `helmet()` is wired in `apps/api-nest/src/main.ts` with **defaults only**. Helmet defaults give:
  - `Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests` — **but**:
    - the API service is not the same origin as the SSR app (TanStack Start on Cloudflare Worker) — the *real* CSP that matters is the one set on **HTML responses**, which is the SSR layer (`__root.tsx` shell or a worker-level header), not the Nest API.
    - **`style-src 'unsafe-inline'`** is permissive (Tailwind v4 with CSS variables can drop this with a build step or use a hashed inline style policy).
    - No `report-uri`/`report-to` for CSP violations.
    - No `frame-ancestors 'none'` (defaults to `'self'`); should be `'none'` for the API and for every authenticated SSR page (clickjacking protection on dashboards/checkout/admin).
  - HSTS default is `max-age=15552000; includeSubDomains` ✅ — recommend uplift to `max-age=63072000; includeSubDomains; preload` and submit to the HSTS preload list once stable.
  - `Referrer-Policy: no-referrer` (helmet default) — recommend `strict-origin-when-cross-origin` (better analytics with same privacy posture for cross-origin).
  - **No `Permissions-Policy`** (formerly Feature-Policy) set — recommend deny-by-default for `camera`, `microphone`, `geolocation`, `payment`, `usb`, `serial`, `gyroscope`, with explicit allow on the surfaces that need them (e.g., webinars/jitsi need `camera`+`microphone`+`display-capture`).
  - **No `Cross-Origin-Opener-Policy: same-origin`** + `Cross-Origin-Resource-Policy: same-origin` — required for full process isolation (Spectre defense) and for `SharedArrayBuffer`/precise timers.

### CSRF
- `grep "csrf|csurf|XSRF|SameSite"` → **zero hits**.
- Auth posture is **JWT in `Authorization: Bearer …` header** (per FD-01 inventory), not a cookie session — which means the classic CSRF attack vector (browser auto-attaching cookies to a cross-site form POST) is **not directly applicable to the API**.
- **However**: the SSR app likely sets a session cookie for the SSR auth flow (or for refresh-token rotation). Any endpoint that reads auth from a cookie *must* be protected by either:
  - `SameSite=Strict` (or at minimum `Lax`) on the cookie, **and**
  - a synchronizer-token or double-submit cookie on every state-changing route, **and**
  - `Secure` + `HttpOnly` + `__Host-` prefix.
- Audit cannot confirm cookie posture without seeing the SSR auth layer; flag for verification in Run 2.

### Cache-Control
- `grep "Cache-Control|no-store"` → **zero hits** in API or SSR layers.
- Authenticated surfaces (dashboards, billing, inbox, admin) **must** ship `Cache-Control: no-store, max-age=0` to prevent (a) intermediary caches storing PII, (b) browser back-button leaking sensitive content after logout. Today the default `Cache-Control` is whatever Worker/CDN/Helmet decides — likely caching is allowed.

### Cookies
- No central cookie-setter visible. When refresh tokens land (FD-01 carry-over), they MUST use:
  - `__Host-rt` prefix (forces `Secure`, no `Domain=`, `Path=/`),
  - `HttpOnly`, `Secure`, `SameSite=Strict`,
  - short TTL (15 min access token, 7 day rotating refresh token, single-use rotation per FD-01).

### Clickjacking
- No `frame-ancestors 'none'` set on authenticated SSR pages. Public marketing pages can stay `'self'` (allows previewing in own iframes); auth/dashboard/admin/checkout must be `'none'`.

### Safe download behaviour
- No `Content-Disposition: attachment; filename="<sanitized>"` convention on signed download URLs — means a user-uploaded `.html` would render in-browser under the app's origin if served without forcing download. Combined with the absence of magic-bytes validation on upload, this is a **stored-XSS-as-a-file** vector.
- No filename sanitization (`path.basename` + strip control chars + cap length 200) before echoing into `Content-Disposition`.

### Mobile (Flutter)
- No central upload helper visible across feature folders. Each module that uploads (profile photo, KYC doc, message attachment, video) likely calls signed-URL endpoint then PUT — same flaws as web (no client magic-bytes pre-check, no resume on flaky connections).

## 3. Findings

### 🚨 P0 (release blockers)
1. **No magic-bytes verification on upload finalize.** Any user can rename `evil.html` → `evil.png`, get a signed URL for `image/png`, PUT the HTML file, and receive a working URL.
2. **No AV/malware scan before files become downloadable.** Documents/CSVs/PDFs (resume uploads, KYC docs, finance attachments, admin imports) are particularly risky.
3. **No quarantine→public lifecycle.** Files are immediately at their final URL; if AV scan lands later, the malicious file already had a window.
4. **No `Content-Disposition: attachment` enforcement** on signed download URLs for non-image content. SVGs without sanitization can carry `<script>`.
5. **`frame-ancestors` not `'none'` on authenticated SSR pages** → clickjacking on dashboards, billing, admin, checkout.
6. **No `Cache-Control: no-store` on authenticated/sensitive surfaces** → PII can leak via shared caches and browser history.
7. **No `Permissions-Policy` set** → any third-party script (analytics, embedded video) can request camera/microphone/geolocation by default.
8. **No `Cross-Origin-Opener-Policy` + `Cross-Origin-Resource-Policy`** → cross-origin frame isolation not enforced (Spectre + window.opener attacks possible).
9. **CSP default permits `style-src 'unsafe-inline'`** (helmet default) → reduces XSS defense-in-depth.
10. **No CSP `report-to`/`report-uri`** → no telemetry on CSP violations; can't detect attempted XSS in production.
11. **HSTS not at preload-list values** (`max-age >= 31536000; includeSubDomains; preload`) and not submitted.
12. **Cookie posture for SSR auth/refresh-token is unverified** — may lack `__Host-` prefix, `SameSite=Strict`, `Secure`, `HttpOnly`. If the SSR sets any auth cookie, this is P0.
13. **No filename sanitization** before storage key generation or `Content-Disposition` echoing → path traversal in keys (`../../etc/passwd.png`) and header injection.
14. **No SHA-256 hash recorded per uploaded object** → cannot dedupe, cannot detect tampering, cannot prove integrity in audit trail.
15. **Image SVG uploads not specifically locked down** (must be either rejected or sanitized via `DOMPurify` on parsed XML before storing) → executable XML attack.

### P1
16. No EXIF/metadata strip on image uploads (privacy + GDPR).
17. No image transcode pipeline (uploaded TIFF/HEIC/BMP should be normalized to WebP/JPEG; bombs (decompression bomb, e.g. 0.5 MB PNG that decodes to 50 GB) should be rejected via `sharp({ failOn: 'truncated' })` + decoded-pixel cap).
18. No PDF sanitization (PDFs can contain JavaScript, embedded files, external references) — strip via `pdf-lib`/`qpdf --linearize` in worker.
19. No virus-definition update strategy for ClamAV (freshclam cron in the worker container).
20. No per-surface "upload intent" nonce — a signed URL issued for "avatar upload" can be used to upload anything else of the right MIME; tying the signed URL to `(user_id, surface, intent_nonce)` and validating in finalize closes this.
21. No per-session concurrent upload cap in application logic (in lieu of rate limiting).
22. No garbage-collection job for orphan quarantine objects (failed uploads, abandoned uploads) — run nightly, delete `quarantine/*` older than 24 h with no `finalized_at`.
23. No `Cross-Origin-Embedder-Policy: require-corp` on surfaces that need it (advanced perf isolation).
24. No `Clear-Site-Data: "cache","cookies","storage"` header on logout endpoint.

### P2
25. No client-side magic-bytes pre-check (UX: reject before upload starts).
26. No upload progress + resume protocol standardized in mobile.
27. No CSP nonce wiring into the SSR shell (would let us drop `'unsafe-inline'` from `script-src` entirely).
28. No CI gate to forbid serving user-uploaded content from the same origin as the app (recommend: serve from `*-userassets.example.com` subdomain → cookie-less origin → cross-origin XSS contained).

## 4. Run 2 build priorities (FD-05 only)

**Database (migration `00XX_uploads.sql`)**
1. `uploads` table:
   ```sql
   create table public.uploads (
     id uuid primary key default gen_random_uuid(),
     owner_id uuid not null references auth.users(id) on delete cascade,
     surface text not null,                        -- 'avatar'|'gig_attachment'|'kyc_doc'|...
     intent_nonce uuid not null,                   -- bound at signed-URL issue
     storage_provider text not null check (storage_provider in ('r2','s3')),
     bucket text not null,
     object_key text not null,                     -- 'quarantine/{ulid}/{sanitized_name}'
     declared_mime text not null,
     verified_mime text,                           -- after magic-bytes
     size_bytes bigint,
     sha256 bytea,
     state text not null default 'pending'
       check (state in ('pending','uploaded','scanning','clean','infected','rejected','expired','deleted')),
     scan_engine text,
     scan_result jsonb,
     scan_completed_at timestamptz,
     created_at timestamptz not null default now(),
     finalized_at timestamptz,
     promoted_at timestamptz,
     expires_at timestamptz not null default now() + interval '24 hours'
   );
   create index uploads_owner_state_idx on public.uploads(owner_id, state);
   create index uploads_expires_idx on public.uploads(expires_at) where state in ('pending','uploaded','scanning');
   ```
   RLS: owner can SELECT own; staff (FD-03 `has_role('staff')`) can SELECT all; only service role INSERTs/UPDATEs (writes go through Nest, not direct from client).
2. `upload_audit_events` append-only — every state transition with `actor_id`, `ip`, `ua`, `from_state`, `to_state`, `reason`.

**Backend (NestJS)**
3. New `apps/api-nest/src/modules/uploads/` module with:
   - `POST /uploads/sign` — body: `{ surface, declaredMime, sizeBytes, filename }`. Server validates surface allow-list of MIME + size cap, generates `intent_nonce` + ULID-suffixed key under `quarantine/{owner_id}/{ulid}-{sanitized_filename}`, returns `{ uploadId, intent_nonce, signedUrl, expiresAt, requiredHeaders }`. Audit row written.
   - `POST /uploads/:id/finalize` — body: `{ intent_nonce }`. Server: HEAD object, read first 4 KB via range GET, run `file-type` magic-bytes, compare to surface allow-list, compute SHA-256 streaming, update `verified_mime/size_bytes/sha256/state='scanning'`, enqueue `av-scan` job. If magic-bytes mismatch → delete object → `state='rejected'`.
   - `GET /uploads/:id` — owner/staff view of state.
   - `GET /uploads/:id/download` — issue short-lived (5 min) signed download URL **only if** `state='clean'`, with `ResponseContentDisposition='attachment; filename="<sanitized>"'` and `ResponseContentType='<verified_mime>'`.
4. **Per-surface policy table** (`apps/api-nest/src/modules/uploads/surface-policies.ts`):
   ```ts
   {
     avatar:        { mimes: ['image/jpeg','image/png','image/webp'], maxBytes: 5_000_000, transcode: 'image' },
     kyc_doc:       { mimes: ['application/pdf','image/jpeg','image/png'], maxBytes: 15_000_000, transcode: 'pdf-sanitize' },
     reel_video:    { mimes: ['video/mp4','video/quicktime'], maxBytes: 200_000_000, transcode: 'video' },
     podcast_audio: { mimes: ['audio/mpeg','audio/mp4'], maxBytes: 500_000_000, transcode: 'audio' },
     ...
   }
   ```
5. **`UploadFinalizeGuard`** — enforces `intent_nonce` matches and surface matches the issued one.
6. **AV worker** in `apps/workers/src/jobs/av-scan.ts`:
   - Pull object via signed-URL (or direct R2/S3 SDK with service creds), stream to `clamscan` (Node binding for ClamAV running as a sidecar container with `freshclam` cron) **or** call a managed AV API (e.g., Cloudmersive, VirusTotal — adds external dep).
   - For **PDFs**: pre-scan with `qpdf --check` + strip JS via `qpdf --object-streams=disable --remove-all-files`.
   - For **images**: run through `sharp` to re-encode + auto-rotate + EXIF strip; cap decoded pixels (`limitInputPixels: 268_402_689`).
   - For **videos**: probe via `ffprobe`, reject containers with embedded scripts/subtitles that could exploit player.
   - For **SVG**: parse via `svgo` with strict config (drop `<script>`, `<foreignObject>`, event handlers, external references); if cannot sanitize, reject.
   - On clean → `state='clean'`, copy to `public/{owner_id}/{ulid}-{name}` (or signed-only access) → `promoted_at=now()`.
   - On infected → `state='infected'`, delete object, audit row with `scan_result`, alert ops via `audit_log_entries` severity:`error`.
7. **GC job** `apps/workers/src/jobs/upload-gc.ts` — nightly: delete objects + rows where `state in ('pending','rejected','infected','expired')` and `created_at < now() - 24h` (keep audit rows forever).
8. **Filename sanitizer** `apps/api-nest/src/common/sanitize/filename.ts` → NFC normalize, strip control chars, strip path separators, strip leading dots, cap at 200 chars, fallback to ULID if empty after sanitization.
9. **SSR security headers** — implement at the TanStack Start Worker level (HTML responses):
   - `Content-Security-Policy`:
     ```
     default-src 'self';
     script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
     style-src 'self' 'nonce-{NONCE}';
     img-src 'self' data: https://*-userassets.gigvora.app;
     media-src 'self' https://*-userassets.gigvora.app;
     font-src 'self';
     connect-src 'self' https://api.gigvora.app https://connector-gateway.lovable.dev wss://realtime.gigvora.app;
     frame-ancestors 'none';
     base-uri 'self';
     form-action 'self';
     object-src 'none';
     upgrade-insecure-requests;
     report-to csp-endpoint;
     ```
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self), usb=(), serial=(), gyroscope=()` — override per-route for webinars/jitsi: `camera=(self), microphone=(self), display-capture=(self)`.
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Resource-Policy: same-origin`
   - `X-Content-Type-Options: nosniff`
   - On all authenticated routes: `Cache-Control: no-store, max-age=0`.
   - On logout response: `Clear-Site-Data: "cache","cookies","storage"`.
   - `Report-To` header pointing to `/api/csp-report` (Nest endpoint that ingests into `audit_log_entries` severity:`warning`).
10. **CSP nonce middleware** — generate per-request 128-bit nonce, expose to SSR via `Route.useRouteContext()`, render into every inline `<script>`/`<style>` in `__root.tsx`. This lets us drop `'unsafe-inline'`.
11. **Cookie posture** — wherever a cookie is set (refresh token, CSRF token if introduced, theme): `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Strict` (auth) or `Lax` (theme); explicit `Path=/`.
12. **CSRF** — since the API is Bearer-token, no CSRF token on API calls. **But** any SSR mutation that reads from a cookie session (logout, switch-org, accept-cookie-banner) MUST use double-submit pattern: server sets `__Host-csrf` (random, `SameSite=Strict`, **not** `HttpOnly` so JS can read), client mirrors into `X-CSRF-Token` header on POST.
13. **Serve user assets from a separate origin** — `*.userassets.gigvora.app` (cookie-less, no app JS, strict CORS). Stored XSS in an uploaded SVG can no longer access app cookies/localStorage. CSP `img-src`/`media-src` must allow this origin.

**Frontend (web)**
14. `src/components/upload/UploadZone.tsx` rewrite:
    - Accept `surface` prop → fetch policy from server → pre-validate MIME + size client-side.
    - Optional client magic-bytes pre-check via `file-type` browser build (bundles small).
    - Two-step flow: `POST /uploads/sign` → `PUT signedUrl` → `POST /uploads/:id/finalize` → poll `GET /uploads/:id` until `state='clean'` (or surface error).
    - Show progress, cancel, retry. Resume via tus protocol can be a P2 follow-up.
15. CSP-nonce wiring in SSR shell.

**Mobile (Flutter)**
16. `apps/mobile-flutter/lib/core/upload_helper.dart` — same 3-step flow; show clean/scanning/infected states with proper messaging.

**Tests**
17. Playwright `tests/e2e/security/upload-defense.spec.ts`:
    - rename `evil.html` → `evil.png`, upload via UploadZone → finalize rejects with magic-bytes mismatch.
    - upload EICAR test string as `.txt` → AV worker marks `infected` within timeout; `GET /uploads/:id/download` returns 409.
    - upload SVG with `<script>` → either rejected or sanitized (no script in returned content).
    - upload PDF with embedded JS (`/AA`/`/OpenAction` actions) → sanitized.
    - upload to `surface=avatar` with declaredMime=`image/jpeg` but body is `image/svg+xml` → rejected.
    - replay attack: try to use `intent_nonce` twice → second finalize rejected.
    - signed download URL TTL: wait 6 min → URL no longer valid.
18. Playwright `tests/e2e/security/edge-headers.spec.ts`:
    - hit every authenticated route → assert `Cache-Control: no-store`, `frame-ancestors 'none'`, COOP/CORP/COEP, HSTS preload-eligible, no `unsafe-inline` in `script-src`, Permissions-Policy denies camera by default.
    - try to iframe `/dashboard` from another origin → blocked by `frame-ancestors`.
    - logout → assert `Clear-Site-Data` set; subsequent back-button does not show cached PII.
19. Logic-flow harness `tests/logic-flow/upload-state-machine.ts`: drive an upload through every state transition, assert audit row written each time.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G12 (security/compliance).
- **Secondary**: G05 (real-data persistence — `uploads` table + R2/S3 quarantine→public lifecycle), G07 (player/editor/media flows — every media surface goes through the new pipeline), G09 (Playwright `upload-defense.spec.ts` + `edge-headers.spec.ts`), G11 (mobile parity).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, forms, popups, drawers mapped | ☐ | UploadZone primitive + raw `<input type="file">` sites enumerated §2; per-surface policy table to be authored Run 2 |
| Backend files and APIs complete | ☐ | No `uploads` module exists; storage adapters lack quarantine + finalize + AV hooks |
| Supabase/demo data eliminated | n/a | n/a — FD-05 is policy/middleware/storage-lifecycle |
| Database schema, seeders, fixtures complete | ☐ | `uploads` + `upload_audit_events` tables not yet created |
| ML / analytics / workers integrated | ☐ | No AV-scan worker, no GC worker, no transcode worker |
| Indexing/search/filter logic | n/a | n/a |
| Realtime / live data | ☐ | Recommend WS event `upload:state` so client can react to scan-complete without polling |
| Security & middleware protections | ☐ | 15 P0s open |
| Playwright logic-flow coverage | ☐ | `upload-defense.spec.ts` + `edge-headers.spec.ts` not present |
| Mobile / API parity | ☐ | `upload_helper.dart` not present |
| Acceptance criteria passed | ☐ | Pending Run 2 + Run 4 |

## 7. Acceptance criteria (binding)
- A1. No object becomes downloadable without `state='clean'`. Direct GET on `quarantine/*` is impossible (bucket policy denies anonymous + staff-only IAM).
- A2. Magic-bytes verification on finalize rejects every MIME-spoof in the test corpus (HTML-as-PNG, SVG-as-JPG, EXE-as-PDF, ZIP-as-DOCX with macro).
- A3. EICAR string is detected and quarantined within 60 s of finalize on the staging AV worker.
- A4. SVGs are either sanitized (no `<script>`, no event handlers, no external refs) or rejected.
- A5. PDFs are sanitized (no `/JS`, no `/Launch`, no embedded files).
- A6. Every signed download URL forces `Content-Disposition: attachment` for non-image MIMEs and uses verified MIME (not declared).
- A7. CSP on every HTML response: no `'unsafe-inline'` in `script-src`; nonce-based; `frame-ancestors 'none'` on auth routes; `report-to` wired and CSP violations land in `audit_log_entries`.
- A8. HSTS: `max-age >= 31536000; includeSubDomains; preload`; domain submitted to preload list.
- A9. `Permissions-Policy` deny-by-default; per-route allow only for webinars/jitsi.
- A10. COOP `same-origin` + CORP `same-origin` on every HTML response.
- A11. `Cache-Control: no-store, max-age=0` on every authenticated route response.
- A12. Logout response carries `Clear-Site-Data: "cache","cookies","storage"`.
- A13. Refresh-token cookie (when introduced) is `__Host-rt`, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, single-use rotation (FD-01 link).
- A14. `tests/e2e/security/upload-defense.spec.ts` + `tests/e2e/security/edge-headers.spec.ts` + `tests/logic-flow/upload-state-machine.ts` green in CI.
- A15. Nightly GC job removes orphan quarantine objects; metric exposed in admin terminal.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Note: rate-limiting recommendations omitted per platform constraint; throughput defended via per-request size caps + per-session concurrent-upload counter + bounded AV worker concurrency. AV engine choice (self-hosted ClamAV sidecar vs managed API) deferred to Run 2 cost/latency review._
