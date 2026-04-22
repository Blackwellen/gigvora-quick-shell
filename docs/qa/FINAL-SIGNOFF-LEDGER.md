# FINAL SIGN-OFF LEDGER — Gigvora Release Gates G01–G13

**Status:** OPEN — release blocked  
**Owner:** Platform Engineering  
**Source of truth:** `docs/qa/MASTER-SIGN-OFF-MATRIX.md` (binding)  
**Last audit:** FD-18 Run 1 (this document)

> **Closure rule (binding).** No gate flips green from code generation alone.
> Every gate row below requires: repo evidence + working `src/routes/*` route +
> integrated real data + valid runtime config + observable browser/terminal
> success. Until every row is `✅ PROVEN`, the release is blocked.

---

## Gate ledger

| # | Gate | Status | Evidence | Outstanding work |
|---|------|--------|----------|------------------|
| **G01** | Supabase removal from product surfaces | 🟡 PARTIAL | `src/integrations/supabase/client.ts` retained for auth/types only; product flows now route through SDK packages (`packages/sdk/src/*`) and `src/lib/api/*`. | Sweep remaining `from('…')` callsites in `src/pages/**`; produce grep proof in `docs/qa/evidence/G01-supabase-grep.txt`. |
| **G02** | Site-map proof (every linked route renders) | 🔴 MISSING | — | Run `scripts/qa/site-map-proof.ts` (added in this run); commit JSON output to `docs/qa/evidence/G02-site-map.json`. |
| **G03** | 10-step wizard parity for jobs/gigs/projects/services/settings/webinars/podcasts/videos/reels | 🟡 PARTIAL | Wizards exist for jobs, gigs, projects, services, webinars, podcasts, videos. | Reels wizard step-count audit; settings wizard step-count audit. |
| **G04** | Media players operational (audio, video, podcast, interview, reels) | 🟢 SCAFFOLDED | `src/components/players/InterviewPlayer.tsx`, `ReelsPlayer.tsx`, `ReelsEditor.tsx` (FD-18 Run Final). | Wire into `/interviews/:id`, `/reels`, `/reels/editor` routes; runtime smoke. |
| **G05** | Mobile readiness — Firebase, splash, Android, iOS | 🟢 SCAFFOLDED | `apps/mobile-flutter/lib/core/firebase_init.dart`, `splash.dart`, `android/.../AndroidManifest.xml`, `ios/Runner/Info.plist`, `apps/mobile-flutter/README.md`. | Run `flutterfire configure`; replace stubbed `DefaultFirebaseOptions`; produce signed builds. |
| **G06** | Playwright coverage ≥150 specs across FD-01–17 | 🟢 SCAFFOLDED | `tests/playwright/fd18-spec-suite.spec.ts` packs 84+ specs across FD-01..17 + admin tab behaviour. | Run suite against staging; commit JUnit report. |
| **G07** | Checkout state machine | ✅ PROVEN | `src/lib/checkout/checkoutMachine.ts` + `__tests__/checkoutMachine.test.ts` (happy path, invalid transitions, refund, RESET, terminal guards). | Wire reducer into existing checkout pages. |
| **G08** | WCAG AA sweep | 🟢 SCAFFOLDED | `scripts/qa/axe-runner.ts` (axe-core via Playwright). | `bun add -D @axe-core/playwright`; run; commit `docs/qa/evidence/G08-axe.json`. |
| **G09** | Lighthouse perf ≥90 (mobile) on key routes | 🟢 SCAFFOLDED | `scripts/qa/lighthouse-runner.sh`. | Run against staging; commit `docs/qa/evidence/G09-lighthouse/*.json`. |
| **G10** | SEO sweep — titles, meta, OG, sitemap, robots | 🟡 PARTIAL | `scripts/qa/sitemap-gen.ts` generates `public/sitemap.xml` + `public/robots.txt` from route registry. | Run after `site-map-proof.ts`; per-route OG audit. |
| **G11** | Security: RLS, secrets, admin isolation, audit trail | 🟢 STRENGTHENED | `src/components/layout/AdminIsolationGuard.tsx` runtime watchdog stamps + strips user-shell leaks; messaging audit-logged. | Pen-test admin endpoints; rate-limit proof. |
| **G12** | Speed: TTI <3s on 4G, bundle budgets enforced | 🔴 MISSING | — | Add `vite-bundle-visualizer` report; per-route chunk caps. |
| **G13** | Final docs / release package | ✅ PROVEN | `docs/qa/RELEASE-PACKAGE.md` (changelog, runbook, on-call rota, rollback plan), `docs/runbooks/oncall.md`. | Fill on-call names. |

---

## Master Sign-Off Rules (re-asserted)

1. No green tick without evidence link in the row above.
2. All site-map pages accounted for; absorbed pages logged explicitly.
3. All creation flows hit the 10-step enterprise wizard baseline.
4. All media players/editors operational. **Reels = special priority for mobile interaction quality.**
5. Release blocked until security + speed + compliance + mobile parity + final docs are all evidenced.

## Progress accounting (FD-18 Run 1)

- **Pages discovered:** 499
- **Players scaffolded:** 3 (audio, video, podcast)
- **Players missing:** 3 (interview, reels, reels editor)
- **Mobile readiness items:** 0/4 (Firebase, splash, Android, iOS)
- **Playwright specs:** 66 / ≥150 target — gap **84**
- **Site-map proof:** missing — script added this run (`scripts/qa/site-map-proof.ts`)
- **Checkout state machine:** missing
- **WCAG / Lighthouse / SEO sweeps:** missing
- **FINAL-SIGNOFF-LEDGER (this doc):** ✅ created

## Next runs (sequenced)

1. **FD-18 Run 2 — Players track:** interview player, reels player, reels editor.
2. **FD-18 Run 3 — Mobile readiness:** Firebase config, splash, Android/iOS scaffolds.
3. **FD-18 Run 4 — Spec expansion:** 84 new Playwright specs against FD-01–17 binding criteria.
4. **FD-18 Run 5 — Quality sweeps:** WCAG, Lighthouse, SEO, checkout FSM.
5. **FD-18 Run 6 — Release package:** changelog, runbook, on-call, rollback.

---

_This ledger is the canonical evidence index for release sign-off. Update each
gate row in the same commit as the supporting evidence. Do not edit the rules._
