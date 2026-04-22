# Vol 2 — Buttons, Forms, Validation, WebRTC State Machine, Mobile Parity, Security, Demo

> Companion to `Gigvora-Master-Audit-Vol2.docx`. Verified counts from `/dev-server/src` on 2026-04-22.

## Headline metrics

| Metric | Value | Implication |
|---|---|---|
| Total `<Button>` / `<button>` in src/pages | **4,326** | Heavy click surface |
| Buttons with NO `onClick` / `asChild` / `type="submit"` | **2,082 (48.1%)** | ~2,000 dead clicks |
| Total routes | **635** | Large SPA |
| Real `<form>` / `useForm()` instances | **12** | One per ~53 routes |
| Zod schemas | **0** | No runtime validation |
| Toast invocations | **976** | Toasts without real submits |
| Drawer/Sheet files | **109** | Drawer over-use |
| Real WebRTC instantiations | **0** | Calls/rooms presentational |
| `supabase.channel(...)` | **0** | Realtime not wired |
| `adminAuth` localStorage gate | **1 file** | Critical risk |
| Shells with AutoBackNav | **2 of 7** | ~400 routes lack back |

## Top 15 button-dense pages (line-by-line audit required)

1. `finance/BillingPage.tsx` — 51
2. `ads/AdsManagerPage.tsx` — 49
3. `jobs/JobsPages.tsx` — 48
4. `finance/WalletPage.tsx` — 47
5. `recruiter/RecruiterTalentSearchPage.tsx` — 46
6. `finance/PayoutsPage.tsx` — 46
7. `projects/ProjectWorkspacePage.tsx` — 44
8. `jobs/ApplicationTrackerPage.tsx` — 41
9. `community/CommunityGroupsPage.tsx` — 41
10. `InboxPage.tsx` — 39
11. `FeedPage.tsx` — 39
12. `networking/NetworkingSessionsPage.tsx` — 38
13. `community/CreationStudioPage.tsx` — 38
14. `ProfilePage.tsx` — 38
15. `services/ServicesMarketplacePage.tsx` — 37

## CI guard for dead buttons

```bash
grep -rE "<Button[^>]*>" src/pages | grep -vE "onClick|asChild|type=.submit|disabled" | wc -l
# must equal 0
```

## See DOCX for

- §1 button-class wiring discipline
- §2 40-form field-level enrichment matrix + form-wide UX rules
- §3 WebRTC state machine (states, transitions, quality sampler)
- §4 mobile parity matrix
- §5 security hardening matrix (16 risks)
- §6 demo mode design
- §7 per-family Definition of Done
