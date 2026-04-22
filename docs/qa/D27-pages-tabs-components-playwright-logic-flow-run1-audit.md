### D27 — Full Pages-Tabs-Components Audit, Playwright, Terminal Logic Flow, Browser Validation — Run 1 Audit

Date: 2026-04-18 · Group: G7 (D27/4) · Status: Run 1 (Audit) complete.

## Inventory

### Frontend surfaces
- **Routes** (`src/routes/`): TanStack Start file-based routing — flat dot-separated convention. Counted via `ls src/routes | wc -l`. Includes `__root.tsx`, `index.tsx`, plus per-domain leaves.
- **Legacy pages** (`src/pages/`): React-Router-era pages still on disk pending migration — `Index.tsx` is the placeholder/landing reference shown in editor; per `mem://tech/frontend-stack` the migration to TanStack Start is in flight.
- **Components** (`src/components/`): shadcn primitives + bespoke domain components; tabs widely used (`TabsList/TabsTrigger`).
- **Site map**: no canonical `docs/sitemap.md` or `docs/site-map.md` checked into repo — site map exists only as legacy prompt narrative, not as machine-checkable ledger.

### Test surfaces
- **Playwright specs** (`tests/playwright/`): smoke + matrix specs covering feed, network, profiles, companies, agency, groups, events, notifications, search, settings, jobs-browse, job-posting-studio, job-application-flow, client-dashboard, customer-service, finance-admin, dispute-ops, ads-ops, internal-admin-shell, launchpad-studio-tasks-team, entitlements, enterprise-matrix.
- **Mobile tests** (`apps/mobile-flutter/test/`): `async_state_test`, `offline_cache_test`, `shell_bootstrap_test`.

## Critical findings

### 🚨 P0
1. **No canonical site-map ledger** — there is no `docs/sitemap.md` enumerating every page → tab → component → primary action → expected backend call → expected DataState. Without it, "full audit" cannot be verifiably re-run; coverage is anecdotal across 27 spec files.
2. **Two parallel page trees** (`src/routes/` + `src/pages/`) — TanStack migration incomplete (per `mem://tech/frontend-stack`). Some routes resolve via TanStack file routing, some via legacy React Router shim; deep-link / SSR / SEO behaviour diverges by tree. Build-time guarantee that every navigable URL maps to exactly one component is missing.
3. **Playwright matrix is breadth-only, not depth** — `enterprise-matrix.spec.ts` asserts "page mounts + reaches a terminal DataState" across 10 routes, but the per-domain specs (`companies.spec.ts`, `dispute-ops.spec.ts`, `finance-admin.spec.ts`, `customer-service.spec.ts`, `ads-ops.spec.ts`, `internal-admin-shell.spec.ts`, `launchpad-studio-tasks-team.spec.ts`, `job-posting-studio.spec.ts`) are pure `await expect(page.locator('body')).toBeVisible()` smoke — they do not click buttons, fill forms, validate edits, or assert terminal outcomes. **No actual logic-flow coverage.**
4. **No DataState canonical contract enforcement** — `enterprise-matrix.spec.ts` literally branches "if the page hasn't been migrated yet, just assert body visible" (lines 73-76), making the matrix additive but non-breaking. Pages that never migrate to `<DataState>` permanently evade the spinner regression check.
5. **No `pageerror` global guard** — most per-domain specs do not subscribe to `page.on('pageerror')`. Only `feed.spec.ts`, `companies.spec.ts`, and `enterprise-matrix.spec.ts` capture runtime errors. A page can throw in `useEffect`, render an empty body, and still pass the smoke spec.
6. **No form-fill / edit / submit coverage** — zero specs perform the canonical "open create wizard → fill 10 steps → save draft → publish → assert backend write → assert list refresh" loop required by `mem://features/commercial-builders`. Builder wizards (Jobs/Gigs/Services/Projects) are untested end-to-end.
7. **No terminal logic-flow harness** — there is no `pnpm test:logic-flow` or equivalent that boots the API, runs a scripted user journey via the SDK (signup → create org → post job → apply → message → hire → contract → invoice → review), and asserts every step. QA depends entirely on browser specs.
8. **No button-action ledger** — there is no `docs/qa/button-actions.md` enumerating every CTA on every page with its expected handler, expected backend route, expected toast/redirect, and entitlement gate. CTAs that silently no-op (the most common UX bug) cannot be detected.
9. **No `data-testid` discipline** — the matrix relies on `[data-testid="data-state-*"]` but most domain components do not emit any other `data-testid`. Targeting buttons by role/name is brittle and locale-sensitive.
10. **No coverage of overlay system** — Drawers/Inspectors/HoverCards/Popouts/Wizards from `mem://tech/overlay-system` are untested. Modal escape, focus trap, keyboard nav (⌘K, G+key from `mem://features/navigation-and-shortcuts`) — zero specs.
11. **No mobile Playwright** — Playwright runs desktop only. `MobileDashboardNav` (memory: mobile-optimization-strategy) and the responsive mobile breakpoint behaviour have no Playwright coverage despite being a documented requirement.
12. **No CI gating on Playwright** — playwright.config.ts uses `createLovableConfig` defaults; no GitHub Actions workflow in repo gating PRs on green Playwright. Specs can rot unnoticed.
13. **Placeholder `src/routes/index.tsx`** — per editor state user is viewing the legacy `src/pages/Index.tsx`. Per TanStack rules, if `src/routes/index.tsx` contains placeholder boilerplate it must be replaced; needs verification it is the real landing.

### P1
14. No accessibility (`@axe-core/playwright`) audit. WCAG AA violations undetected.
15. No visual-regression baseline (Chromatic / Percy / Playwright `toHaveScreenshot`). Unintended visual drift invisible.
16. No performance budget (Lighthouse CI / Playwright trace) per route — TTI/LCP/CLS untracked.
17. No network-mocking layer for Playwright — every spec depends on a live backend; flake risk on CI.
18. No "auth as user X" fixture — entitlements spec checks "if gate visible, assert visible" rather than logging in as a Free user and asserting the gate IS shown.
19. No coverage of search → autocomplete → filter → result click → detail page (D23 echo).
20. No coverage of realtime arrival (notification toast, live counter) (D24 echo).
21. No reels / podcast / webinar player smoke (player ready, play/pause, seek, captions) (D24 A8 echo).
22. No file-upload smoke (avatar, attachment, video) — UploadZone untested.
23. No dark-mode spec — theme toggle and contrast not verified.
24. `entitlements.spec.ts` uses `PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080'` while every other spec defaults to `:5173` — port drift will silently skip.
25. No 404 / not-found / unauthorized boundary specs.
26. No mobile viewport spec across the matrix (375×812 iPhone, 360×800 Android).
27. No keyboard-only navigation spec (Tab order, focus-visible).
28. No copy/legal page coverage (Terms, Privacy, Cookie, /status — memory: system-status-page).

### P2
29. No fixture for seeded test users / orgs / jobs / contracts.
30. No teardown that cleans test-created data; risk of polluting preview env.
31. No screenshot artefact upload on Playwright failure.
32. No flake-quarantine list / retry budget visibility.
33. No spec for ⌘K Command Palette across 10 categories (memory: search-and-command-center).

## Run 2 build priorities
1. **Author canonical site map** — `docs/sitemap.md` as the source of truth: route → tabs → primary CTAs → expected backend calls → entitlement gates → DataState contract; generated/checked by a script that walks `src/routes/` and diffs against the ledger.
2. **Author button-action ledger** — `docs/qa/button-actions.md` enumerating every CTA + handler + route + side-effect + gate.
3. **Complete TanStack migration** — finish moving `src/pages/` → `src/routes/`; add a build-time check that fails if both trees define the same path.
4. **Add `data-testid` discipline** — every interactive element gets a stable testid (`data-testid="cta:{action}"`, `data-testid="tab:{name}"`, `data-testid="form:{form}"`).
5. **Replace shallow per-domain specs with depth specs** — for each commercial builder (Jobs/Gigs/Services/Projects): open wizard → 10-step fill → save draft → publish → assert API write → assert list refresh → edit → archive; for each admin dashboard (Disputes/Finance/Trust&Safety/AdsOps): list → filter → open case → take action → assert audit log entry; for messaging: send → realtime arrival → typing → read receipt.
6. **Build terminal logic-flow harness** — `tests/logic-flow/*.ts` driven by SDK only (no browser): canonical user journeys end-to-end, hooked into CI.
7. **Add global `pageerror` + console-error guard fixture** — fail any test if uncaught exception or non-benign console error fires.
8. **Add a11y audit** — `@axe-core/playwright` per route in `enterprise-matrix.spec.ts` extension.
9. **Add visual-regression baseline** — Playwright `toHaveScreenshot` for header/footer/hero/empty-state/error-state across light+dark.
10. **Add mobile viewport matrix** — clone `enterprise-matrix.spec.ts` with 375×812 and 360×800 + mobile-specific assertions (`MobileDashboardNav` visible, ChatBubble hidden).
11. **Add overlay coverage** — Drawer/Inspector/Wizard open → escape → focus return; ⌘K palette open → type → arrow-nav → enter → route lands.
12. **Add player smoke** — reels mount, autoplay-muted, scrub, captions toggle, podcast play/pause, webinar live join.
13. **Add file-upload smoke** — avatar upload via UploadZone → cropper → save → assert URL persisted.
14. **Add auth fixtures** — `loginAs('free')`, `loginAs('pro')`, `loginAs('enterprise')`, `loginAs('admin')`; entitlement spec asserts gate IS shown for Free, hidden for Pro.
15. **Normalize Playwright base URL** — single env var, single default port across all 27 specs.
16. **CI gate** — GitHub Actions workflow runs `pnpm test`, `pnpm test:logic-flow`, `pnpm playwright test`, mobile Patrol, on every PR with screenshot artefact upload.
17. **404 + boundary specs** — random unknown paths, role-mismatch redirects.
18. **Realtime + search + media specs** echoing D23/D24/D26 fixes.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.
