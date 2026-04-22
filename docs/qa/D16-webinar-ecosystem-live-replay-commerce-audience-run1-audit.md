# D16 — Webinar Ecosystem, Live/Replay Player, Webinar Commerce & Audience Flows — Run 1 Audit

Date: 2026-04-18 · Group: G4 (closes G4) · Status: Run 1 (Audit) complete.

## Scope coverage — strongest domain in G4

### Frontend pages (16 surfaces in `src/pages/webinars/`)
- Discovery + listing: `WebinarsPage.tsx` (**710 LOC** monolith), `WebinarDiscoveryPage.tsx` (89), `WebinarSeriesPage.tsx` (58), `WebinarLibraryPage.tsx` (78).
- Detail + flow: `WebinarDetailPage.tsx` (152), `WebinarRegistrationPage.tsx` (97), `WebinarLobbyPage.tsx` (76), `WebinarCheckoutPage.tsx` (101).
- Live + replay: `WebinarLivePlayerPage.tsx` (126), `WebinarReplayPage.tsx` (132), `WebinarChatPage.tsx` (118).
- Host + commerce: `WebinarHostStudioPage.tsx` (148), `WebinarAnalyticsPage.tsx` (116), `WebinarSettingsPage.tsx` (67), `WebinarPurchasesPage.tsx` (80), `WebinarDonationsPage.tsx` (78).

### Components
- ✅ `src/components/voice/JitsiRoom.tsx` (Jitsi-and-Voice rule honoured per `docs/architecture/domain-22-webinars.md`).
- ✅ `<VideoViewer>` (Video Viewer SDK rule) covers replay playback.
- ❌ Missing: `<WebinarLiveStage>` (host controls — mute all, spotlight, raise-hand queue, screenshare), `<WebinarChatRail>` (Q&A vs chat tabs, pin, slow-mode), `<DonationRail>` (live tip overlay), `<AttendeeRoster>`, `<WebinarCountdown>`, `<TicketTierPicker>`, `<EmailReminderPreview>`. No `src/components/webinars/` directory.

### Backend
- ✅ `apps/api-nest/src/modules/webinars/` — full module (controller / service / repository / dto / analytics / ml). Returns `{ jitsiDomain, jitsiRoom }` per docs.

### Migration
- ✅ `0046_webinars.sql` — `webinars` table with discovery + ticketing + capacity confirmed in head; per `docs/architecture/domain-22-webinars.md` also covers purchases (multi-step), donations, registrations, chat (200-msg ring buffer in repo).
- ❌ Likely missing as durable tables: `webinar_attendees` (presence), `webinar_qna` (questions vs chat), `webinar_polls` + `webinar_poll_responses`, `webinar_reminders` (email/SMS schedule), `webinar_recordings` (replay metadata distinct from `replay_url`), `webinar_email_jobs`. Chat is in-memory ring buffer per docs — **not durable**, so chat history disappears on pod restart.

### ML
- ✅ `apps/ml-python/app/webinars.py` — `/webinars/rank` + `/webinars/recommend` (600ms budget, deterministic fallback).
- ❌ Missing: `/webinars/similar`, `/webinars/transcribe-replay` (Whisper), `/webinars/auto-summary`, `/webinars/auto-chapter` (replay), `/webinars/predict-attendance`.

### SDK
- ✅ `packages/sdk/src/webinars.ts` — typed surface with multi-step purchase + Jitsi room handoff.

### Hooks
- ✅ `src/hooks/useWebinarsData.ts` — comprehensive per docs (discover, recommend, insights, detail, live-room, chat, register, purchase create+confirm, donate, realtime).

### Mobile + Tests
- ✅ `apps/mobile-flutter/lib/features/webinars/` (api + screen + 3-step checkout per docs).
- ✅ `tests/playwright/webinars.spec.ts` (discovery → detail → live-room reachability + checkout probe).

### Mock / router debt
- **0 of 16 pages** import `react-router-dom`/MOCK_ — best in G4. Only `WebinarsPage.tsx` (710 LOC) needs split.

### Realtime
- ✅ Per docs: Socket.IO `webinars`, `webinar:{id}`, user channel for receipts; events `webinar.live.started/ended`, `webinar.chat.message`, `webinar.purchase.confirmed`, `webinar.donation.captured`.

## Gaps (18 total — 4 P0 / 7 P1 / 5 P2 / 2 P3)

### P0
1. **Live chat is in-memory ring buffer** (per docs: "200-message ring buffer in the repository") — restarts/pod-rotations lose chat; replay viewers can't see chat history. Needs durable `webinar_chat_messages` table.
2. **Replay storage is local-first** (`local://webinar-replays/{id}.mp4`) — won't survive Worker restarts and isn't promotable yet. Needs R2/S3 promotion path wired (docs note "promotable to R2/S3 later").
3. **`WebinarsPage.tsx` (710 LOC)** monolith — split into per-tab routes (live now / upcoming / replays / library / hosting).
4. **No host-side stage components** — `<WebinarLiveStage>` (spotlight, mute-all, raise-hand queue, screenshare slots), `<WebinarChatRail>` (Q&A vs chat tabs, pin, slow-mode), `<DonationRail>` (live tip overlay) absent. `WebinarLivePlayerPage` (126) is too thin to host an enterprise webinar.

### P1
5. **No durable Q&A** — Q&A typically separate from chat (vote, answered-flag, pin); not present.
6. **No polls** — `webinar_polls` + responses + live result push absent.
7. **No reminder pipeline** — registered attendees should receive T-24h / T-1h / "we're live" emails + SMS; no `webinar_reminders` worker.
8. **No replay transcription/chapters/summary** — Whisper STT on `recording_url` + auto-chapter + auto-summary absent.
9. **No moderation** — chat profanity filter, attendee kick/ban, IP-based rate-limit not modelled.
10. **No OpenSearch** ingest for webinar title/description/topic/transcript/host text search.
11. **No certificate/badge** — paid CPE webinars commonly issue a downloadable certificate after replay 80%+ watched; absent.

### P2
12. **No host bandwidth fallback** — Jitsi audio-only mode toggle for low-bandwidth attendees.
13. **No co-host / panellist invite flow** — single-host assumption.
14. **Entitlement gating** missing — Free/Pro caps on attendee count, recording length, replay retention (`mem://features/access-gating`).
15. **No GDPR** export/erase for attendee + chat history.
16. **Analytics depth** — no drop-off heatmap, geo, source attribution, conversion funnel from registration → attended → bought.

### P3
17. **Playwright** — `webinars.spec.ts` is probe-only; needs full register → join lobby → live-room → chat → donate → leave → replay-resume → certificate flow.
18. **Mobile parity** — Flutter screen exists but verify lobby + live + chat + donation parity.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## G4 Audit Closure (D13 + D14 + D15 + D16)

**Total gaps across G4 = 86** (24 D13 + 24 D14 + 22 D15 + 18 D16 = wait recount: 22+24+22+18 = 86).
- **P0 = 24** (6 + 8 + 6 + 4) · **P1 = 31** (8 + 8 + 8 + 7) · **P2 = 24** (6 + 6 + 6 + 5) · **P3 = 8** (2 + 2 + 2 + 2).

**Cross-domain themes:**
- **Transcoding stub** (D13 root cause) blocks D14 reels HLS ladder, D15 podcast LUFS/waveform, D16 replay variants — single highest-leverage fix.
- **No Whisper transcription pipeline** anywhere (D13 files, D14 reels captions, D15 podcast transcripts, D16 webinar replays).
- **Music-grade / TikTok-grade / live-stage primitives** missing — D14 `<ReelsFeed/Player/Editor>`, D15 `<PodcastPlayer>`, D16 `<WebinarLiveStage>` all need build.
- **Monoliths to split**: `CreationStudioPage` (984 D14), `PodcastsPage` (860 D15), `WebinarsPage` (710 D16), `MediaViewerPage` (657 D13).
- **D14 is the worst** — 17 pages still on react-router-dom + MOCK_, no SDK, no backend modules. D16 is the best — full SDK + module + zero mock debt.
- **Commerce wiring** — D15 (purchases/subs/donations) and D16 (purchases/donations) need Stripe checkout + webhook → durable tables; built-in payments path required (Lovable Cloud).
- **D13 missing `files`/`attachments` NestJS module** is the bottleneck for any upload flow in D14 (reel uploads), D15 (podcast audio), D16 (replays + slides).

## Evidence
- 16 pages in `src/pages/webinars/` (top: `WebinarsPage.tsx` 710); 0 use `react-router-dom`/MOCK_.
- Backend: `apps/api-nest/src/modules/webinars/` (full module).
- Migration: `packages/db/migrations/0046_webinars.sql` (webinars + multi-step purchases + donations + registrations per docs).
- ML: `apps/ml-python/app/webinars.py` (rank + recommend).
- SDK: `packages/sdk/src/webinars.ts`. Hook: `src/hooks/useWebinarsData.ts`.
- Components: `src/components/voice/JitsiRoom.tsx`, `<VideoViewer>` for replay.
- Mobile: `apps/mobile-flutter/lib/features/webinars/`. Tests: `tests/playwright/webinars.spec.ts`.
- Architecture: `docs/architecture/domain-22-webinars.md`.

## Recommended Run 2 (Build) priorities
1. Add migration `0082_webinar_persistence.sql`: `webinar_chat_messages` (durable, replaces ring buffer), `webinar_qna`, `webinar_polls` + `_responses`, `webinar_reminders`, `webinar_recordings`, `webinar_attendees` (presence + watch-through), `webinar_certificates`.
2. Build `<WebinarLiveStage>` + `<WebinarChatRail>` (Chat / Q&A tabs, pin, slow-mode) + `<DonationRail>` + `<AttendeeRoster>` + `<TicketTierPicker>` + `<WebinarCountdown>` under `src/components/webinars/`.
3. Split `WebinarsPage.tsx` (710) into per-tab routes.
4. Promote replay storage from `local://` to R2/S3 via `apps/integrations/src/storage/`; add public CDN signing.
5. Add reminders worker (T-24h / T-1h / live-now via SendGrid + SMS).
6. Add Whisper transcription + auto-chapter + auto-summary on replay (`/webinars/transcribe-replay`).
7. Add chat moderation (profanity filter, attendee kick/ban, slow-mode, rate-limit).
8. Add OpenSearch ingest for webinars (title/desc/topic/transcript/host).
9. Add certificate generator (PDF) on 80%+ replay watch-through.
10. Wire Lovable Cloud built-in payments for ticketing + donations end-to-end (replace simulated capture in docs).
11. Expand Playwright to cover register → lobby → live → chat → poll → donate → replay-resume → certificate.
12. Verify Flutter parity for lobby + chat + Q&A + donations.
