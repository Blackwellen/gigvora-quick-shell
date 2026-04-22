# FD-18 — Frontend Surface, Media Player/Editor, Mobile, Playwright & Final Docs — Run 1 Audit

Date: 2026-04-18 · Group: G6 · Final domain · Maps to **Master Sign-Off Matrix → ALL GATES (G01–G13)**.

> Scope: prove every page/tab/component is real and wired, every player/editor finalized, mobile shipped (Firebase/splash/Android/iOS), Playwright ≥ target coverage, all final docs aligned. Closure rule (per ordering & execution guidance): no domain marked complete until checklist matrix is ticked with real evidence.

## 1. Inventory snapshot
- **Pages**: 499 `.tsx` under `src/pages/` (large surface — site-map audit must be exhaustive, not sampled).
- **Players present**: `media/VideoPlayerDetailPage`, `podcasts/PodcastPlayerPage`, `webinars/WebinarLivePlayerPage`.
- **Donation/payment surfaces**: `calendar/DonationFlowPage`, `checkout/GigCheckoutPage`, `checkout/ServiceCheckoutPage`, `donations/DonationsPage`, `podcasts/PodcastDonationsPage`, `webinars/WebinarCheckoutPage`, `webinars/WebinarDonationsPage`, plus `useDonationsPurchasesCommerce` hook.
- **Playwright specs**: 66 total.
- **Docs present**: `SITE_GUIDE.md`, `architecture/`, `compliance/`, `qa/`, `runbooks/`, plus `domain-35/36/37.md`.

## 2. Findings

### 🚨 P0 (release blockers)
1. **Interview player missing** — required by domain depth, no `InterviewPlayerPage` or component (cross-cuts hire/recruiter privacy from FD-15+16).
2. **Reels player + reels editor missing** — no `ReelsPlayerPage`/`ReelsEditorPage` despite Reels Center being a memorialized feature.
3. **No site-map completeness proof** — 499 pages exist but no machine-generated inventory (`docs/site-map.json`) cross-referenced against `App.tsx` route registrations to prove every page is reachable + every route mounts a real page (cross-cuts FD-15+17 sidebar wiring P0s).
4. **No "every form is enterprise-grade" audit** — no rubric (validation + a11y + inline help + autosave + audit + optimistic UI + error recovery) applied to all create/edit flows; no per-form scorecard.
5. **Media UX consistency missing** — players lack shared primitives (PiP, captions, transcript, chapters, speed, A/B loop, share-with-timestamp, keyboard shortcuts, theatre mode); each player implements its own.
6. **Donation/payment flow finalization incomplete** — multiple entry points (DonationFlowPage, PodcastDonationsPage, WebinarDonationsPage, WebinarCheckoutPage) but no unified `useCheckoutMachine` state machine, no SCA/3DS handling proof, no FCA-safe disclosures (cross-cuts FD-16 finance encryption).
7. **Mobile Firebase + splash + logo + Android/iOS readiness absent** — `grep firebase|splash|launch_image apps/mobile-flutter` returns **zero hits**; no `android/`+`ios/` platform directories surfaced; no `google-services.json`/`GoogleService-Info.plist`; no FCM/APNs wiring for push parity with FD-14 realtime.
8. **Mobile reels/media navigation absent** — no Flutter screens for vertical reels paging, podcast playback background mode, webinar low-latency, interview viewing.
9. **Mobile API parity gaps** — Flutter features `backfill_batch_11`/`12` exist but no parity matrix proving every backend endpoint has a Flutter client + cache + offline queue.
10. **Playwright coverage insufficient** — 66 specs across 18 domains averages ~3.7 per domain; FD-01–17 binding criteria require ≥150 specs (sidebar wiring × 4 portals + finance reveal-with-audit + double-entry + CMS publish + force re-accept + KPI define-preview + flag rollout + role mint + kill-switch flip + emergency banner + write-freeze + mobile force-update + media player flows + checkout SCA + reels editor save + interview player consent).
11. **No terminal+browser logic-flow validation report** — no script proving button click → API call → DB persistence → realtime push → mobile receive across critical paths (signup, post, gig purchase, hire decision, payout).
12. **Demo-data eradication unproven** — FD-14 audit found 309 files with literal arrays; no FD-18 sweep report proving they are now backed by TanStack Query server calls.
13. **Final docs not aligned** — `docs/` has 35/36/37 numbered domain files but no FD-01–18 final sign-off ledger, no site-map.json, no API reference index, no runbook index, no acceptance evidence ledger linking each gate G01–G13 to commits + Playwright runs + screenshots.
14. **No accessibility (WCAG 2.2 AA) sweep** — no axe-core CI run, no contrast audit, no keyboard-only walkthrough, no screen-reader transcript across critical surfaces (auth, checkout, players).
15. **No performance budget proof** — no Lighthouse CI, no LCP/CLS/INP per-route budget, no bundle-size report, no SSR p95 tracking.
16. **No SEO sweep** — no per-route `head()` audit (cross-cuts public showcase pages), no sitemap.xml generation, no structured data (JSON-LD) coverage report.

### P1
17. No "what's new" CHANGELOG.md aggregating FD-01–18 deltas.
18. No `.lovable/plan.md` final state checkpoint with all 18 domains marked + evidence links.
19. No screen-recording capture per critical user journey.

## 3. Run 2 build priorities (FD-18 — final closure)

### A. Surface completion
- Generate `docs/site-map.json` from a script walking `src/pages/` + comparing to router registry; fail build on orphans (page exists but unreachable) or dead links (route registered but page missing).
- Build missing pages: `interview/InterviewPlayerPage`, `reels/ReelsPlayerPage`, `reels/ReelsEditorPage` (timeline + trim + caption + sticker + audio swap + export).
- Apply enterprise-form rubric to every create/edit flow (validation/a11y/inline-help/autosave/audit/optimistic/error-recovery) with per-form scorecard `docs/qa/form-scorecard.csv`.

### B. Media UX unification
- New `src/components/media/` shared primitives: `PlayerShell`, `CaptionsTrack`, `TranscriptDrawer`, `ChaptersBar`, `SpeedMenu`, `ABLoopBar`, `ShareWithTimestamp`, `TheatreToggle`, `ShortcutsOverlay`, `PiPControl`.
- Refactor `VideoPlayerDetailPage`/`PodcastPlayerPage`/`WebinarLivePlayerPage`/`InterviewPlayerPage`/`ReelsPlayerPage` onto the shared shell.

### C. Checkout unification
- `useCheckoutMachine` state machine (idle → quote → SCA → 3DS → confirm → receipt → error), wired across all 7 checkout/donation surfaces; SCA/3DS handler; FCA-safe disclosures (regulated entity, redress, cooling-off).

### D. Mobile finalization (Flutter)
- Add Firebase (Core, Messaging, Analytics, Crashlytics, Remote Config) with `google-services.json` + `GoogleService-Info.plist`; native splash with `flutter_native_splash`; Android `android/app/build.gradle` + iOS `ios/Runner.xcworkspace` ready for store submission (signing, ProGuard, ATS).
- Reels paging screen, podcast background audio, webinar low-latency player, interview viewer, FCM push consuming FD-14 realtime channels.
- Mobile API parity matrix `docs/qa/mobile-api-parity.csv` listing every Nest endpoint × Flutter client status × cache status × offline queue status.

### E. Playwright + validation
- Expand to ≥150 specs covering every binding criterion from FD-01–17 (sidebar wiring × 4 portals, finance reveal, double-entry, CMS publish, force re-accept, KPI preview, flag rollout, role mint, kill-switch, emergency banner, write-freeze, mobile force-update, media flows, checkout SCA, reels editor, interview consent).
- `scripts/validate-flows.ts` terminal harness: button click → API → DB → realtime → mobile receive across signup, post, gig purchase, hire decision, payout.
- axe-core CI for WCAG 2.2 AA on auth/checkout/players/dashboards.
- Lighthouse CI per route with LCP < 2.5s / CLS < 0.1 / INP < 200ms budgets.
- SEO sweep + sitemap.xml + JSON-LD coverage report.

### F. Final docs alignment
- `docs/FINAL-SIGNOFF-LEDGER.md` linking every gate G01–G13 to commits + Playwright runs + screenshots.
- `docs/site-map.json` (generated).
- `docs/api-reference/` index of every Nest controller × DTO.
- `docs/runbooks/INDEX.md` listing all runbooks (queues/realtime/cs/finance/moderator/admin-ops/super-admin/cms/emergency/role-grant + new media/checkout/mobile incidents).
- `docs/qa/acceptance-evidence-ledger.md` per-domain evidence rows.
- `CHANGELOG.md` aggregating FD-01–18 deltas.
- `.lovable/plan.md` final checkpoint.

## 4. Acceptance criteria (binding — final closure)
- A1. `site-map.json` proves every page reachable + every route registered + zero orphans/dead links.
- A2. `interview/reels-player/reels-editor` shipped + on shared media primitives.
- A3. All checkout/donation surfaces on `useCheckoutMachine` with SCA/3DS + FCA disclosures proven.
- A4. Mobile ships with Firebase + splash + logo + Android/iOS store-ready + reels/podcast/webinar/interview parity + FCM consuming FD-14 realtime + mobile-API-parity matrix green.
- A5. ≥150 Playwright specs green covering all FD-01–17 binding criteria.
- A6. Terminal+browser flow harness green for signup/post/purchase/hire/payout including DB persistence + realtime push + mobile receive.
- A7. WCAG 2.2 AA axe-core CI green; Lighthouse budgets met per route; SEO sweep + sitemap.xml + JSON-LD complete.
- A8. Demo-data eradication report proves all 309 FD-14 files now server-backed.
- A9. Final docs aligned: FINAL-SIGNOFF-LEDGER + site-map.json + api-reference + runbooks INDEX + acceptance-evidence-ledger + CHANGELOG + plan.md final checkpoint.
- A10. Master Sign-Off Matrix gates G01–G13 ALL ticked with real evidence per closure rule (no pre-ticking).

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate · Run 5 ☐ Final sign-off._
